from django.contrib import admin

from .models import (
    Approval,
    Attendance,
    Buyer,
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

admin.site.register(Buyer)
admin.site.register(Style)
admin.site.register(SalesOrder)
admin.site.register(Approval)
admin.site.register(LeaveRequest)
admin.site.register(Notification)
admin.site.register(ProductionLine)
admin.site.register(ProductionEntry)
admin.site.register(QCInspection)
admin.site.register(Attendance)
admin.site.register(Payslip)
admin.site.register(Notice)
admin.site.register(Shipment)
admin.site.register(StockItem)
admin.site.register(StockMovement)
