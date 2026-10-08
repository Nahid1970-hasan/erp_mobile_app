from rest_framework import serializers

from .models import (
    Approval,
    Attendance,
    LeaveRequest,
    Notice,
    Notification,
    Payslip,
    ProductionEntry,
    ProductionLine,
    QCInspection,
    SalesOrder,
    Shipment,
    StockItem,
    StockMovement,
    Style,
)


class StyleSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)

    class Meta:
        model = Style
        fields = ("id", "style_no", "name", "season", "buyer_name")


class SalesOrderSerializer(serializers.ModelSerializer):
    style_no = serializers.CharField(source="style.style_no", read_only=True)
    style_name = serializers.CharField(source="style.name", read_only=True)
    buyer_name = serializers.CharField(source="style.buyer.name", read_only=True)

    class Meta:
        model = SalesOrder
        fields = (
            "id",
            "po_number",
            "qty",
            "shipped_qty",
            "status",
            "ex_factory",
            "destination",
            "style_no",
            "style_name",
            "buyer_name",
        )


class ApprovalSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    requester_role = serializers.CharField(source="requester.designation", read_only=True)
    decided_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Approval
        fields = (
            "id",
            "kind",
            "title",
            "reference",
            "amount",
            "summary",
            "payload",
            "status",
            "comment",
            "created_at",
            "decided_at",
            "requester_name",
            "requester_role",
            "decided_by_name",
        )

    def get_requester_name(self, obj):
        return obj.requester.get_full_name()

    def get_decided_by_name(self, obj):
        if obj.decided_by_id is None:
            return ""
        return obj.decided_by.get_full_name()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "title", "body", "is_read", "created_at")


class ProductionLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLine
        fields = ("id", "code", "name", "target_per_hour", "operators")


class ProductionEntrySerializer(serializers.ModelSerializer):
    line_name = serializers.CharField(source="line.name", read_only=True)
    line_code = serializers.CharField(source="line.code", read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductionEntry
        fields = (
            "id",
            "line",
            "line_name",
            "line_code",
            "work_date",
            "hour",
            "output_qty",
            "reject_qty",
            "note",
            "recorded_by_name",
            "created_at",
        )

    def get_recorded_by_name(self, obj):
        return obj.recorded_by.get_full_name()


class ProductionCreateSerializer(serializers.Serializer):
    line = serializers.PrimaryKeyRelatedField(queryset=ProductionLine.objects.all())
    hour = serializers.IntegerField(min_value=0, max_value=23)
    output_qty = serializers.IntegerField(min_value=0)
    reject_qty = serializers.IntegerField(min_value=0, required=False, default=0)
    note = serializers.CharField(allow_blank=True, required=False, default="")


class QCSerializer(serializers.ModelSerializer):
    style_no = serializers.CharField(source="style.style_no", read_only=True)
    style_name = serializers.CharField(source="style.name", read_only=True)
    inspector_name = serializers.SerializerMethodField()

    class Meta:
        model = QCInspection
        fields = (
            "id",
            "style",
            "style_no",
            "style_name",
            "result",
            "defect",
            "sample_size",
            "defect_qty",
            "note",
            "inspector_name",
            "created_at",
        )

    def get_inspector_name(self, obj):
        return obj.inspector.get_full_name()


class QCCreateSerializer(serializers.Serializer):
    style = serializers.PrimaryKeyRelatedField(queryset=Style.objects.all())
    result = serializers.ChoiceField(choices=QCInspection.Result.choices)
    defect = serializers.CharField(allow_blank=True, required=False, default="")
    sample_size = serializers.IntegerField(min_value=1)
    defect_qty = serializers.IntegerField(min_value=0, required=False, default=0)
    note = serializers.CharField(allow_blank=True, required=False, default="")

    def validate(self, attrs):
        if attrs["result"] == QCInspection.Result.FAIL and not attrs.get("defect", "").strip():
            raise serializers.ValidationError("Name the defect when the result is fail.")
        if attrs.get("defect_qty", 0) > attrs["sample_size"]:
            raise serializers.ValidationError("Defect quantity cannot exceed the sample size.")
        return attrs


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ("id", "work_date", "check_in", "check_out")


class LeaveSerializer(serializers.ModelSerializer):
    reference = serializers.CharField(source="approval.reference", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ("id", "leave_type", "start_date", "end_date", "reason", "status", "reference")


class LeaveCreateSerializer(serializers.Serializer):
    leave_type = serializers.ChoiceField(choices=LeaveRequest.LeaveType.choices)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField(max_length=500)

    def validate(self, attrs):
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError("End date cannot be before the start date.")
        return attrs


class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = ("id", "period", "basic", "allowance", "deduction", "net")


class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ("id", "title", "body", "published_at")


class ShipmentSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(source="order.po_number", read_only=True)
    style_name = serializers.CharField(source="order.style.name", read_only=True)

    class Meta:
        model = Shipment
        fields = (
            "id",
            "reference",
            "po_number",
            "style_name",
            "destination",
            "status",
            "etd",
            "eta",
            "cartons",
            "note",
        )


class StockItemSerializer(serializers.ModelSerializer):
    low = serializers.SerializerMethodField()

    class Meta:
        model = StockItem
        fields = ("id", "sku", "name", "uom", "qty_on_hand", "reorder_level", "location", "low")

    def get_low(self, obj):
        return obj.qty_on_hand <= obj.reorder_level


class StockMovementSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(source="item.sku", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    moved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = ("id", "sku", "item_name", "kind", "qty", "reference", "moved_by_name", "created_at")

    def get_moved_by_name(self, obj):
        return obj.moved_by.get_full_name()


class MovementCreateSerializer(serializers.Serializer):
    sku = serializers.CharField()
    kind = serializers.ChoiceField(choices=StockMovement.Kind.choices)
    qty = serializers.IntegerField(min_value=1)
    reference = serializers.CharField(max_length=80)
