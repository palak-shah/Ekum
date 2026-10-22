import type { OrderItemView, OrderShipmentView } from '@ekum/domain-types';
import { howManyOrderFooterSummary } from '@/features/orders/howManyLineMeta';

export type DispatchLegDraft = {
  lrNumber: string;
  billNumber: string;
  /** LR / bill slip photo URLs (uploaded). */
  imageUrls: string[];
};

const MAX_DISPATCH_LEGS = 50;
export const MAX_LEG_PHOTOS = 3;

export function emptyDispatchLeg(): DispatchLegDraft {
  return { lrNumber: '', billNumber: '', imageUrls: [] };
}

/** Grow/shrink LR+Bill rows to match Parcels N (min 1). Shrink drops trailing empties first. */
export function resizeDispatchLegs(legs: DispatchLegDraft[], n: number): DispatchLegDraft[] {
  const target = Math.max(1, Math.min(MAX_DISPATCH_LEGS, Math.floor(Number(n)) || 1));
  if (legs.length === target) return legs;
  if (legs.length < target) {
    return [
      ...legs,
      ...Array.from({ length: target - legs.length }, () => emptyDispatchLeg()),
    ];
  }
  const next = [...legs];
  while (next.length > target) {
    let emptyIdx = -1;
    for (let i = next.length - 1; i >= 0; i -= 1) {
      const leg = next[i]!;
      if (
        !leg.lrNumber.trim() &&
        !leg.billNumber.trim() &&
        (leg.imageUrls?.length ?? 0) === 0
      ) {
        emptyIdx = i;
        break;
      }
    }
    if (emptyIdx >= 0) next.splice(emptyIdx, 1);
    else next.pop();
  }
  return next.length > 0 ? next : [emptyDispatchLeg()];
}

/** Seed edit/open from API legs, legacy lrNumber, or parcelCount. */
export function seedDispatchLegsFromShipment(
  shipment: Pick<OrderShipmentView, 'legs' | 'lrNumber' | 'parcelCount'>,
): DispatchLegDraft[] {
  if (shipment.legs && shipment.legs.length > 0) {
    return shipment.legs.map((leg) => ({
      lrNumber: leg.lrNumber ?? '',
      billNumber: leg.billNumber ?? '',
      imageUrls: [...(leg.imageUrls ?? [])].slice(0, MAX_LEG_PHOTOS),
    }));
  }
  if (shipment.lrNumber?.trim()) {
    return [{ lrNumber: shipment.lrNumber.trim(), billNumber: '', imageUrls: [] }];
  }
  const n = Math.max(1, shipment.parcelCount ?? 1);
  return resizeDispatchLegs([], n);
}

/** All LR slip photos on a shipment (for history thumbs). */
export function shipmentLegImageUrls(
  shipment: Pick<OrderShipmentView, 'legs'>,
): string[] {
  const next: string[] = [];
  for (const leg of shipment.legs ?? []) {
    for (const url of leg.imageUrls ?? []) {
      if (url && !next.includes(url)) next.push(url);
    }
  }
  return next;
}

/** Non-empty LR / bill lines for Shipments card + prior list. */
export function shipmentLegDisplayLines(
  shipment: Pick<OrderShipmentView, 'legs' | 'lrNumber'>,
): string[] {
  const legs = shipment.legs ?? [];
  if (legs.length > 0) {
    return legs
      .map((leg) => {
        const lr = leg.lrNumber?.trim() || '';
        const bill = leg.billNumber?.trim() || '';
        if (lr && bill) return `LR · ${lr} · Bill ${bill}`;
        if (lr) return `LR · ${lr}`;
        if (bill) return `Bill · ${bill}`;
        return null;
      })
      .filter((line): line is string => Boolean(line));
  }
  const lr = shipment.lrNumber?.trim();
  return lr ? [`LR · ${lr}`] : [];
}

export function shipmentPrimaryLabel(
  shipment: Pick<OrderShipmentView, 'legs' | 'lrNumber'>,
  fallback = 'Dispatch',
): string {
  const first = (shipment.legs ?? []).find((leg) => leg.lrNumber?.trim());
  if (first?.lrNumber?.trim()) return `LR · ${first.lrNumber.trim()}`;
  if (shipment.lrNumber?.trim()) return `LR · ${shipment.lrNumber.trim()}`;
  return fallback;
}

/** Confirmed / dispatched lines still pending — remaining > 0. */
export function shippableDispatchItems(items: OrderItemView[]): OrderItemView[] {
  return fulfillDispatchItems(items).filter((item) => item.remainingQuantity > 0);
}

