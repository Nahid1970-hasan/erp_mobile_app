from datetime import timedelta

from django.db.models import Count, F, Q, Sum
from django.utils import timezone

from .models import Approval, ProductionLine, SalesOrder, Shipment, StockItem


def today():
    return timezone.localdate()


def at_risk_orders():
    horizon = today() + timedelta(days=7)
    return (
        SalesOrder.objects.select_related("style", "style__buyer")
        .filter(
            Q(status=SalesOrder.Status.AT_RISK)
            | Q(
                ex_factory__lte=horizon,
                status__in=[SalesOrder.Status.CONFIRMED, SalesOrder.Status.IN_PRODUCTION],
            )
        )
        .distinct()
    )


def low_stock():
    return StockItem.objects.filter(qty_on_hand__lte=F("reorder_level"))


def line_board(day=None):
    day = day or today()
    rows = []
    output_total = 0
    target_total = 0
    reject_total = 0
    for line in ProductionLine.objects.all():
        totals = line.entries.filter(work_date=day).aggregate(
            output=Sum("output_qty"),
            rejects=Sum("reject_qty"),
            hours=Count("id"),
        )
        output = totals["output"] or 0
        rejects = totals["rejects"] or 0
        hours = totals["hours"] or 0
        target = line.target_per_hour * hours
        output_total += output
        target_total += target
        reject_total += rejects
        efficiency = round(output * 100 / target, 1) if target else 0
        rows.append(
            {
                "id": line.id,
                "code": line.code,
                "name": line.name,
                "operators": line.operators,
                "target_per_hour": line.target_per_hour,
                "hours": hours,
                "output": output,
                "rejects": rejects,
                "target": target,
                "efficiency": efficiency,
            }
        )
    efficiency = round(output_total * 100 / target_total, 1) if target_total else 0
    return {
        "output_today": output_total,
        "target_today": target_total,
        "rejects_today": reject_total,
        "efficiency": efficiency,
        "lines": rows,
    }


def pending_approvals_for(user):
    qs = Approval.objects.filter(status=Approval.Status.PENDING)
    if user.role not in {"manager", "merchandiser"}:
        qs = qs.filter(requester=user)
    return qs


def status_counts(model):
    return list(model.objects.values("status").annotate(count=Count("id")).order_by("status"))


def shipment_counts():
    return status_counts(Shipment)
