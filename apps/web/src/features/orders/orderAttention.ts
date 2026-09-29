import {
  isOrderTerminalClosed,
  matchesOrderNeedsYou,
  matchesReturnNeedsYou,
  matchesSampleNeedsYou,
  type OrderView,
  type ReturnView,
  type SampleView,
} from '@ekum/domain-types';
import { isIHandleSellingParent } from '@/features/orders/iHandleDesk';

const COMPLETED = new Set(['dispatched', 'settled', 'delivered', 'declined', 'cancelled']);
const SAMPLE_PROGRESS = new Set(['requested', 'dispatched']);
const SAMPLE_DONE = new Set(['received', 'declined', 'converted']);
const RETURN_PROGRESS = new Set(['requested', 'approved', 'partially_approved']);
const RETURN_DONE = new Set(['declined', 'resolved']);

/** Buyer can accept only after the seller sent a real quote (not catalog line rates). */
export function buyerCanAcceptQuote(order: OrderView): boolean {
  return order.direction === 'buying' && order.canAcceptQuote === true;
}

/** Seller still needs to put rates on a requested order. */
export function sellerNeedsRate(order: OrderView): boolean {
  if (isIHandleSellingParent(order)) return false;
  return (
    order.direction === 'selling' &&
    order.status === 'requested' &&
    order.items.some((item) => item.rate == null)
  );
}

/** Seller has rates on a request and can confirm the order. */
export function sellerCanConfirm(order: OrderView): boolean {
  if (isIHandleSellingParent(order)) return false;
  return (
    order.direction === 'selling' &&
    order.status === 'requested' &&
    order.items.length > 0 &&
    order.items.every((item) => item.rate != null)
  );
}

export function sellerNeedsDispatch(order: OrderView): boolean {
  if (isIHandleSellingParent(order)) return false;
  return (
    order.direction === 'selling' &&
    (order.status === 'confirmed' || order.status === 'part_shipped') &&
    order.items.some((item) => item.remainingQuantity > 0)
  );
}

/** Mark delivered retired — full dispatch is complete. */
export function buyerNeedsDelivery(_order: OrderView): boolean {
  return false;
}

/** Seller must decide an open return request. */
export function sellerNeedsReturnReview(ret: ReturnView): boolean {
  return ret.direction === 'selling' && ret.status === 'requested';
}

/** Buyer waiting on seller review of their return request. */
export function buyerWaitingReturnReview(ret: ReturnView): boolean {
  return ret.direction === 'buying' && ret.status === 'requested';
}

/** Orders that need the signed-in company's action right now. */
export function matchesNeeds(order: OrderView): boolean {
  return matchesOrderNeedsYou(order);
}

/** Open trade that is not finished — includes waiting on the other party. */
export function matchesProgress(order: OrderView): boolean {
  return (
    order.status === 'requested' ||
    order.status === 'confirmed' ||
    order.status === 'part_shipped'
  );
}

export function matchesCompleted(order: OrderView): boolean {
  return (
    order.status === 'settled' ||
    order.status === 'dispatched' ||
    COMPLETED.has(order.status) ||
    isOrderTerminalClosed(order.status)
  );
}

export function matchesSampleNeeds(sample: SampleView): boolean {
  return matchesSampleNeedsYou(sample);
}

export function matchesSampleProgress(sample: SampleView): boolean {
  return SAMPLE_PROGRESS.has(sample.status);
}

export function matchesSampleCompleted(sample: SampleView): boolean {
  return SAMPLE_DONE.has(sample.status);
}

export function matchesReturnNeeds(ret: ReturnView): boolean {
  return matchesReturnNeedsYou(ret);
}

export function matchesReturnProgress(ret: ReturnView): boolean {
  return RETURN_PROGRESS.has(ret.status);
}

export function matchesReturnCompleted(ret: ReturnView): boolean {
  return RETURN_DONE.has(ret.status);
}

export function formatOrderQty(order: OrderView): string {
  const total = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const unit = order.items[0]?.unit;
  if (!total) return `${order.items.length} line${order.items.length === 1 ? '' : 's'}`;
  const rounded = Number.isInteger(total) ? String(total) : total.toFixed(1);
  return unit ? `${rounded} ${unit}` : `${rounded} pc`;
}