/** Every confirmed / dispatched line, including remaining 0 (extras). */
export function fulfillDispatchItems(items: OrderItemView[]): OrderItemView[] {
  return items.filter(
    (item) => item.lineStatus === 'confirmed' || item.lineStatus === 'dispatched',
  );
}

/** Declined / Can’t supply lines — shown grayed on Dispatch (not shippable until restored). */
export function cantSupplyDispatchItems(items: OrderItemView[]): OrderItemView[] {
  return items.filter((item) => item.lineStatus === 'declined');
}

/** Fulfill lines first (including remaining 0), then Can’t supply. */
export function dispatchSheetItems(items: OrderItemView[]): OrderItemView[] {
  return [...fulfillDispatchItems(items), ...cantSupplyDispatchItems(items)];
}

export function defaultDispatchOn(items: OrderItemView[]): Record<string, boolean> {
  const on: Record<string, boolean> = {};
  for (const item of items) on[item.id] = item.remainingQuantity > 0;
  return on;
}

export function defaultDispatchQty(items: OrderItemView[]): Record<string, string> {
  const qty: Record<string, string> = {};
  for (const item of items) {
    qty[item.id] = item.remainingQuantity > 0 ? String(item.remainingQuantity) : '';
  }
  return qty;
}

/** When they tick a line: keep a typed qty, else remaining, else 1 for extras. */
export function dispatchQtyAfterSelect(
  item: Pick<OrderItemView, 'remainingQuantity'>,
  current: string | undefined,
): string {
  const n = Number(current);
  if (Number.isFinite(n) && n >= 1) return String(Math.floor(n));
  if (item.remainingQuantity > 0) return String(item.remainingQuantity);
  return '1';
}

const DISPATCH_QTY_MAX = 1_000_000;

/** Typed pcs for this LR — may exceed remaining (over-ship). */
export function lineDispatchQty(item: OrderItemView, qty: Record<string, string>): number {
  const n = Number(qty[item.id]);
  if (!Number.isFinite(n) || n < 1) return item.remainingQuantity;
  return Math.min(Math.floor(n), DISPATCH_QTY_MAX);
}

/** Extra pcs above pending when the seller types over remaining. */
export function lineDispatchOverBy(item: OrderItemView, qty: Record<string, string>): number {
  return Math.max(0, lineDispatchQty(item, qty) - item.remainingQuantity);
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
    } else if (item.remainingQuantity > 0) {
      later += 1;
    }
  }
  return { designs, pieces, later };
}

export function dispatchThisLrFooterSummary(
  items: OrderItemView[],
  on: Record<string, boolean>,
  qty: Record<string, string>,
) {
  const active = items.filter((item) => on[item.id] === true);
  return howManyOrderFooterSummary(
    active.map((item) => ({
      quantity: lineDispatchQty(item, qty),
      unit: item.unit,
      piecesPerPack: item.piecesPerPack,
      dispatchUnit: item.dispatchUnit,
      rate: item.rate,
    })),
  );
}

export function dispatchQtyFooterRows(
  items: OrderItemView[],
  on: Record<string, boolean>,
  qty: Record<string, string>,
): string[] {
  return dispatchThisLrFooterSummary(items, on, qty)?.rows ?? [];
}

export function dispatchThisLrLabel(input: {
  designs: number;
  rows?: string[];
  pieces?: number;
}): string {
  const d = input.designs === 1 ? 'design' : 'designs';
  const rows = input.rows ?? [];
  if (rows.length === 1) {
    return `This LR · ${input.designs} ${d} · ${rows[0]}`;
  }
  if (rows.length === 0 && input.pieces != null) {
    return `This LR · ${input.designs} ${d} · ${input.pieces} pcs`;
  }
  return `This LR · ${input.designs} ${d}`;
}

/** SKU only — unit lives on qty / footer, not beside the name. */
export function dispatchLineKindLine(item: Pick<OrderItemView, 'sku' | 'unit'>): string | null {
  return item.sku?.trim() || null;
}

/** Ordered / shipped / pending — show dispatched when some already left. */
export function dispatchLineCountLine(
  item: Pick<OrderItemView, 'requestedQuantity' | 'remainingQuantity' | 'shippedQuantity'>,
): string {
  const shipped = item.shippedQuantity ?? 0;
  if (shipped > 0) {
    return `dispatched ${shipped} · pending ${item.remainingQuantity}`;
  }
  return `${item.requestedQuantity} ordered · pending ${item.remainingQuantity}`;
}

/** Quiet collapse cue for earlier LRs on Dispatch. */
export function previousDispatchesCue(count: number): string {
  if (count <= 0) return '';
  return count === 1 ? '1 previous dispatch' : `${count} previous dispatches`;
}

