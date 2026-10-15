import type { OrderItemView } from '@ekum/domain-types';

/** Shippable lines on Settle — not declined. */
export function settleSheetItems(items: OrderItemView[]): OrderItemView[] {
  return items.filter((item) => item.lineStatus !== 'declined');
}

/** Default Final = already shipped. */
export function defaultSettleFinalQty(items: OrderItemView[]): Record<string, string> {
  const qty: Record<string, string> = {};
  for (const item of items) {
    qty[item.id] = String(item.shippedQuantity ?? 0);
  }
  return qty;
}

/** Clamp Final to 0 … shipped. */
export function lineSettleFinalQty(
  item: Pick<OrderItemView, 'id' | 'shippedQuantity'>,
  qty: Record<string, string>,
): number {
  const shipped = item.shippedQuantity ?? 0;
  const raw = Number(qty[item.id]);
  if (!Number.isFinite(raw) || raw < 0) return shipped;
  return Math.min(Math.floor(raw), shipped);
}

/**
 * Keep the settle Final field honest while typing/pasting.
 * Empty stays empty (blur/submit falls back via lineSettleFinalQty).
 */
export function clampSettleQtyInput(raw: string, shipped: number): string {
  if (raw === '') return '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '';
  const max = Math.max(0, Math.floor(shipped));
  if (n < 0) return '0';
  return String(Math.min(Math.floor(n), max));
}

export function settlePayloadLines(
  items: OrderItemView[],
  qty: Record<string, string>,
): Array<{ orderItemId: string; quantity: number }> {
  return items.map((item) => ({
    orderItemId: item.id,
    quantity: lineSettleFinalQty(item, qty),
  }));
}

/**
 * Preview closed ticket: qty = Final, ship = Final, remaining 0 (Balance done).
 */
export function orderLineFactsWithSettleFinal<T extends {
  quantity: number;
  remainingQuantity?: number;
  shippedQuantity?: number;
}>(item: T, finalQty: number): T {
  const shipped = item.shippedQuantity ?? 0;
  const final = Math.max(0, Math.min(Math.floor(finalQty), shipped));
  return {
    ...item,
    quantity: final,
    remainingQuantity: 0,
    shippedQuantity: final,
  };
}
