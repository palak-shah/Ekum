import type { OrderView } from '@ekum/domain-types';
import { isIHandleSellingParent, traderIHandleNeedsYouLabel } from './iHandleDesk';
import {
  buyerCanAcceptQuote,
  sellerCanConfirm,
  sellerNeedsDispatch,
  sellerNeedsRate,
} from './orderAttention';
import { tradeListShipLine } from './tradeListShipLine';
import { tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import type { TradeListItem } from './tradeList';

/**
 * One protocol sentence under the card (prototype) — not a dual ball strip,
 * not a second teal verb repeating Confirm.
 */
export function tradeListProtocol(item: TradeListItem): string | null {
  if (item.kind === 'order') return orderProtocol(item.order);
  if (item.kind === 'sample') {
    const needs = tradeNeedsYouLabel(item);
    if (!needs) return null;
    const verb = needs.replace(/^Needs you ·\s*/, '').trim();
    return verb ? `Waiting for you to ${verb.toLowerCase()}` : null;
  }
  if (item.kind === 'complaint') {
    if (item.complaint.status === 'open' && !item.complaint.mine) {
      return 'Waiting for you on this complaint';
    }
    return null;
  }
  return null;
}

function orderProtocol(order: OrderView): string | null {
  if (order.status === 'cancelled' || order.status === 'declined') {
    return tradeListShipLine(order);
  }

  if (isIHandleSellingParent(order)) {
    const needs = traderIHandleNeedsYouLabel(order);
    if (needs) {
      const verb = needs.replace(/^Needs you ·\s*/, '').trim();
      if (verb.toLowerCase().startsWith('send')) {
        return `Waiting for you to ${verb.charAt(0).toLowerCase()}${verb.slice(1)}`;
      }
      return `Waiting for you to ${verb.toLowerCase()}`;
    }
    return tradeListShipLine(order);
  }

  if (sellerNeedsRate(order) || sellerCanConfirm(order) || order.needsQuotePass) {
    return 'Waiting for you to confirm order';
  }
  if (buyerCanAcceptQuote(order)) {
    return 'Waiting for you to accept quote';
  }
  if (sellerNeedsDispatch(order)) {
    return tradeListShipLine(order) ?? 'Nothing dispatched yet · Dispatch pending';
  }

  // Idle / waiting on the other side — ship progress when useful, else quiet null.
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
