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
  opts?: { facilitator?: string },
): string {
  const ids = parseDesignSetIds(productIds.join(','));
  if (ids.length < 1) return '/explore';
  const params = new URLSearchParams();
  params.set('ids', ids.join(','));
  if (opts?.facilitator) params.set('facilitator', opts.facilitator);
  return `/designs/set?${params.toString()}`;
}
