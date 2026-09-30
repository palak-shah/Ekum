/** Virtual design set — clubbed designs, no Collection in My Catalog. */

const MAX_IDS = 50;

export function parseDesignSetIds(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_IDS) break;
  }
  return out;
}

/** Path to browse a clubbed design set (per-design access on open). */
export function designSetPath(
  productIds: string[],
  opts?: { facilitator?: string; threadId?: string; messageId?: string },
): string {
  const ids = parseDesignSetIds(productIds.join(','));
  if (ids.length < 1) return '/explore';
  const params = new URLSearchParams();
  params.set('ids', ids.join(','));
  if (opts?.facilitator) params.set('facilitator', opts.facilitator);
  if (opts?.threadId) params.set('thread', opts.threadId);
  if (opts?.messageId) params.set('msg', opts.messageId);
  return `/designs/set?${params.toString()}`;
}

export function parseQuoteDesignNavState(
  state: unknown,
): { messageId: string; productId: string } | null {
  if (!state || typeof state !== 'object') return null;
  const raw = (state as { quoteDesign?: unknown }).quoteDesign;
  if (!raw || typeof raw !== 'object') return null;
  const messageId =
    typeof (raw as { messageId?: unknown }).messageId === 'string'
      ? (raw as { messageId: string }).messageId.trim()
      : '';
  const productId =
    typeof (raw as { productId?: unknown }).productId === 'string'
      ? (raw as { productId: string }).productId.trim()
      : '';
  if (!messageId || !productId) return null;
  return { messageId, productId };
}
