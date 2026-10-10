import type { OrderView } from '@ekum/domain-types';
import { isIHandleSellingParent } from './iHandleDesk';
import {
  buyerCanAcceptQuote,
  sellerCanConfirm,
  sellerNeedsDispatch,
  sellerNeedsRate,
} from './orderAttention';

export type TradeListBallSide = {
  title: string;
  detail: string;
};

export type TradeListBallStrip = {
  left: TradeListBallSide;
  right: TradeListBallSide;
};

/**
 * Two quiet columns: who has the ball.
 * Names come from list payload only — soft-hidden mills/buyers are already null/trader on counterpart.
 */
export function tradeListBallStrip(order: OrderView): TradeListBallStrip | null {
  if (order.status === 'cancelled') return null;

  const other = order.counterpart?.name?.trim() || 'Shop';
  const trading = isIHandleSellingParent(order);

  if (trading) {
    const mills = (order.linkedMills ?? [])
      .map((m) => m.name?.trim())
      .filter(Boolean) as string[];
    // Soft-hide: empty mill names → show trader-side label, never invent a mill.
    const millTitle =
      mills.length === 0
        ? 'Supplier'
        : mills.length === 1
          ? mills[0]!
          : mills.length === 2
            ? `${mills[0]} + ${mills[1]}`
            : `${mills.length} mills`;
    return {
      left: {
        title: "Buyer's order",
        detail: buyerSideDetail(order),
      },
      right: {
        title: millTitle,
        detail: millSideDetail(order),
      },
    };
  }

  if (order.direction === 'buying') {
    return {
      left: { title: 'You', detail: youBuyDetail(order) },
      right: { title: other, detail: themSellDetail(order) },
    };
  }

  return {
    left: { title: other, detail: themBuyDetail(order) },
    right: { title: 'You', detail: youSellDetail(order) },
  };
}

function buyerSideDetail(order: OrderView): string {
  if (order.status === 'declined') return 'Declined';
  if (order.status === 'dispatched' || order.status === 'settled') return 'Dispatched';
  if (order.status === 'confirmed' || order.status === 'part_shipped') return 'Confirmed';
  if (order.hasSellerQuote || order.canAcceptQuote) return 'Quoted';
  return 'Placed';
}

function millSideDetail(order: OrderView): string {
  if (order.status === 'declined') return 'Declined';
  const held = order.linkedMills?.some((m) => m.held === true || m.orderId == null);
  if (held) return 'Not sent yet';
  if (order.needsQuotePass) return 'Quoted · Send quote';
  if (order.status === 'requested') return 'Waiting for confirm';
  if (sellerNeedsDispatch(order) || order.status === 'part_shipped') return 'Dispatch pending';
  if (order.status === 'dispatched' || order.status === 'settled') return 'Dispatched';
  if (order.status === 'confirmed') return 'Confirmed';
  return 'In progress';
}

function youBuyDetail(order: OrderView): string {
  if (order.status === 'declined') return 'Declined';
  if (buyerCanAcceptQuote(order)) return 'Accept quote';
  if (order.status === 'requested') return 'Placed';
  if (order.status === 'confirmed' || order.status === 'part_shipped') return 'Confirmed';
  if (order.status === 'dispatched' || order.status === 'settled') return 'Done';
  return statusWord(order.status);
}

function themSellDetail(order: OrderView): string {
  if (order.status === 'declined') return 'Declined';
  if (buyerCanAcceptQuote(order)) return 'Quoted';
  if (order.status === 'requested') return 'Waiting for quote';
  if (order.status === 'confirmed') return 'Dispatch pending';
  if (order.status === 'part_shipped') return 'Dispatch pending';
  if (order.status === 'dispatched' || order.status === 'settled') return 'Dispatched';
  return statusWord(order.status);
}

function themBuyDetail(order: OrderView): string {
  if (order.status === 'declined') return 'Declined';
  if (order.status === 'requested' && !order.hasSellerQuote) return 'Placed';
  if (order.status === 'requested') return 'Waiting for accept';
  if (order.status === 'confirmed' || order.status === 'part_shipped') return 'Confirmed';
  if (order.status === 'dispatched' || order.status === 'settled') return 'Done';
  return statusWord(order.status);
}

function youSellDetail(order: OrderView): string {
  if (order.status === 'declined') return 'You declined';
  if (sellerNeedsRate(order)) return 'Send quote';
  if (sellerCanConfirm(order)) return 'Confirm';
  if (order.status === 'requested' && order.hasSellerQuote) return 'Quoted';
  if (sellerNeedsDispatch(order)) return 'Dispatch pending';
  if (order.status === 'confirmed') return 'Confirmed';
  if (order.status === 'part_shipped') return 'Dispatch pending';
  if (order.status === 'dispatched' || order.status === 'settled') return 'Dispatched';
  return statusWord(order.status);
}

function statusWord(status: string): string {
  if (status === 'part_shipped') return 'Part shipped';
  if (status === 'requested') return 'Requested';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}
