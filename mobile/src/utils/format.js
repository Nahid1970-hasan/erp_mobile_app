export const STATUS_LABEL = {
  confirmed: 'Confirmed',
  in_production: 'In production',
  ready: 'Ready',
  shipped: 'Shipped',
  at_risk: 'At risk',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  requisition: 'Requisition',
  leave: 'Leave',
  work_order: 'Work order',
  costing: 'Costing',
  booking: 'Booking',
  in_transit: 'In transit',
  customs: 'Customs',
  delivered: 'Delivered',
  pass: 'Pass',
  fail: 'Fail',
  receive: 'Receive',
  issue: 'Issue',
  casual: 'Casual',
  sick: 'Sick',
  earned: 'Earned',
  manager: 'Manager',
  merchandiser: 'Merchandiser',
  supervisor: 'Supervisor',
  store: 'Store',
  employee: 'Operator',
};

export function label(status) {
  return STATUS_LABEL[status] || status || '—';
}

export function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

export function prettyDate(value) {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function prettyTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

export function hourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function count(value) {
  return Number(value || 0).toLocaleString('en-US');
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
