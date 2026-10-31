import type { OrderView } from '@ekum/domain-types';
import { explorePostedWhen } from '@/ui/cards';
import { isIHandleSellingParent } from './iHandleDesk';
import { orderNeedsYouLabel } from './tradeNeedsYouLabel';
import {
  tradeListDispatchInPlay,
  tradeListShipProgress,
  tradeListShipTotals,
} from './tradeListShipLine';

const TICKET_DONE = new Set(['dispatched', 'settled', 'delivered', 'declined', 'cancelled']);

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
 * I-handle trader desk keeps mill-named mill-card cues (skip here).
 */
export function orderTicketWaitingCue(order: OrderView): string | null {
  if (orderNeedsYouLabel(order)) return null;
  if (TICKET_DONE.has(order.status)) return null;
  if (isIHandleSellingParent(order)) return null;
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
};

function placeTimeAuthorYou(order: OrderView, viewerCompanyId: string): boolean {
  if (order.createdBySeller === true) return viewerCompanyId === order.sellerCompanyId;
  return viewerCompanyId === order.buyerCompanyId;
}

function placeTimeShopName(order: OrderView): string {
  return order.createdBySeller === true ? order.sellerName : order.buyerName;
}

/** Hop-scoped Notes: place-time snapshot + later `noted` trail (not quote/dispatch). */
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
      forwarded: false,
    });
  }
  for (const step of order.trail ?? []) {
    if (step.type !== 'noted') continue;
    const hasBody =
      Boolean(step.note?.trim()) ||
      Boolean(step.noteVoiceUrl) ||
      (step.noteImageUrls?.length ?? 0) > 0;
    if (!hasBody) continue;
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
    });
  }
  return notes;
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
