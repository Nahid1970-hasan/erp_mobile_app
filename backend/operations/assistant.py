from datetime import timedelta

from django.utils import timezone

from .metrics import at_risk_orders, line_board, low_stock, pending_approvals_for
from .models import Attendance, LeaveRequest, Payslip, Shipment


def _bangla(text):
    return any("\u0980" <= char <= "\u09ff" for char in text)


def _has(question, words):
    return any(word in question for word in words)


def answer_question(user, question):
    text = (question or "").strip()
    if not text:
        return _help(False)
    folded = text.lower()
    bangla = _bangla(text)

    if _has(folded, ["risk", "delay", "late", "দেরি", "বিলম্ব"]):
        return _risk(bangla)
    if _has(folded, ["stock", "reorder", "material", "inventory", "স্টক", "মজুদ"]):
        return _stock(bangla)
    if _has(folded, ["approval", "approve", "pending", "requisition", "অনুমোদন"]):
        return _approvals(user, bangla)
    if _has(folded, ["leave", "ছুটি"]):
        return _leave(user, bangla)
    if _has(folded, ["attendance", "check in", "check-in", "হাজিরা"]):
        return _attendance(user, bangla)
    if _has(folded, ["payslip", "salary", "pay", "বেতন"]):
        return _payslip(user, bangla)
    if _has(folded, ["production", "output", "efficiency", "target", "reject", "প্রোডাকশন", "আউটপুট", "দক্ষতা"]):
        return _production(bangla)
    if _has(folded, ["shipment", "container", "vessel", "শিপমেন্ট"]):
        return _shipments(bangla)
    return _help(bangla)


def _help(bangla):
    if bangla:
        return (
            "আমি অর্ডার ঝুঁকি, আজকের প্রোডাকশন, অপেক্ষমাণ অনুমোদন, কম স্টক, শিপমেন্ট এবং আপনার ছুটি নিয়ে উত্তর দিতে পারি। "
            "উদাহরণ: এই সপ্তাহে কোন অর্ডার দেরি হতে পারে?"
        )
    return (
        "I can answer from live ERP data: at-risk orders, today's production against target, "
        "pending approvals, low stock, shipments, and your own leave or payslip. "
        "Try: Which orders are at risk of delaying shipment this week?"
    )


def _risk(bangla):
    orders = list(at_risk_orders())
    if not orders:
        return "আগামী ৭ দিনে কোনো অর্ডার ঝুঁকিতে নেই।" if bangla else "No orders are at risk of delaying shipment in the next 7 days."
    lines = []
    for order in orders:
        if bangla:
            lines.append(
                f"{order.po_number} {order.style.name} — এক্স-ফ্যাক্টরি {order.ex_factory:%d %b}, "
                f"শিপড {order.shipped_qty:,} / {order.qty:,}, স্ট্যাটাস {order.get_status_display()}।"
            )
        else:
            lines.append(
                f"{order.po_number} {order.style.style_no} {order.style.name} for {order.style.buyer.name}: "
                f"ex-factory {order.ex_factory:%d %b}, shipped {order.shipped_qty:,} of {order.qty:,} "
                f"({order.get_status_display()})."
            )
    lead = f"এই সপ্তাহে {len(orders)}টি অর্ডার নজর দিতে হবে:" if bangla else f"{len(orders)} order(s) need attention this week:"
    return lead + "\n" + "\n".join(lines)


def _production(bangla):
    board = line_board()
    weak = min(board["lines"], key=lambda row: row["efficiency"] if row["target"] else 999, default=None)
    if bangla:
        text = (
            f"আজ রেকর্ড করা আউটপুট {board['output_today']:,}, টার্গেট {board['target_today']:,} "
            f"({board['efficiency']}%)। রিজেক্ট {board['rejects_today']:,}।"
        )
        if weak and weak["target"]:
            text += f"\nসবচেয়ে পিছিয়ে {weak['name']}: {weak['efficiency']}%।"
        return text
    text = (
        f"Today's recorded output is {board['output_today']:,} against a target of {board['target_today']:,} "
        f"({board['efficiency']}% efficiency). Rejects: {board['rejects_today']:,}."
    )
    if weak and weak["target"]:
        text += f"\n{weak['name']} is the furthest behind at {weak['efficiency']}%."
    return text


