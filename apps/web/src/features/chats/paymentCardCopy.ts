import { shortOrderLabel } from '@ekum/domain-types';

function stripPaymentPrefix(value: string): string {
  return value.replace(/^Payment\s*·\s*/i, '').trim();
}

/** Pull `Order #ABCD` / `Inquiry #ABCD` from a payment title or body. */
export function orderIdFromPaymentText(text: string | null | undefined): string {
  if (!text?.trim()) return '';
  const match = text.trim().match(/\b((?:Order|Inquiry)\s*#[A-Za-z0-9]+)\b/i);
  return match?.[1]?.replace(/\s+/g, ' ') ?? '';
}

/** Title line for living payment cards in chat — always keep the order id when known. */
export function paymentCardTitle(input: {
  paid: boolean;
  /** Short order id from reference, e.g. `Order #FS3C`. */
  orderLabel?: string | null;
  /** Reference display name, e.g. `Payment · ₹5,700`. */
  name?: string | null;
  totalLabel?: string | null;
  /** Metadata may store `Payment · Order #FS3C`. */
  metaOrderLabel?: string | null;
  /** Real order uuid — used when labels were never stored. */
  orderId?: string | null;
  /** Living message body from API, e.g. `Payment · Order #FS3C · Paid`. */
  body?: string | null;
}): string {
  const fromMeta = input.metaOrderLabel?.trim()
    ? stripPaymentPrefix(input.metaOrderLabel.trim())
        .replace(/\s*·\s*Paid$/i, '')
        .replace(/\s*·\s*₹[\d,]+$/i, '')
        .trim()
    : '';
  const fromId = input.orderId?.trim() ? shortOrderLabel(input.orderId.trim()) : '';
  const order =
    input.orderLabel?.trim() ||
    fromMeta ||
    orderIdFromPaymentText(input.body) ||
    orderIdFromPaymentText(input.name) ||
    fromId ||
    '';

  if (input.paid) {
    // Prefer API body / name when they already carry the order id.
    const body = input.body?.trim() ?? '';
    if (body && orderIdFromPaymentText(body)) return body;
    const named = input.name?.trim() ?? '';
    if (named && orderIdFromPaymentText(named) && /\bPaid\b/i.test(named)) return named;
    return order ? `Payment · ${order} · Paid` : 'Payment · Paid';
  }

  const amount = input.totalLabel?.trim() || '';
  if (order && amount) return `Payment · ${order} · ${amount}`;
  if (order) return `Payment · ${order}`;
  return input.name?.trim() || input.body?.trim() || 'Payment';
}
