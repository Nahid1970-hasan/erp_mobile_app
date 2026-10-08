from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .assistant import answer_question
from .metrics import at_risk_orders, line_board, low_stock, pending_approvals_for, shipment_counts, status_counts
from .models import (
    Approval,
    Attendance,
    LeaveRequest,
    Notice,
    Notification,
    Payslip,
    ProductionEntry,
    QCInspection,
    SalesOrder,
    Shipment,
    StockItem,
    StockMovement,
    ProductionLine,
    Style,
)
from .serializers import (
    ApprovalSerializer,
    AttendanceSerializer,
    LeaveCreateSerializer,
    LeaveSerializer,
    MovementCreateSerializer,
    NoticeSerializer,
    NotificationSerializer,
    PayslipSerializer,
    ProductionCreateSerializer,
    ProductionEntrySerializer,
    ProductionLineSerializer,
    QCCreateSerializer,
    QCSerializer,
    SalesOrderSerializer,
    ShipmentSerializer,
    StockItemSerializer,
    StockMovementSerializer,
    StyleSerializer,
)


def page(request):
    try:
        number = int(request.query_params.get("page", 1))
    except (TypeError, ValueError):
        number = 1
    return max(number, 1)


def paged(request, queryset, serializer):
    size = 20
    number = page(request)
    start = (number - 1) * size
    total = queryset.count()
    return {
        "count": total,
        "page": number,
        "results": serializer(queryset[start : start + size], many=True).data,
    }


def invalid(serializer):
    errors = serializer.errors
    if "non_field_errors" in errors:
        return str(errors["non_field_errors"][0])
    for key, value in errors.items():
        text = value[0] if isinstance(value, list) else value
        label = key.replace("_", " ")
        return str(text) if key == "non_field_errors" else f"{label}: {text}"
    return "Please check the form."


def bad(message, status=400):
    return Response({"detail": message}, status=status)


FLOOR_WRITERS = {User.Role.MANAGER, User.Role.SUPERVISOR}
STORE_WRITERS = {User.Role.MANAGER, User.Role.STORE}
SHIPMENT_WRITERS = {User.Role.MANAGER, User.Role.SUPERVISOR, User.Role.STORE}
STOCK_READERS = {User.Role.MANAGER, User.Role.STORE, User.Role.SUPERVISOR, User.Role.MERCHANDISER}


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"ok": True, "service": "dekko-isho"})


class DashboardView(APIView):
    def get(self, request):
        board = line_board()
        alerts = Notification.objects.filter(user=request.user)[:5]
        return Response(
            {
                "kpis": {
                    "output_today": board["output_today"],
                    "target_today": board["target_today"],
                    "rejects_today": board["rejects_today"],
                    "efficiency": board["efficiency"],
                    "at_risk_orders": at_risk_orders().count(),
                    "pending_approvals": pending_approvals_for(request.user).count(),
                    "low_stock": low_stock().count(),
                },
                "lines": board["lines"],
                "orders_by_status": status_counts(SalesOrder),
                "shipments_by_status": shipment_counts(),
                "notifications": NotificationSerializer(alerts, many=True).data,
            }
        )


class OrderListView(APIView):
    def get(self, request):
        qs = SalesOrder.objects.select_related("style", "style__buyer")
        return Response(paged(request, qs, SalesOrderSerializer))


class StyleListView(APIView):
    def get(self, request):
        return Response(StyleSerializer(Style.objects.select_related("buyer"), many=True).data)


class ApprovalListView(APIView):
    def get(self, request):
        qs = Approval.objects.select_related("requester", "decided_by")
        if request.user.role not in {User.Role.MANAGER, User.Role.MERCHANDISER}:
            qs = qs.filter(requester=request.user)
        kind = request.query_params.get("kind")
        status = request.query_params.get("status")
        if kind:
            qs = qs.filter(kind=kind)
        if status:
            qs = qs.filter(status=status)
        return Response(paged(request, qs, ApprovalSerializer))


class ApprovalDetailView(APIView):
    def get(self, request, pk):
        try:
            approval = Approval.objects.select_related("requester", "decided_by").get(pk=pk)
        except Approval.DoesNotExist:
            return bad("Approval not found.", 404)
        if request.user.role not in {User.Role.MANAGER, User.Role.MERCHANDISER} and approval.requester_id != request.user.id:
            return bad("You cannot open this approval.", 403)
        return Response(ApprovalSerializer(approval).data)


