import { shortOrderLabel } from '@ekum/domain-types';
import { orderViewerIsFacilitator } from '@/features/browse/forwardAttribution';
import { orderSheetTitle } from './orderQtyUi';
import { orderListMillCue, orderListRoleBit } from './tradeListRole';
import { tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import { tradeListThumbs } from './tradeListThumbs';
import type { TradeListItem } from './tradeList';

export { tradeListThumbs } from './tradeListThumbs';
export { tradeListShipLine } from './tradeListShipLine';
export { tradeListBallStrip } from './tradeListBallStrip';
export { tradeListProtocol, tradeListStatusLabel } from './tradeListProtocol';

export function tradeListPreview(
  item: TradeListItem,
  companyId: string | null,
): { preview: string; accent: boolean } {
  const needs = tradeNeedsYouLabel(item);
  if (needs) {
    // List already has a left accent for Needs you — show only the verb (Dispatch, Confirm…).
    const verb = needs.replace(/^Needs you ·\s*/, '').trim() || needs;
    return { preview: verb, accent: true };
  }

  if (item.kind === 'order') {
    const order = item.order;
    const shared = orderViewerIsFacilitator(order, companyId);
    // Quiet context only when it adds signal — no You buy/You sell (chrome + protocol cover that).
    if (shared) return { preview: 'Shared', accent: false };
    const mills = orderListMillCue(order);
    if (mills) return { preview: `Trading · ${mills}`, accent: false };
    if (orderListRoleBit(order, false) === 'Trading') {
      return { preview: 'Trading', accent: false };
    }
    return { preview: '', accent: false };
  }

  if (item.kind === 'sample') {
    return { preview: '', accent: false };
  }

  if (item.kind === 'complaint') {
    return {
      preview: '',
      accent: item.complaint.status === 'open' && !item.complaint.mine,
    };
  }

  return { preview: '', accent: false };
}

/** Always-on identity: order # and how many designs. */
export function tradeListFacts(item: TradeListItem): string {
  if (item.kind === 'order') {
    const order = item.order;
    const idLabel = shortOrderLabel(order.id, { inquiry: order.intent === 'inquiry' });
    return `${idLabel} · ${orderSheetTitle(order.items.length)}`;
  }
  if (item.kind === 'sample') {
    return `Sample · 1 design`;
  }
  if (item.kind === 'complaint') {
    const title = item.complaint.subject.trim() || 'Complaint';
    return title.length > 40 ? `${title.slice(0, 37)}…` : title;
  }
  return '';
}

export function tradeListWhen(item: TradeListItem): string {
  if (item.kind === 'order') return item.order.updatedAt || item.order.createdAt;
  if (item.kind === 'sample') return item.sample.updatedAt || item.sample.createdAt;
  if (item.kind === 'complaint') return item.complaint.updatedAt || item.complaint.createdAt;
  return item.updatedAt || item.createdAt;
}

/** First URL only — prefer tradeListThumbs for the stack. */
export function tradeListThumb(item: TradeListItem): string | null {
  const { urls } = tradeListThumbs(item);
  return urls[0] ?? null;
}
