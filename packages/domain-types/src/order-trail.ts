/** Append-only order audit trail (Order detail Timeline). */

export const OrderTrailType = {
  Requested: 'requested',
  Updated: 'updated',
  Quoted: 'quoted',
  Confirmed: 'confirmed',
  PartShipped: 'part_shipped',
  Dispatched: 'dispatched',
  Settled: 'settled',
  Cancelled: 'cancelled',
  Declined: 'declined',
  Delivered: 'delivered',
  ReturnRaised: 'return_raised',
  ReturnDecided: 'return_decided',
  PaymentAsked: 'payment_asked',
} as const;
export type OrderTrailType = (typeof OrderTrailType)[keyof typeof OrderTrailType];

export type OrderTrailEventView = {
  id: string;
  type: string;
  at: string;
  /** Display who-line already resolved for the viewer (staff or business name). */
  who: string | null;
  summary: string | null;
  detail: string | null;
  note: string | null;
  noteVoiceUrl: string | null;
  noteVoiceDurationMs: number | null;
};

export const ORDER_TRAIL_LABELS: Record<string, string> = {
  [OrderTrailType.Requested]: 'Requested',
  [OrderTrailType.Updated]: 'Updated',
  [OrderTrailType.Quoted]: 'Quoted',
  [OrderTrailType.Confirmed]: 'Confirmed',
  [OrderTrailType.PartShipped]: 'Part shipped',
  [OrderTrailType.Dispatched]: 'Dispatched',
  [OrderTrailType.Settled]: 'Settled',
  [OrderTrailType.Cancelled]: 'Cancelled',
  [OrderTrailType.Declined]: 'Declined',
  [OrderTrailType.Delivered]: 'Delivered',
  [OrderTrailType.ReturnRaised]: 'Return raised',
  [OrderTrailType.ReturnDecided]: 'Return decided',
  [OrderTrailType.PaymentAsked]: 'Payment asked',
};

export function orderTrailLabel(type: string): string {
  return ORDER_TRAIL_LABELS[type] ?? type;
}

/** Timeline line for Send quote — first vs later send. */
export function quoteTrailSummary(total: number, alreadyQuoted: boolean): string {
  const amount = `₹${Math.round(total).toLocaleString('en-IN')}`;
  return alreadyQuoted ? `Quote updated — ${amount}` : `Quoted — ${amount}`;
}

/** Completed for attention / filters: full dispatch, settle, legacy delivered. */
export function isOrderFulfillmentComplete(status: string): boolean {
  return status === 'dispatched' || status === 'settled' || status === 'delivered';
}

export function isOrderTerminalClosed(status: string): boolean {
  return (
    status === 'dispatched' ||
    status === 'settled' ||
    status === 'delivered' ||
    status === 'declined' ||
    status === 'cancelled'
  );
}
