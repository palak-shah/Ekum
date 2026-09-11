/** Title line for living payment cards in chat. */
export function paymentCardTitle(input: {
  paid: boolean;
  /** Short order id from reference, e.g. `Order #FS3C`. */
  orderLabel?: string | null;
  /** Reference display name, e.g. `Payment · ₹5,700`. */
  name?: string | null;
  totalLabel?: string | null;
  /** Metadata may store `Payment · Order #FS3C`. */
  metaOrderLabel?: string | null;
}): string {
  const fromMeta = input.metaOrderLabel?.trim()
    ? input.metaOrderLabel.trim().replace(/^Payment\s*·\s*/i, '').trim()
    : '';
  const order =
    input.orderLabel?.trim() ||
    fromMeta ||
    '';
  if (input.paid) {
    return order ? `Payment · ${order} · Paid` : 'Payment · Paid';
  }
  const amount = input.totalLabel?.trim() || '';
  if (order && amount) return `Payment · ${order} · ${amount}`;
  if (order) return `Payment · ${order}`;
  return input.name?.trim() || 'Payment';
}
