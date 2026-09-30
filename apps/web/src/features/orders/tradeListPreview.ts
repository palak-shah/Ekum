import { shortOrderLabel } from '@ekum/domain-types';
import { statusLabel } from '@/lib/status';
import { orderViewerIsFacilitator } from '@/features/browse/forwardAttribution';
import { orderSheetTitle } from './orderQtyUi';
import { orderListMillCue, orderListRoleBit } from './tradeListRole';
import { tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import type { TradeListItem } from './tradeList';

export function tradeListPreview(
  item: TradeListItem,
  companyId: string | null,
): { preview: string; accent: boolean } {
  const needs = tradeNeedsYouLabel(item);
  if (needs) return { preview: needs, accent: true };

  if (item.kind === 'order') {
    const order = item.order;
    const shared = orderViewerIsFacilitator(order, companyId);
    const role = orderListRoleBit(order, shared);
    const mills = orderListMillCue(order);
    const parts = [role, mills, statusLabel(order.status)].filter(Boolean);
    return { preview: parts.join(' · '), accent: false };
  }

  if (item.kind === 'sample') {
    return { preview: `Sample · ${statusLabel(item.sample.status)}`, accent: false };
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
  return '';
}

export function tradeListWhen(item: TradeListItem): string {
  if (item.kind === 'order') return item.order.updatedAt || item.order.createdAt;
  if (item.kind === 'sample') return item.sample.updatedAt || item.sample.createdAt;
  return item.createdAt;
}