def _approvals(user, bangla):
    pending = list(pending_approvals_for(user).select_related("requester")[:8])
    if not pending:
        return "আপনার জন্য কোনো অপেক্ষমাণ অনুমোদন নেই।" if bangla else "There are no pending approvals for you."
    lines = [f"{item.reference} — {item.title}" for item in pending]
    if bangla:
        return f"{len(pending)}টি অনুমোদন অপেক্ষমাণ:\n" + "\n".join(lines)
    scope = "waiting for a decision" if user.role in {"manager", "merchandiser"} else "that you requested"
    return f"{len(pending)} approval(s) {scope}:\n" + "\n".join(lines)


def _stock(bangla):
    items = list(low_stock())
    if not items:
        return "কোনো মাল রিঅর্ডার লেভেলের নিচে নেই।" if bangla else "No materials are at or below reorder level."
    lines = [f"{item.sku} {item.name}: {item.qty_on_hand:,} {item.uom} on hand, reorder at {item.reorder_level:,}." for item in items]
    lead = f"{len(items)}টি আইটেম রিঅর্ডার লেভেলের নিচে:" if bangla else f"{len(items)} item(s) are at or below reorder level:"
    return lead + "\n" + "\n".join(lines)


def _leave(user, bangla):
    leaves = list(LeaveRequest.objects.filter(user=user).order_by("-start_date")[:5])
    if not leaves:
        return "আপনার কোনো ছুটির আবেদন নেই।" if bangla else "You have no leave requests."
    lines = [
        f"{item.get_leave_type_display()} {item.start_date:%d %b}–{item.end_date:%d %b} ({item.get_status_display()})"
        for item in leaves
    ]
    lead = "আপনার ছুটি:" if bangla else "Your leave requests:"
    return lead + "\n" + "\n".join(lines)


def _attendance(user, bangla):
    row = Attendance.objects.filter(user=user, work_date=timezone.localdate()).first()
    if row is None or row.check_in is None:
        return "আজ আপনি এখনো চেক-ইন করেননি।" if bangla else "You have not checked in today."
    start = row.check_in.strftime("%H:%M")
    if row.check_out:
        end = row.check_out.strftime("%H:%M")
        return f"আজকের হাজিরা {start} থেকে {end}।" if bangla else f"Today you checked in at {start} and out at {end}."
    return f"আপনি {start}-এ চেক-ইন করেছেন। চেক-আউট বাকি।" if bangla else f"You checked in at {start}. Check-out is still open."


def _payslip(user, bangla):
    slip = Payslip.objects.filter(user=user).first()
    if slip is None:
        return "আপনার কোনো পেস্লিপ নেই।" if bangla else "No payslip is available for you yet."
    if bangla:
        return f"{slip.period:%B %Y} পেস্লিপ: নেট ৳{slip.net:,.0f} (বেসিক ৳{slip.basic:,.0f})।"
    return f"{slip.period:%B %Y} payslip: net ৳{slip.net:,.0f} (basic ৳{slip.basic:,.0f}, allowance ৳{slip.allowance:,.0f}, deduction ৳{slip.deduction:,.0f})."


def _shipments(bangla):
    horizon = timezone.localdate() + timedelta(days=14)
    rows = list(Shipment.objects.select_related("order").filter(eta__lte=horizon).exclude(status=Shipment.Status.DELIVERED)[:6])
    if not rows:
        return "আগামী ১৪ দিনে খোলা শিপমেন্ট নেই।" if bangla else "No open shipments are due in the next 14 days."
    lines = [f"{row.reference} {row.order.po_number} → {row.destination}, {row.get_status_display()}, ETA {row.eta:%d %b}." for row in rows]
    lead = "খোলা শিপমেন্ট:" if bangla else "Open shipments:"
    return lead + "\n" + "\n".join(lines)
