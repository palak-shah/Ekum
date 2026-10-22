import type { OrderItemView } from '@ekum/domain-types';
import { howManyOrderFooterSummary } from '@/features/orders/howManyLineMeta';

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
 * Remainder preview: Ordered stays; Ship/Balance fold Final.
 * leftover = Ordered − Final; extra when Final > Ordered.
 */
export function orderLineFactsForSettleRemainder<T extends {
  quantity: number;
  remainingQuantity?: number;
  shippedQuantity?: number;
}>(item: T, finalQty: number): T {
  const shipped = item.shippedQuantity ?? 0;
  const final = Number.isFinite(finalQty)
    ? Math.max(0, Math.min(Math.floor(finalQty), shipped))
    : shipped;
  return {
    ...item,
    remainingQuantity: Math.max(0, item.quantity - final),
    shippedQuantity: final,
  };
}

/** Leftover after Final — Ordered − Final, never negative. */
export function lineSettleLeftoverQty(
  item: Pick<OrderItemView, 'id' | 'quantity' | 'shippedQuantity'>,
  qty: Record<string, string>,
): number {
  return Math.max(0, item.quantity - lineSettleFinalQty(item, qty));
}

/** Sticky settle leftover — order unit, no ₹ (won't ship). */
export function settleLeftoverFooterSummary(
  items: OrderItemView[],
  qty: Record<string, string>,
) {
  return howManyOrderFooterSummary(
    items.map((item) => ({
      quantity: lineSettleLeftoverQty(item, qty),
      unit: item.unit,
      piecesPerPack: item.piecesPerPack,
      dispatchUnit: item.dispatchUnit,
    })),
  );
}