class ApprovalDecideView(APIView):
    def post(self, request, pk):
        if request.user.role != User.Role.MANAGER:
            return bad("Only a manager can approve or reject.", 403)
        action = request.data.get("action")
        if action not in {"approve", "reject"}:
            return bad("Action must be approve or reject.")
        comment = (request.data.get("comment") or "").strip()
        if action == "reject" and not comment:
            return bad("Add a comment when rejecting.")
        try:
            approval = Approval.objects.select_related("requester").get(pk=pk)
        except Approval.DoesNotExist:
            return bad("Approval not found.", 404)
        if approval.status != Approval.Status.PENDING:
            return bad("This request is already decided.")
        approval.status = Approval.Status.APPROVED if action == "approve" else Approval.Status.REJECTED
        approval.comment = comment
        approval.decided_by = request.user
        approval.decided_at = timezone.now()
        approval.save()
        try:
            leave = approval.leave
        except LeaveRequest.DoesNotExist:
            leave = None
        if leave is not None:
            leave.status = approval.status
            leave.save(update_fields=["status"])
        verb = "approved" if action == "approve" else "rejected"
        Notification.objects.create(
            user=approval.requester,
            title=f"{approval.reference} {verb}",
            body=comment or f"Your {approval.get_kind_display().lower()} was {verb}.",
        )
        return Response(ApprovalSerializer(approval).data)


class ProductionLineListView(APIView):
    def get(self, request):
        return Response(ProductionLineSerializer(ProductionLine.objects.all(), many=True).data)


