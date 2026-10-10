import type { OrderView } from '@ekum/domain-types';
import { qtyCountNoun } from './howManyLineMeta';
import { sellerNeedsDispatch } from './orderAttention';

/** Shared order-unit noun when every line agrees; otherwise omit. */
function sharedUnitNoun(items: OrderView['items']): string | null {
  const units = (items ?? [])
    .map((line) => line.unit?.trim())
    .filter((unit): unit is string => Boolean(unit));
  if (units.length < 1) return null;
  const first = units[0]!;
  if (!units.every((unit) => unit === first)) return null;
  return qtyCountNoun(first);
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

  const items = order.items ?? [];
  const shipped = items.reduce((sum, line) => sum + (line.shippedQuantity ?? 0), 0);
  const remaining = items.reduce(
    (sum, line) => sum + Math.max(0, line.remainingQuantity ?? 0),
    0,
  );
  const total = shipped + remaining;
  const noun = sharedUnitNoun(items);
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
  return null;
}
