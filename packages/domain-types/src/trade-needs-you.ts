import type { OrderView, ReturnView, SampleView } from './orders';

function isIHandleSellingParent(
  order: Pick<OrderView, 'direction' | 'tradeMode' | 'millDesks' | 'linkedMills'>,
): boolean {
  return (
    order.direction === 'selling' &&
    Boolean(
      order.tradeMode === 'manage' ||
        (order.millDesks && order.millDesks.length > 0) ||
        (order.linkedMills && order.linkedMills.length > 0),
    )
  );
}

function millLotStillHeld(order: Pick<OrderView, 'millDesks' | 'linkedMills'>): boolean {
  if (order.millDesks?.some((desk) => desk.held)) return true;
  return Boolean(order.linkedMills?.some((mill) => mill.held === true || mill.orderId == null));
}

/** Direct facilitator is direction=selling but not the mill seller. */
export function orderViewerIsDirectFacilitator(
  order: Pick<
    OrderView,
    'tradeMode' | 'facilitatorCompanyId' | 'sellerCompanyId' | 'buyerCompanyId'
  >,
  viewerCompanyId: string | null | undefined,
): boolean {
  if (!viewerCompanyId || order.tradeMode !== 'direct' || !order.facilitatorCompanyId) {
    return false;
  }
  return (
    order.facilitatorCompanyId === viewerCompanyId &&
    order.sellerCompanyId !== viewerCompanyId &&
    order.buyerCompanyId !== viewerCompanyId
  );
}

/** Same rows the Orders list marks Needs you. Pass viewer to exclude Direct facilitators. */
export function matchesOrderNeedsYou(
  order: OrderView,
  viewerCompanyId?: string | null,
): boolean {
  if (orderViewerIsDirectFacilitator(order, viewerCompanyId)) {
    return false;
  }
  if (isIHandleSellingParent(order)) {
    // Parent has no Send quote / Confirm — Needs you only while mills wait for Send.
    return order.status === 'requested' && millLotStillHeld(order);
  }
  if (
    order.direction === 'selling' &&
    order.status === 'requested' &&
    order.items.some((item) => item.rate == null)
  ) {
    return true;
  }
  if (
    order.direction === 'selling' &&
    order.status === 'requested' &&
    order.items.length > 0 &&
    order.items.every((item) => item.rate != null)
  ) {
    return true;
  }
  if (order.direction === 'buying' && order.canAcceptQuote === true) return true;
  if (
    order.direction === 'selling' &&
    (order.status === 'confirmed' || order.status === 'part_shipped') &&
    order.items.some((item) => item.remainingQuantity > 0)
  ) {
    return true;
  }
  if (order.canSettle) return true;
  if (order.needsQuotePass) return true;
  return false;
}

export function matchesSampleNeedsYou(sample: SampleView): boolean {
  if (sample.direction === 'selling' && sample.status === 'requested') return true;
  if (sample.direction === 'buying' && sample.status === 'dispatched') return true;
  return false;
}

export function matchesReturnNeedsYou(ret: ReturnView): boolean {
  return ret.status === 'requested';
}
