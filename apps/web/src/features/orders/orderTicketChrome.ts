import { shortOrderLabel, type OrderView } from '@ekum/domain-types';
import { explorePostedWhen } from '@/ui/cards';
import { isIHandleSellingParent, isTraderMillHop, traderDeskNextAction } from './iHandleDesk';
import { orderNeedsYouLabel } from './tradeNeedsYouLabel';
import {
  tradeListDispatchInPlay,
  tradeListShipProgress,
  tradeListShipTotals,
} from './tradeListShipLine';

const TICKET_DONE = new Set(['dispatched', 'settled', 'delivered', 'declined', 'cancelled']);

/** Selling 1:1 bilateral ticket — not Direct, not I-handle, no mill desks. */
export function isSellingBilateralTicket(
  order: Pick<OrderView, 'direction' | 'tradeMode' | 'millDesks' | 'linkedMills'>,
): boolean {
  if (order.direction !== 'selling') return false;
  if (order.tradeMode !== 'bilateral') return false;
  if (isIHandleSellingParent(order)) return false;
  if (order.millDesks && order.millDesks.length > 0) return false;
  return true;
}

/** Buying 1:1 bilateral ticket — not Direct, not I-handle mill hop, no mill desks. */
export function isBuyingBilateralTicket(
  order: Pick<
    OrderView,
    'direction' | 'tradeMode' | 'millDesks' | 'downstreamOrderId'
  >,
): boolean {
  if (order.direction !== 'buying') return false;
  if (order.tradeMode !== 'bilateral') return false;
  if (isTraderMillHop(order)) return false;
  if (order.millDesks && order.millDesks.length > 0) return false;
  return true;
}

/** Header subtitle: Buying · 3h ago · SSH-114 */
export function orderTicketSubtitle(order: OrderView): string {
  const side = order.direction === 'buying' ? 'Buying' : 'Selling';
  const when = explorePostedWhen(order.updatedAt || order.createdAt);
  const manual = order.manualRef?.manualOrderNo?.trim() || null;
  return [side, when, manual].filter(Boolean).join(' · ');
}

/** Ticket progress: `5 of 12 sets sent` in the order unit. */
export function orderTicketProgressCopy(order: OrderView): string | null {
  const progress = tradeListShipProgress(order);
  if (!progress) return null;
  const { noun } = tradeListShipTotals(order);
  const extra =
    progress.over && progress.shipped > progress.total
      ? ` · +${progress.shipped - progress.total} extra`
      : '';
  return noun
    ? `${progress.shipped} of ${progress.total} ${noun} sent${extra}`
    : `${progress.shipped} of ${progress.total} sent${extra}`;
}

export function orderTicketProgress(
  order: OrderView,
): { copy: string; shipped: number; total: number; over: boolean } | null {
  if (!tradeListDispatchInPlay(order)) return null;
  const progress = tradeListShipProgress(order);
  const copy = orderTicketProgressCopy(order);
  if (!progress || !copy) return null;
  return { copy, shipped: progress.shipped, total: progress.total, over: progress.over };
}

/**
 * Idle wait on the party block — role words, not mill names.
 * I-handle selling parent: after mill Send, mill-named wait from
 * `traderDeskNextAction`. Held mills stay silent here (Send is on the card).
 */
export function orderTicketWaitingCue(order: OrderView): string | null {
  if (orderNeedsYouLabel(order)) return null;
  if (TICKET_DONE.has(order.status)) return null;
  if (isIHandleSellingParent(order)) {
    if (order.millDesks?.some((desk) => desk.held)) return null;
    return traderDeskNextAction({
      status: order.status,
      counterpartName: order.counterpart?.name ?? '',
      hasSellerQuote: order.hasSellerQuote,
      millDesks: order.millDesks,
      youFulfilment: order.youFulfilment,
    });
  }
  if (order.direction === 'buying') return 'Waiting: supplier';
  if (order.direction === 'selling') return 'Waiting: buyer';
  return null;
}

export type OrderTicketNote = {
  id: string;
  who: string;
  mine: boolean;
  at: string;
  note: string | null;
  noteVoiceUrl: string | null;
  noteVoiceDurationMs: number | null;
  noteImageUrls: string[];
  forwarded: boolean;
  /** Quiet cue when the body came from a sheet, not a free note. */
  cue?: string | null;
  /** API Forward: place-time (`id === 'place'`) and free `noted` only. */
  forwardable: boolean;
};

