import type { OrderItemView } from '@ekum/domain-types';
import { formatUnit } from '@/lib/format';

export function shippableDispatchItems(items: OrderItemView[]): OrderItemView[] {
  return items.filter(
    (item) =>
      (item.lineStatus === 'confirmed' || item.lineStatus === 'dispatched') &&
      item.remainingQuantity > 0,
  );
}

export function defaultDispatchOn(items: OrderItemView[]): Record<string, boolean> {
  const on: Record<string, boolean> = {};
  for (const item of items) on[item.id] = true;
  return on;
}

export function defaultDispatchQty(items: OrderItemView[]): Record<string, string> {
  const qty: Record<string, string> = {};
  for (const item of items) qty[item.id] = String(item.remainingQuantity);
  return qty;
}

export function lineDispatchQty(item: OrderItemView, qty: Record<string, string>): number {
  const n = Number(qty[item.id]);
  if (!Number.isFinite(n) || n < 1) return item.remainingQuantity;
  return Math.min(Math.floor(n), item.remainingQuantity);
}

export function dispatchPayloadLines(
  items: OrderItemView[],
  on: Record<string, boolean>,
  qty: Record<string, string>,
): Array<{ orderItemId: string; quantity: number }> {
  return items
    .filter((item) => on[item.id])
    .map((item) => ({
      orderItemId: item.id,
      quantity: lineDispatchQty(item, qty),
    }))
    .filter((line) => line.quantity > 0);
}

export function dispatchThisLrTally(
  items: OrderItemView[],
  on: Record<string, boolean>,
  qty: Record<string, string>,
): { designs: number; pieces: number; later: number } {
  let designs = 0;
  let pieces = 0;
  let later = 0;
  for (const item of items) {
    if (on[item.id]) {
      designs += 1;
      pieces += lineDispatchQty(item, qty);
    } else {
      later += 1;
    }
  }
  return { designs, pieces, later };
}

export function dispatchThisLrLabel(tally: { designs: number; pieces: number }): string {
  const d = tally.designs === 1 ? 'design' : 'designs';
  return `This LR · ${tally.designs} ${d} · ${tally.pieces} pcs`;
}

/** SKU · unit — same job as Unstitched · Box Pcs on a mill packing list. */
export function dispatchLineKindLine(item: Pick<OrderItemView, 'sku' | 'unit'>): string | null {
  const bits = [item.sku?.trim(), formatUnit(item.unit)].filter(Boolean);
  return bits.length > 0 ? bits.join(' · ') : null;
}

/** Ordered vs still pending — we do not store pcs/set. */
export function dispatchLineCountLine(
  item: Pick<OrderItemView, 'requestedQuantity' | 'remainingQuantity'>,
): string {
  return `${item.requestedQuantity} ordered · pending ${item.remainingQuantity}`;
}