class ProductionEntryView(APIView):
    def get(self, request):
        day = request.query_params.get("date") or timezone.localdate().isoformat()
        qs = ProductionEntry.objects.select_related("line", "recorded_by").filter(work_date=day)
        return Response(ProductionEntrySerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role not in FLOOR_WRITERS:
            return bad("Only a supervisor or manager can record output.", 403)
        serializer = ProductionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return bad(invalid(serializer))
        data = serializer.validated_data
        try:
            entry = ProductionEntry.objects.create(
                line=data["line"],
                recorded_by=request.user,
                work_date=timezone.localdate(),
                hour=data["hour"],
                output_qty=data["output_qty"],
                reject_qty=data["reject_qty"],
                note=data["note"],
            )
        except IntegrityError:
            return bad("Output for this line and hour is already recorded.")
        entry = ProductionEntry.objects.select_related("line", "recorded_by").get(pk=entry.pk)
        return Response(ProductionEntrySerializer(entry).data, status=201)


class QCView(APIView):
    def get(self, request):
        qs = QCInspection.objects.select_related("style", "inspector")[:30]
        return Response(QCSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role not in FLOOR_WRITERS:
            return bad("Only a supervisor or manager can record QC.", 403)
        serializer = QCCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return bad(invalid(serializer))
        data = serializer.validated_data
        inspection = QCInspection.objects.create(inspector=request.user, **data)
        inspection = QCInspection.objects.select_related("style", "inspector").get(pk=inspection.pk)
        return Response(QCSerializer(inspection).data, status=201)


class AttendanceView(APIView):
    def get(self, request):
        history = Attendance.objects.filter(user=request.user)[:14]
        today_row = Attendance.objects.filter(user=request.user, work_date=timezone.localdate()).first()
        return Response(
            {
                "today": AttendanceSerializer(today_row).data if today_row else None,
                "history": AttendanceSerializer(history, many=True).data,
            }
        )


class AttendanceClockView(APIView):
    def post(self, request):
        now = timezone.localtime().time().replace(microsecond=0)
        row, _created = Attendance.objects.get_or_create(user=request.user, work_date=timezone.localdate())
        if row.check_in is None:
            row.check_in = now
            row.save(update_fields=["check_in"])
        elif row.check_out is None:
            if now <= row.check_in:
                return bad("Check-out must be after check-in.")
            row.check_out = now
            row.save(update_fields=["check_out"])
        else:
            return bad("Attendance for today is already complete.")
        return Response(AttendanceSerializer(row).data)


class LeaveView(APIView):
    def get(self, request):
        qs = LeaveRequest.objects.filter(user=request.user).select_related("approval")
        return Response(LeaveSerializer(qs, many=True).data)

    def post(self, request):
        serializer = LeaveCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return bad(invalid(serializer))
        data = serializer.validated_data
        with transaction.atomic():
            reference = timezone.localtime().strftime(f"LV-%y%m%d%H%M%S-{request.user.id}")
            approval = Approval.objects.create(
                kind=Approval.Kind.LEAVE,
                title=f"{data['leave_type'].title()} leave",
                reference=reference,
                requester=request.user,
                summary=data["reason"],
                payload={
                    "leave_type": data["leave_type"],
                    "start": data["start_date"].isoformat(),
                    "end": data["end_date"].isoformat(),
                },
            )
            leave = LeaveRequest.objects.create(user=request.user, approval=approval, **data)
            managers = User.objects.filter(role=User.Role.MANAGER)
            Notification.objects.bulk_create(
                [
                    Notification(
                        user=manager,
                        title=f"Leave request {reference}",
                        body=f"{request.user.get_full_name()} requested {data['leave_type']} leave.",
                    )
                    for manager in managers
                ]
            )
        return Response(LeaveSerializer(leave).data, status=201)


class PayslipListView(APIView):
    def get(self, request):
        qs = Payslip.objects.filter(user=request.user)
        return Response(PayslipSerializer(qs, many=True).data)


class NoticeListView(APIView):
    def get(self, request):
        return Response(NoticeSerializer(Notice.objects.all(), many=True).data)


class ShipmentListView(APIView):
    def get(self, request):
        qs = Shipment.objects.select_related("order", "order__style")
        return Response(paged(request, qs, ShipmentSerializer))


class ShipmentStatusView(APIView):
    def post(self, request, pk):
        if request.user.role not in SHIPMENT_WRITERS:
            return bad("You cannot update shipment status.", 403)
        status = request.data.get("status")
        if status not in Shipment.Status.values:
            return bad("Unknown shipment status.")
        try:
            shipment = Shipment.objects.select_related("order", "order__style").get(pk=pk)
        except Shipment.DoesNotExist:
            return bad("Shipment not found.", 404)
        shipment.status = status
        shipment.save(update_fields=["status"])
        return Response(ShipmentSerializer(shipment).data)


class StockItemListView(APIView):
    def get(self, request):
        if request.user.role not in STOCK_READERS:
            return bad("Store figures are limited to store, floor, and merchandising roles.", 403)
        return Response(StockItemSerializer(StockItem.objects.all(), many=True).data)


class StockMovementView(APIView):
    def get(self, request):
        if request.user.role not in STOCK_READERS:
            return bad("Store figures are limited to store, floor, and merchandising roles.", 403)
        qs = StockMovement.objects.select_related("item", "moved_by")[:20]
        return Response(StockMovementSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role not in STORE_WRITERS:
            return bad("Only store or a manager can receive or issue goods.", 403)
        serializer = MovementCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return bad(invalid(serializer))
        data = serializer.validated_data
        with transaction.atomic():
            try:
                item = StockItem.objects.select_for_update().get(sku__iexact=data["sku"].strip())
            except StockItem.DoesNotExist:
                return bad("No material matches that SKU or barcode.")
            if data["kind"] == StockMovement.Kind.ISSUE and item.qty_on_hand < data["qty"]:
                return bad(f"Only {item.qty_on_hand} {item.uom} on hand.")
            if data["kind"] == StockMovement.Kind.RECEIVE:
                item.qty_on_hand += data["qty"]
            else:
                item.qty_on_hand -= data["qty"]
            item.save(update_fields=["qty_on_hand"])
            movement = StockMovement.objects.create(
                item=item,
                kind=data["kind"],
                qty=data["qty"],
                reference=data["reference"],
                moved_by=request.user,
            )
        movement = StockMovement.objects.select_related("item", "moved_by").get(pk=movement.pk)
        return Response(StockMovementSerializer(movement).data, status=201)


class NotificationListView(APIView):
    def get(self, request):
        qs = Notification.objects.filter(user=request.user)
        return Response(paged(request, qs, NotificationSerializer))


class NotificationReadView(APIView):
    def post(self, request, pk):
        try:
            note = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return bad("Alert not found.", 404)
        note.is_read = True
        note.save(update_fields=["is_read"])
        return Response(NotificationSerializer(note).data)


class NotificationReadAllView(APIView):
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"ok": True})


class AssistantView(APIView):
    def post(self, request):
        question = request.data.get("question", "")
        if not isinstance(question, str) or len(question) > 500:
            return bad("Ask a question of 500 characters or fewer.")
        return Response({"answer": answer_question(request.user, question)})