export function orderTicketNoteCue(type: string): string | null {
  if (type === 'confirmed') return 'On confirm';
  if (type === 'dispatched' || type === 'part_shipped' || type === 'dispatch_edited') {
    return 'On dispatch';
  }
  if (type === 'settled') return 'On settle';
  return null;
}

function placeTimeAuthorYou(order: OrderView, viewerCompanyId: string): boolean {
  if (order.createdBySeller === true) return viewerCompanyId === order.sellerCompanyId;
  return viewerCompanyId === order.buyerCompanyId;
}

function placeTimeShopName(order: OrderView): string {
  return order.createdBySeller === true ? order.sellerName : order.buyerName;
}

function trailNoteHasBody(step: {
  note?: string | null;
  noteVoiceUrl?: string | null;
  noteImageUrls?: string[] | null;
}): boolean {
  return (
    Boolean(step.note?.trim()) ||
    Boolean(step.noteVoiceUrl) ||
    (step.noteImageUrls?.length ?? 0) > 0
  );
}

/** Hop-scoped Notes: place-time + any trail row with a body (not only `noted`). */
export function orderTicketNotes(order: OrderView, viewerCompanyId: string): OrderTicketNote[] {
  const notes: OrderTicketNote[] = [];
  const requested = (order.trail ?? []).find((step) => step.type === 'requested');
  const placeImages = requested?.noteImageUrls ?? [];
  const hasPlace =
    Boolean(order.note?.trim()) ||
    Boolean(order.noteVoiceUrl) ||
    placeImages.length > 0;
  if (hasPlace) {
    const mine = placeTimeAuthorYou(order, viewerCompanyId);
    notes.push({
      id: 'place',
      who: mine ? 'You' : placeTimeShopName(order),
      mine,
      at: order.createdAt,
      note: order.note,
      noteVoiceUrl: order.noteVoiceUrl,
      noteVoiceDurationMs: order.noteVoiceDurationMs,
      noteImageUrls: placeImages,
      /** Stamped on the requested trail after trader Forward — blocks duplicate forwards. */
      forwarded: requested?.forwarded === true,
      cue: null,
      forwardable: true,
    });
  }
  for (const step of order.trail ?? []) {
    if (step.type === 'requested') continue;
    if (!trailNoteHasBody(step)) continue;
    const mine = step.mine === true;
    notes.push({
      id: step.id,
      who: mine ? 'You' : step.who?.trim() || order.counterpart.name,
      mine,
      at: step.at,
      note: step.note,
      noteVoiceUrl: step.noteVoiceUrl,
      noteVoiceDurationMs: step.noteVoiceDurationMs,
      noteImageUrls: step.noteImageUrls ?? [],
      forwarded: step.forwarded === true,
      cue: step.type === 'noted' ? null : orderTicketNoteCue(step.type),
      forwardable: step.type === 'noted',
    });
  }
  return notes.sort((a, b) => a.at.localeCompare(b.at));
}

/** I-handle trader desk only — Direct / mill seller / end buyer never Forward. */
export function orderTicketCanForwardNotes(
  order: Pick<OrderView, 'tradeMode' | 'direction' | 'millDesks' | 'downstreamOrderId'>,
): boolean {
  if (order.tradeMode === 'direct') return false;
  if (order.millDesks && order.millDesks.length > 0 && order.direction === 'selling') {
    return true;
  }
  return Boolean(order.downstreamOrderId && order.direction === 'buying');
}

export function orderTicketForwardMills(
  order: Pick<OrderView, 'millDesks'>,
): Array<{ orderId: string; name: string }> {
  return (order.millDesks ?? [])
    .filter((desk) => !desk.held)
    .map((desk) => ({ orderId: desk.upstreamOrderId, name: desk.sellerName }));
}

/** Released mill hop: trader (buyer of the mill) → parent selling order. */
export function traderSellingHop(
  order: Pick<OrderView, 'direction' | 'relatedOrders'>,
): { id: string; buyerName: string } | null {
  if (order.direction !== 'buying') return null;
  const down = (order.relatedOrders ?? []).find(
    (row) => row.role === 'downstream' && Boolean(row.buyerName),
  );
  if (!down?.buyerName) return null;
  return { id: down.id, buyerName: down.buyerName };
}

export function traderSellingHopCopy(
  buyerName: string,
  orderId: string,
): { title: string; detail: string } {
  const hash = shortOrderLabel(orderId).replace(/^Order /, '');
  return {
    title: `For ${buyerName} · your selling order ${hash}`,
    detail: `Dispatch goes straight to ${buyerName}`,
  };
}
