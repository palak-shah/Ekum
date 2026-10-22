import type { OrderView } from '@ekum/domain-types';
import { tradeListShipLine } from './tradeListShipLine';
import { orderNeedsYouLabel, tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import type { TradeListItem } from './tradeList';

/**
 * One protocol sentence under the card — Needs you Dispatch when it is our move.
 */
export function tradeListProtocol(item: TradeListItem): string | null {
  if (item.kind === 'order') return orderProtocol(item.order);
  return tradeNeedsYouLabel(item);
}

function orderProtocol(order: OrderView): string | null {
  if (order.status === 'cancelled' || order.status === 'declined') {
    return tradeListShipLine(order);
  }
  const needs = orderNeedsYouLabel(order);
  if (needs) return needs;
  return tradeListShipLine(order);
}

/** List StatusPill copy — Placed instead of Requested. */
export function tradeListStatusLabel(status: string): string {
  if (status === 'requested') return 'Placed';
  if (status === 'dispatched') return 'Dispatched';
  if (status === 'settled') return 'Settled';
  if (status === 'part_shipped') return 'Part shipped';
  if (status === 'confirmed') return 'Confirmed';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}
