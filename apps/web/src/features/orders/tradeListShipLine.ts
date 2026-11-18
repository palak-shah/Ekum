import { collapseCatalogWholeLines, type OrderView } from '@ekum/domain-types';
import { qtyCountNoun } from './howManyLineMeta';
import { sellerNeedsDispatch } from './orderAttention';

type ShipLine = OrderView['items'][number];

/**
 * Progress lines in the **order** unit only.
 * Never multiply by `piecesPerPack`. Catalog-whole peers share one order qty.
 */
export function tradeListShipProgressLines(items: OrderView['items'] | undefined): ShipLine[] {
  const source = items ?? [];
  return collapseCatalogWholeLines(source).map((row) => {
    if (row.kind === 'line') return row.item;
    const lead = row.items[0]!;
    const n = row.items.length;
    const shippedSum = row.items.reduce((sum, line) => sum + (line.shippedQuantity ?? 0), 0);
    const remainingSum = row.items.reduce(
      (sum, line) => sum + Math.max(0, line.remainingQuantity ?? 0),
      0,
    );
    // Peers are one catalog order — average back to the lead's order qty, not N× qty.
    const shipped = n > 0 ? Math.floor(shippedSum / n) : 0;
    const remaining = n > 0 ? Math.floor(remainingSum / n) : 0;
    return {
      ...lead,
      quantity: Math.max(0, lead.quantity ?? 0),
      shippedQuantity: shipped,
      remainingQuantity: remaining,
    };
  });
}

/** Shared order-unit noun when every line agrees; otherwise omit. */
function sharedUnitNoun(items: ShipLine[]): string | null {
  const units = items
    .map((line) => line.unit?.trim())
    .filter((unit): unit is string => Boolean(unit));
  if (units.length < 1) return null;
  const first = units[0]!;
  if (!units.every((unit) => unit === first)) return null;
  return qtyCountNoun(first);
}

export function tradeListShipTotals(order: OrderView): {
  shipped: number;
  remaining: number;
  ordered: number;
  noun: string | null;
} {
  const items = tradeListShipProgressLines(order.items);
  const shipped = items.reduce((sum, line) => sum + (line.shippedQuantity ?? 0), 0);
  const remaining = items.reduce(
    (sum, line) => sum + Math.max(0, line.remainingQuantity ?? 0),
    0,
  );
  // Order unit qty only — never piecesPerPack × quantity.
  const ordered = items.reduce((sum, line) => sum + Math.max(0, line.quantity ?? 0), 0);
  return { shipped, remaining, ordered, noun: sharedUnitNoun(items) };
}

/** Confirmed / part-shipped with a qty — prototype live bar + `0/60 sets sent`. */
export function tradeListDispatchInPlay(order: OrderView): boolean {
  if (order.status !== 'confirmed' && order.status !== 'part_shipped') return false;
  const { ordered, shipped } = tradeListShipTotals(order);
  return ordered > 0 || shipped > 0;
}

export function tradeListShipProgress(
  order: OrderView,
): { shipped: number; total: number; over: boolean } | null {
  if (!tradeListDispatchInPlay(order)) return null;
  const { shipped, ordered } = tradeListShipTotals(order);
  const total = ordered > 0 ? ordered : shipped;
  if (total < 1) return null;
  return { shipped, total, over: shipped > ordered && ordered > 0 };
}

/** Glance facts ship: `0/60 sets sent` in the order unit. */
export function tradeListShipFact(order: OrderView): string | null {
  const progress = tradeListShipProgress(order);
  if (!progress) return null;
  const { noun } = tradeListShipTotals(order);
  return noun
    ? `${progress.shipped}/${progress.total} ${noun} sent`
    : `${progress.shipped}/${progress.total} sent`;
}

function dispatchedPhrase(shipped: number, total: number, noun: string | null): string {
  const amount = noun ? `${shipped} of ${total} ${noun}` : `${shipped} of ${total}`;
  return `${amount} dispatched`;
}

/** Quiet ship progress on the list card — only when dispatch is in play. */
export function tradeListShipLine(order: OrderView): string | null {
  if (order.status === 'declined' || order.status === 'cancelled') {
    return order.direction === 'selling' ? 'You declined this order' : 'Order declined';
  }

  const { shipped, remaining, ordered, noun } = tradeListShipTotals(order);
  const total = shipped + remaining;
  const needsDispatch = sellerNeedsDispatch(order);
  const buyingWaitShip =
    order.direction === 'buying' &&
    (order.status === 'confirmed' || order.status === 'part_shipped') &&
    remaining > 0;

  if (shipped < 1 && (needsDispatch || buyingWaitShip)) {
    return 'Nothing dispatched yet · Dispatch pending';
  }
  if (shipped > 0 && remaining > 0) {
    return `${dispatchedPhrase(shipped, total, noun)} · Dispatch pending`;
  }
  if (shipped > 0 && (order.status === 'dispatched' || order.status === 'settled' || remaining < 1)) {
    return dispatchedPhrase(shipped, total > 0 ? total : shipped, noun);
  }
  if (tradeListDispatchInPlay(order) && ordered > 0) {
    return dispatchedPhrase(shipped, ordered, noun);
  }
  return null;
}
