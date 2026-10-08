from django.conf import settings
from django.db import models


class Buyer(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=12, unique=True)
    country = models.CharField(max_length=80)

    def __str__(self):
        return self.name


class Style(models.Model):
    buyer = models.ForeignKey(Buyer, related_name="styles", on_delete=models.PROTECT)
    style_no = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=120)
    season = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.style_no} {self.name}"


class SalesOrder(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        IN_PRODUCTION = "in_production", "In production"
        READY = "ready", "Ready"
        SHIPPED = "shipped", "Shipped"
        AT_RISK = "at_risk", "At risk"

    style = models.ForeignKey(Style, related_name="orders", on_delete=models.PROTECT)
    po_number = models.CharField(max_length=40, unique=True)
    qty = models.PositiveIntegerField()
    shipped_qty = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices)
    ex_factory = models.DateField()
    destination = models.CharField(max_length=80)

    class Meta:
        ordering = ["ex_factory"]

    def __str__(self):
        return self.po_number


class Approval(models.Model):
    class Kind(models.TextChoices):
        REQUISITION = "requisition", "Purchase requisition"
        LEAVE = "leave", "Leave"
        WORK_ORDER = "work_order", "Work order"
        COSTING = "costing", "Costing sign-off"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    kind = models.CharField(max_length=20, choices=Kind.choices)
    title = models.CharField(max_length=160)
    reference = models.CharField(max_length=40, unique=True)
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="requests", on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    summary = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    comment = models.TextField(blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="decisions",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class LeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        CASUAL = "casual", "Casual"
        SICK = "sick", "Sick"
        EARNED = "earned", "Earned"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="leaves", on_delete=models.CASCADE)
    approval = models.OneToOneField(Approval, related_name="leave", on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Approval.Status.choices, default=Approval.Status.PENDING)

    class Meta:
        ordering = ["-start_date"]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    title = models.CharField(max_length=140)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ProductionLine(models.Model):
    code = models.CharField(max_length=12, unique=True)
    name = models.CharField(max_length=80)
    target_per_hour = models.PositiveIntegerField()
    operators = models.PositiveIntegerField()

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.name


class ProductionEntry(models.Model):
    line = models.ForeignKey(ProductionLine, related_name="entries", on_delete=models.CASCADE)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="production_entries", on_delete=models.PROTECT)
    work_date = models.DateField()
    hour = models.PositiveSmallIntegerField()
    output_qty = models.PositiveIntegerField()
    reject_qty = models.PositiveIntegerField(default=0)
    note = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-work_date", "-hour"]
        constraints = [
            models.UniqueConstraint(fields=["line", "work_date", "hour"], name="unique_line_hour"),
        ]


class QCInspection(models.Model):
    class Result(models.TextChoices):
        PASS = "pass", "Pass"
        FAIL = "fail", "Fail"

    style = models.ForeignKey(Style, related_name="inspections", on_delete=models.PROTECT)
    inspector = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="inspections", on_delete=models.PROTECT)
    result = models.CharField(max_length=10, choices=Result.choices)
    defect = models.CharField(max_length=120, blank=True)
    sample_size = models.PositiveIntegerField()
    defect_qty = models.PositiveIntegerField(default=0)
    note = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Attendance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="attendance", on_delete=models.CASCADE)
    work_date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)

    class Meta:
        ordering = ["-work_date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "work_date"], name="unique_attendance_day"),
        ]


class Payslip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="payslips", on_delete=models.CASCADE)
    period = models.DateField()
    basic = models.DecimalField(max_digits=12, decimal_places=2)
    allowance = models.DecimalField(max_digits=12, decimal_places=2)
    deduction = models.DecimalField(max_digits=12, decimal_places=2)
    net = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["-period"]
        constraints = [
            models.UniqueConstraint(fields=["user", "period"], name="unique_payslip_period"),
        ]


class Notice(models.Model):
    title = models.CharField(max_length=160)
    body = models.TextField()
    published_at = models.DateTimeField()

    class Meta:
        ordering = ["-published_at"]


class Shipment(models.Model):
    class Status(models.TextChoices):
        BOOKING = "booking", "Booking"
        IN_TRANSIT = "in_transit", "In transit"
        CUSTOMS = "customs", "Customs"
        DELIVERED = "delivered", "Delivered"

    order = models.ForeignKey(SalesOrder, related_name="shipments", on_delete=models.CASCADE)
    reference = models.CharField(max_length=40, unique=True)
    destination = models.CharField(max_length=80)
    status = models.CharField(max_length=20, choices=Status.choices)
    etd = models.DateField()
    eta = models.DateField()
    cartons = models.PositiveIntegerField()
    note = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ["eta"]


class StockItem(models.Model):
    sku = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=120)
    uom = models.CharField(max_length=20)
    qty_on_hand = models.PositiveIntegerField()
    reorder_level = models.PositiveIntegerField()
    location = models.CharField(max_length=40)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.sku} {self.name}"


class StockMovement(models.Model):
    class Kind(models.TextChoices):
        RECEIVE = "receive", "Receive"
        ISSUE = "issue", "Issue"

    item = models.ForeignKey(StockItem, related_name="movements", on_delete=models.PROTECT)
    kind = models.CharField(max_length=12, choices=Kind.choices)
    qty = models.PositiveIntegerField()
    reference = models.CharField(max_length=80)
    moved_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="stock_movements", on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
