import type { BrowseShortlistEntry } from './browseShortlist';

/**
 * Repost sheet designs: Cart parks the pile; staging may still hold pick-designs
 * resume. Prefer staging on id clash. When `productIds` is set, keep that order.
 */
export function curateSheetDesigns(input: {
  productIds?: string[];
  staging: BrowseShortlistEntry[];
  cart: BrowseShortlistEntry[];
}): { ids: string[]; entries: BrowseShortlistEntry[] } {
  const byId = new Map<string, BrowseShortlistEntry>();
  for (const entry of input.cart) byId.set(entry.productId, entry);
  for (const entry of input.staging) byId.set(entry.productId, entry);

  if (input.productIds != null) {
    const entries = input.productIds
      .map((id) => byId.get(id))
      .filter((entry): entry is BrowseShortlistEntry => Boolean(entry));
    return { ids: input.productIds, entries };
  }

  const entries = [...byId.values()];
  return { ids: entries.map((entry) => entry.productId), entries };
}
