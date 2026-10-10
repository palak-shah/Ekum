import type { TradeListItem } from './tradeList';

export const TRADE_LIST_THUMB_CAP = 3;
/** Overlap step for stacked thumbs (px). */
export const TRADE_LIST_THUMB_STEP = 14;
/** Square thumb edge (px) — matches Avatar size={48}. */
export const TRADE_LIST_THUMB_SIZE = 48;
/**
 * Fixed media column so shop names align down the list (cap-width stack,
 * even when only one photo or the avatar fallback shows).
 */
export const TRADE_LIST_MEDIA_WIDTH =
  TRADE_LIST_THUMB_SIZE + (TRADE_LIST_THUMB_CAP - 1) * TRADE_LIST_THUMB_STEP;

export type TradeListThumbs = {
  urls: string[];
  /** Designs (or images) beyond the visible stack — BM-01 +N. */
  overflow: number;
};

function lineImage(line: { image?: string | null; images?: string[] }): string | null {
  const url = line.image?.trim() || line.images?.[0]?.trim() || '';
  return url || null;
}

/** Overlapping design stack: one first-photo per line, cap 3, +N leftover. */
export function tradeListThumbs(item: TradeListItem): TradeListThumbs {
  if (item.kind === 'order') {
    const collected: string[] = [];
    for (const line of item.order.items ?? []) {
      const url = lineImage(line);
      if (url && !collected.includes(url)) collected.push(url);
    }
    const designCount = item.order.items?.length ?? 0;
    const urls = collected.slice(0, TRADE_LIST_THUMB_CAP);
    // No photos → avatar fallback; don't show a lonely +N.
    const overflow =
      urls.length === 0
        ? 0
        : Math.max(0, Math.max(designCount, collected.length) - urls.length);
    return { urls, overflow };
  }
  if (item.kind === 'complaint') {
    const all = (item.complaint.images ?? []).map((u) => u.trim()).filter(Boolean);
    const urls = all.slice(0, TRADE_LIST_THUMB_CAP);
    return { urls, overflow: Math.max(0, all.length - urls.length) };
  }
  return { urls: [], overflow: 0 };
}
