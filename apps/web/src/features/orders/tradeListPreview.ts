import { shortOrderLabel } from '@ekum/domain-types';
import { orderViewerIsFacilitator } from '@/features/browse/forwardAttribution';
import { formatOrderQty } from '@/features/orders/orderLineBilling';
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
    const verb = needs.replace(/^Needs you\s+/, '').trim() || needs;
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

/** Shared order-unit tally for the facts line, or null when mixed / unknown. */
export function tradeListQtyFact(
  items: Array<{ quantity?: number; unit?: string | null; lineStatus?: string | null }>,
): string | null {
  const lines = items.filter((item) => item.lineStatus !== 'declined');
  if (lines.length === 0) return null;
  if (lines.some((item) => item.quantity == null || !Number.isFinite(item.quantity))) return null;
  const unit = (lines[0]?.unit ?? '').trim();
  if (!unit) return null;
  if (!lines.every((item) => (item.unit ?? '').trim() === unit)) return null;
  const qty = lines.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  if (qty <= 0) return null;
  return formatOrderQty({ quantity: qty, unit });
}

/** Remaining lines for list facts — declined drop out of design count and qty. */
export function tradeListFactLines<
  T extends { lineStatus?: string | null },
>(items: T[]): T[] {
  const remaining = items.filter((item) => item.lineStatus !== 'declined');
  return remaining.length > 0 ? remaining : items;
}

/** Always-on identity: `Order #VONR 2 designs 12 sets` (qty when the unit is shared). */
export function tradeListFacts(item: TradeListItem): string {
  if (item.kind === 'order') {
    const order = item.order;
    const idLabel = shortOrderLabel(order.id, { inquiry: order.intent === 'inquiry' });
    const lines = tradeListFactLines(order.items);
    const designs = orderSheetTitle(lines.length);
    const qty = tradeListQtyFact(order.items);
    return [idLabel, designs, qty].filter(Boolean).join(' ');
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
