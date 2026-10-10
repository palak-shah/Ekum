/**
 * The single status-token map. Every status pill across orders, samples,
 * returns, complaints, threads and access requests resolves its colour and
 * label here, so status vocabulary and colour never drift between screens.
 */
export type StatusTone =
  | 'neutral'
  | 'open'
  | 'placed'
  | 'info'
  | 'confirmed'
  | 'progress'
  | 'part'
  | 'success'
  | 'resolved'
  | 'danger'
  | 'muted';

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-foam text-slate',
  /** Legacy soft open — prefer `placed` for order requested. */
  open: 'bg-placed-soft text-placed-ink',
  /** Order Placed (`requested`) — warm amber, distinct from Confirmed. */
  placed: 'bg-placed-soft text-placed-ink',
  /** Complaint open / access pending — teal. */
  info: 'bg-info-soft text-info-ink',
  /** Order Confirmed — sky blue. */
  confirmed: 'bg-confirmed-soft text-confirmed-ink',
  /** Generic in-progress (responded, etc.). */
  progress: 'bg-warning-soft text-warning-ink',
  /** Part shipped — tangerine, distinct from Confirmed. */
  part: 'bg-part-soft text-part-ink',
  /** Dispatched / settled — green complete. */
  success: 'bg-success-soft text-success-ink',
  /** Complaint resolved — quiet slate, not success green. */
  resolved: 'bg-resolved-soft text-resolved-ink',
  danger: 'bg-danger-soft text-danger',
  muted: 'bg-linen text-muted',
};

const STATUS_TONE: Record<string, StatusTone> = {
  // Orders — each lifecycle step its own hue
  requested: 'placed',
  confirmed: 'confirmed',
  part_shipped: 'part',
  dispatched: 'success',
  settled: 'success',
  delivered: 'success',
  declined: 'danger',
  cancelled: 'muted',
  // Samples
  received: 'success',
  converted: 'success',
  // Returns
  approved: 'success',
  partially_approved: 'part',
  // Complaints / threads
  open: 'info',
  responded: 'progress',
  resolved: 'resolved',
  // Access
  pending: 'info',
  // Catalog
  draft: 'muted',
  ready: 'info',
  published: 'success',
  archived: 'muted',
};

const STATUS_LABEL: Record<string, string> = {
  /** Orders list + detail — never “Requested” on the pill (returns use returnStatusLabel). */
  requested: 'Placed',
  part_shipped: 'Part shipped',
  partially_approved: 'Partially approved',
  not_verified: 'Unverified',
  gst_verified: 'GST verified',
  ready: 'Ready',
  /** Both terminal success: full ship vs qty closed after short ship. */
  dispatched: 'Dispatched · complete',
  settled: 'Settled · complete',
};

/** Return pills — `requested` must not read like an order inquiry. */
const RETURN_STATUS_LABEL: Record<string, string> = {
  requested: 'Raised',
  approved: 'Approved',
  partially_approved: 'Partial',
  declined: 'Declined',
  resolved: 'Resolved',
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? 'neutral';
}

export function statusClasses(status: string): string {
  return TONE_CLASSES[statusTone(status)];
}

export function toneClasses(tone: StatusTone): string {
  return TONE_CLASSES[tone];
}

export function statusLabel(status: string): string {
  if (STATUS_LABEL[status]) {
    return STATUS_LABEL[status];
  }
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

/** Display label for return lifecycle (list + order detail). */
export function returnStatusLabel(status: string): string {
  return RETURN_STATUS_LABEL[status] ?? statusLabel(status);
}
