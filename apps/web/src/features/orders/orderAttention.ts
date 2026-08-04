import type { OrderView } from '@ekum/domain-types';

const COMPLETED = new Set(['delivered', 'declined', 'cancelled']);

/** Buyer can accept rates the seller already put on a request. */
export function buyerCanAcceptQuote(order: OrderView): boolean {
  return (
    order.direction === 'buying' &&
    order.status === 'requested' &&
    order.items.some((item) => item.rate != null)
  );
}

/** Orders that need the signed-in company's action right now. */
export function matchesNeeds(order: OrderView): boolean {
  if (order.direction === 'selling' && order.status === 'requested') return true;
  if (buyerCanAcceptQuote(order)) return true;
  if (order.direction === 'buying' && order.status === 'dispatched') return true;
  return false;
}

/** Open trade that is not finished — includes waiting on the other party. */
export function matchesProgress(order: OrderView): boolean {
  return order.status === 'requested' || order.status === 'confirmed' || order.status === 'dispatched';
}

export function matchesCompleted(order: OrderView): boolean {
  return COMPLETED.has(order.status);
}
