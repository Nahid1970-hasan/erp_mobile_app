from datetime import time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from operations.models import (
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

DEMO_USERS = ["rahim", "sadia", "karim", "farhana", "nusrat"]
PASSWORD = "Dekko@123"


class Command(BaseCommand):
    help = "Load Dekko Isho garments demo data. Replaces previous demo records."

    @transaction.atomic
    def handle(self, *args, **options):
        self._clear()
        people = self._people()
        styles, orders = self._orders()
        lines = self._production(people["karim"])
        self._qc(people["karim"], styles)
        self._approvals(people)
        self._hr(people)
        self._shipments(orders)
        self._store(people["farhana"])
        self._alerts(people, lines)
        self.stdout.write(self.style.SUCCESS("Demo data ready. Password for every account: Dekko@123"))

    def _clear(self):
        StockMovement.objects.all().delete()
        StockItem.objects.all().delete()
        Shipment.objects.all().delete()
        QCInspection.objects.all().delete()
        ProductionEntry.objects.all().delete()
        ProductionLine.objects.all().delete()
        LeaveRequest.objects.all().delete()
        Notification.objects.all().delete()
        Approval.objects.all().delete()
        Payslip.objects.all().delete()
        Attendance.objects.all().delete()
        Notice.objects.all().delete()
        SalesOrder.objects.all().delete()
        Style.objects.all().delete()
        Buyer.objects.all().delete()
        User.objects.filter(username__in=DEMO_USERS).delete()

    def _people(self):
        specs = [
            ("rahim", "Rahim", "Uddin", User.Role.MANAGER, "EMP-1001", "Operations", "General Manager", True),
            ("sadia", "Sadia", "Islam", User.Role.MERCHANDISER, "EMP-1044", "Merchandising", "Merchandiser", False),
            ("karim", "Karim", "Hossain", User.Role.SUPERVISOR, "EMP-2210", "Sewing", "Line Supervisor", False),
            ("farhana", "Farhana", "Akter", User.Role.STORE, "EMP-1188", "Store", "Store Keeper", False),
            ("nusrat", "Nusrat", "Jahan", User.Role.EMPLOYEE, "EMP-3302", "Sewing", "Sewing Operator", False),
        ]
        people = {}
        for username, first, last, role, code, dept, title, staff in specs:
            people[username] = User.objects.create_user(
                username=username,
                password=PASSWORD,
                first_name=first,
                last_name=last,
                email=f"{username}@dekko.local",
                role=role,
                employee_code=code,
                department=dept,
                designation=title,
                phone="+8801700000000",
                is_staff=staff,
                is_superuser=staff,
            )
        return people

    def _orders(self):
        day = timezone.localdate()
        north = Buyer.objects.create(name="Northline Apparel", code="NL", country="Germany")
        harbor = Buyer.objects.create(name="Harbor & Co", code="HB", country="United Kingdom")
        lumen = Buyer.objects.create(name="Lumen Kids", code="LK", country="Sweden")
        atlas = Buyer.objects.create(name="Atlas Sport", code="AT", country="Spain")
        polo = Style.objects.create(buyer=north, style_no="NL-2408", name="Pique Polo", season="SS27")
        oxford = Style.objects.create(buyer=harbor, style_no="HB-1182", name="Oxford Shirt", season="AW26")
        tee = Style.objects.create(buyer=lumen, style_no="LK-5520", name="Kids Tee", season="SS27")
        jacket = Style.objects.create(buyer=atlas, style_no="AT-0904", name="Hooded Jacket", season="AW26")
        orders = {
            "polo": SalesOrder.objects.create(
                style=polo, po_number="PO-24081", qty=24000, shipped_qty=0,
                status=SalesOrder.Status.IN_PRODUCTION, ex_factory=day + timedelta(days=18), destination="Hamburg",
            ),
            "risk": SalesOrder.objects.create(
                style=oxford, po_number="PO-24082", qty=18000, shipped_qty=4200,
                status=SalesOrder.Status.AT_RISK, ex_factory=day + timedelta(days=4), destination="Felixstowe",
            ),
            "ready": SalesOrder.objects.create(
                style=tee, po_number="PO-24077", qty=30000, shipped_qty=30000,
                status=SalesOrder.Status.READY, ex_factory=day + timedelta(days=2), destination="Gothenburg",
            ),
            "shipped": SalesOrder.objects.create(
                style=jacket, po_number="PO-24055", qty=12000, shipped_qty=12000,
                status=SalesOrder.Status.SHIPPED, ex_factory=day - timedelta(days=6), destination="Valencia",
            ),
            "confirmed": SalesOrder.objects.create(
                style=polo, po_number="PO-24090", qty=15000, shipped_qty=0,
                status=SalesOrder.Status.CONFIRMED, ex_factory=day + timedelta(days=6), destination="Hamburg",
            ),
        }
        return {"polo": polo, "oxford": oxford, "tee": tee, "jacket": jacket}, orders

    def _production(self, supervisor):
        day = timezone.localdate()
        line1 = ProductionLine.objects.create(code="L01", name="Line 01", target_per_hour=120, operators=28)
        line2 = ProductionLine.objects.create(code="L02", name="Line 02", target_per_hour=95, operators=24)
        line3 = ProductionLine.objects.create(code="L03", name="Line 03", target_per_hour=80, operators=22)
        rows = {
            line1: [(8, 118, 2), (9, 124, 1), (10, 109, 4), (11, 121, 2)],
            line2: [(8, 80, 6), (9, 88, 5), (10, 90, 4), (11, 84, 7)],
            line3: [(8, 82, 1), (9, 79, 2), (10, 85, 1), (11, 81, 2)],
        }
        for line, hours in rows.items():
            for hour, output, rejects in hours:
                note = "Needle breakage slowed the hour." if line == line2 and hour == 8 else ""
                ProductionEntry.objects.create(
                    line=line,
                    recorded_by=supervisor,
                    work_date=day,
                    hour=hour,
                    output_qty=output,
                    reject_qty=rejects,
                    note=note,
                )
        return {"line2": line2}

    def _qc(self, supervisor, styles):
        QCInspection.objects.create(
            style=styles["polo"], inspector=supervisor, result=QCInspection.Result.PASS,
            sample_size=32, defect_qty=0, note="End-line audit, measurement within tolerance.",
        )
        QCInspection.objects.create(
            style=styles["jacket"], inspector=supervisor, result=QCInspection.Result.FAIL,
            defect="Broken stitch at hood join", sample_size=32, defect_qty=3,
            note="Hold the bundle and replace the hood seam.",
        )

    def _approvals(self, people):
        now = timezone.now()
        Approval.objects.create(
            kind=Approval.Kind.REQUISITION,
            title="40s combed cotton yarn",
            reference="PR-1042",
            requester=people["sadia"],
            amount=Decimal("1250000.00"),
            summary="4,000 kg for PO-24081 and PO-24090. Current yarn is below reorder.",
            payload={"supplier": "Padma Spinning", "uom": "kg", "qty": "4,000", "buyer": "Northline Apparel"},
            created_at=now - timedelta(hours=5),
        )
        leave_approval = Approval.objects.create(
            kind=Approval.Kind.LEAVE,
            title="Casual leave",
            reference="LV-0007",
            requester=people["nusrat"],
            summary="Family appointment in Gazipur.",
            payload={"leave_type": "casual", "start": str(timezone.localdate() + timedelta(days=3)), "end": str(timezone.localdate() + timedelta(days=3))},
            created_at=now - timedelta(hours=8),
        )
        LeaveRequest.objects.create(
            user=people["nusrat"],
            approval=leave_approval,
            leave_type=LeaveRequest.LeaveType.CASUAL,
            start_date=timezone.localdate() + timedelta(days=3),
            end_date=timezone.localdate() + timedelta(days=3),
            reason="Family appointment in Gazipur.",
        )
        Approval.objects.create(
            kind=Approval.Kind.WORK_ORDER,
            title="Line 02 Saturday overtime",
            reference="WO-088",
            requester=people["karim"],
            summary="10 hours with 24 operators to recover the Oxford shirt shortfall.",
            payload={"line": "Line 02", "hours": "10", "people": "24", "buyer": "Harbor & Co"},
            created_at=now - timedelta(hours=3),
        )
        Approval.objects.create(
            kind=Approval.Kind.COSTING,
            title="HB-1182 Oxford shirt costing",
            reference="CST-019",
            requester=people["sadia"],
            summary="FOB needs sign-off before the size breakdown is sent to the buyer.",
            payload={"buyer": "Harbor & Co", "fob": "USD 6.85", "breakdown": ["Fabric 4.80", "CM 1.15", "Trim 0.42", "Wash 0.48"]},
            created_at=now - timedelta(days=1),
        )
        approved = Approval.objects.create(
            kind=Approval.Kind.REQUISITION,
            title="Polybag reprint",
            reference="PR-1038",
            requester=people["sadia"],
            amount=Decimal("86000.00"),
            summary="Barcode reprint for Lumen Kids tees.",
            payload={"supplier": "Green Pack", "buyer": "Lumen Kids"},
            status=Approval.Status.APPROVED,
            comment="Approved against the ready shipment.",
            decided_by=people["rahim"],
            decided_at=now - timedelta(days=2),
            created_at=now - timedelta(days=3),
        )
        approved.save()
        Approval.objects.create(
            kind=Approval.Kind.WORK_ORDER,
            title="Night shift trial",
            reference="WO-081",
            requester=people["karim"],
            summary="Trial night shift on Line 03.",
            payload={"line": "Line 03", "hours": "8"},
            status=Approval.Status.REJECTED,
            comment="Hold the night shift until the power schedule is confirmed.",
            decided_by=people["rahim"],
            decided_at=now - timedelta(days=9),
            created_at=now - timedelta(days=10),
        )

    def _hr(self, people):
        day = timezone.localdate()
        for offset, start, end in [(1, "08:02", "17:11"), (2, "08:06", "17:05"), (3, "08:00", "17:16"), (4, "08:11", "17:02")]:
            Attendance.objects.create(
                user=people["nusrat"],
                work_date=day - timedelta(days=offset),
                check_in=_time(start),
                check_out=_time(end),
            )
        Attendance.objects.create(user=people["karim"], work_date=day, check_in=_time("07:48"))
        Attendance.objects.create(user=people["farhana"], work_date=day, check_in=_time("08:05"))
        for person, basic, allowance in [
            (people["rahim"], "85000", "15000"),
            (people["sadia"], "42000", "8000"),
            (people["karim"], "38000", "7000"),
            (people["farhana"], "32000", "5000"),
            (people["nusrat"], "18000", "3500"),
        ]:
            for months_ago in (0, 1, 2):
                period = _month(months_ago)
                deduction = Decimal("1500.00") if person.username == "nusrat" else Decimal("2500.00")
                basic_d = Decimal(basic)
                allowance_d = Decimal(allowance)
                Payslip.objects.create(
                    user=person,
                    period=period,
                    basic=basic_d,
                    allowance=allowance_d,
                    deduction=deduction,
                    net=basic_d + allowance_d - deduction,
                )
        Notice.objects.create(
            title="Saturday recovery on Line 02",
            body="Line 02 will run a recovery shift this Saturday for the Harbor Oxford shirt. Supervisors confirm the operator list by Thursday.",
            published_at=timezone.now() - timedelta(hours=6),
        )
        Notice.objects.create(
            title="Fire drill — cutting floor",
            body="A fire drill will be held on the cutting floor at 11:00. Leave the aisles clear and follow the floor wardens.",
            published_at=timezone.now() - timedelta(days=1),
        )
        Notice.objects.create(
            title="ছুটির নোটিশ",
            body="আগামী সপ্তাহের জাতীয় ছুটিতে কারখানা বন্ধ থাকবে। শিপমেন্ট PO-24077 এর কার্টন আজকের মধ্যে সিল করতে হবে।",
            published_at=timezone.now() - timedelta(days=2),
        )

    def _shipments(self, orders):
        day = timezone.localdate()
        Shipment.objects.create(
            order=orders["risk"], reference="BKG-8821", destination="Felixstowe",
            status=Shipment.Status.BOOKING, etd=day + timedelta(days=5), eta=day + timedelta(days=24),
            cartons=620, note="Vessel space is tight. Confirm the booking today.",
        )
        Shipment.objects.create(
            order=orders["ready"], reference="CTG-4410", destination="Gothenburg",
            status=Shipment.Status.IN_TRANSIT, etd=day - timedelta(days=1), eta=day + timedelta(days=16),
            cartons=980, note="Departed Chattogram.",
        )
        Shipment.objects.create(
            order=orders["shipped"], reference="VAL-2204", destination="Valencia",
            status=Shipment.Status.CUSTOMS, etd=day - timedelta(days=12), eta=day + timedelta(days=2),
            cartons=410, note="Documents are with the forwarder.",
        )

    def _store(self, keeper):
        yarn = StockItem.objects.create(sku="YARN-40S", name="Cotton yarn 40s", uom="kg", qty_on_hand=800, reorder_level=1200, location="Rack A1")
        StockItem.objects.create(sku="BTN-18L", name="Button 18L", uom="gross", qty_on_hand=420, reorder_level=80, location="Rack B3")
        StockItem.objects.create(sku="PB-01", name="Polybag", uom="pcs", qty_on_hand=15000, reorder_level=5000, location="Rack C1")
        StockItem.objects.create(sku="CTN-M", name="Export carton", uom="pcs", qty_on_hand=900, reorder_level=400, location="Rack D2")
        zipper = StockItem.objects.create(sku="ZIP-05", name="Nylon zipper", uom="pcs", qty_on_hand=260, reorder_level=300, location="Rack B1")
        StockMovement.objects.create(item=yarn, kind=StockMovement.Kind.ISSUE, qty=200, reference="PO-24081", moved_by=keeper)
        StockMovement.objects.create(item=zipper, kind=StockMovement.Kind.ISSUE, qty=40, reference="AT-0904", moved_by=keeper)

    def _alerts(self, people, lines):
        Notification.objects.create(
            user=people["rahim"],
            title="PO-24082 is at risk",
            body="Oxford shirt ex-factory is 4 days away and only part of the quantity is shipped.",
        )
        Notification.objects.create(
            user=people["rahim"],
            title="4 approvals are waiting",
            body="Yarn requisition, Nusrat's leave, Line 02 overtime, and the Oxford costing need a decision.",
        )
        Notification.objects.create(
            user=people["sadia"],
            title="Costing CST-019 is still open",
            body="Harbor & Co is waiting on the FOB sign-off for HB-1182.",
        )
        Notification.objects.create(
            user=people["karim"],
            title="Line 02 is behind target",
            body="Recover the shortfall before the Saturday overtime request is decided.",
            is_read=True,
        )
        Notification.objects.create(
            user=people["farhana"],
            title="Yarn is below reorder",
            body="YARN-40S has 800 kg on hand. Reorder level is 1,200 kg.",
        )
        Notification.objects.create(
            user=people["nusrat"],
            title="Leave LV-0007 is pending",
            body="Your casual leave is with the general manager.",
        )
        Notification.objects.create(
            user=people["nusrat"],
            title="New notice",
            body="Saturday recovery on Line 02. Check Notices for the operator list deadline.",
            is_read=True,
        )


def _time(value):
    hour, minute = value.split(":")
    return time(int(hour), int(minute))


def _month(offset):
    day = timezone.localdate()
    month = day.month - offset
    year = day.year
    while month <= 0:
        month += 12
        year -= 1
    return day.replace(year=year, month=month, day=1)
