import type { OrderView, ReturnView, SampleView } from '@ekum/domain-types';
import {
  buyerCanAcceptQuote,
  matchesNeeds,
  matchesReturnNeeds,
  matchesSampleNeeds,
  sellerCanConfirm,
  sellerNeedsDispatch,
  sellerNeedsRate,
  sellerNeedsReturnReview,
} from './orderAttention';
import { isIHandleSellingParent, traderIHandleNeedsYouLabel } from './iHandleDesk';
import type { TradeListItem } from './tradeList';

/** Short list cue for actionable trades (Home-style verbs). */
export function tradeNeedsYouLabel(
  item: TradeListItem,
  viewerCompanyId?: string | null,
): string | null {
  if (item.kind === 'order') return orderNeedsYouLabel(item.order, viewerCompanyId);
  if (item.kind === 'sample') return sampleNeedsYouLabel(item.sample);
  if (item.kind === 'complaint') {
    if (item.complaint.status === 'open' && !item.complaint.mine) {
      return 'Needs you Complaint';
    }
    return null;
  }
  return returnNeedsYouLabel(item.ret);
}

export function orderNeedsYouLabel(
  order: OrderView,
  viewerCompanyId?: string | null,
): string | null {
  if (isIHandleSellingParent(order)) return traderIHandleNeedsYouLabel(order);
  if (!matchesNeeds(order, viewerCompanyId)) return null;
  if (
    sellerCanConfirm(order, viewerCompanyId) ||
    sellerNeedsRate(order, viewerCompanyId) ||
    order.needsQuotePass
  ) {
    return 'Needs you Confirm';
  }
  if (buyerCanAcceptQuote(order)) return 'Needs you Accept quote';
  if (order.canSettle) return 'Needs you Settle';
  if (sellerNeedsDispatch(order, viewerCompanyId)) return 'Needs you Dispatch';
  return 'Needs you';
}

function sampleNeedsYouLabel(sample: SampleView): string | null {
  if (!matchesSampleNeeds(sample)) return null;
  if (sample.direction === 'selling' && sample.status === 'requested') {
    return 'Needs you Send sample';
  }
  if (sample.direction === 'buying' && sample.status === 'dispatched') {
    return 'Needs you Mark received';
  }
  return 'Needs you';
}

function returnNeedsYouLabel(ret: ReturnView): string | null {
  if (!matchesReturnNeeds(ret)) return null;
  if (sellerNeedsReturnReview(ret)) return 'Needs you Review return';
  return 'Needs you';
}
