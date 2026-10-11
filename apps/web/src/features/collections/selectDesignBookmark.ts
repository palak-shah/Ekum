import type { SavedItemView } from '@ekum/domain-types';

/** Product ids currently bookmarked. */
export function savedProductIdSet(items: SavedItemView[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const item of items ?? []) {
    if (item.kind === 'product' && item.productId) ids.add(item.productId);
  }
  return ids;
}

export function selectDesignsAllSaved(
  productIds: readonly string[],
  savedProductIds: ReadonlySet<string>,
): boolean {
  return productIds.length > 0 && productIds.every((id) => savedProductIds.has(id));
}

/** Select-mode ⋯ label for bookmarking selected designs. */
export function selectDesignBookmarkLabel(input: {
  count: number;
  allSaved: boolean;
}): string {
  if (input.count < 1) return 'Bookmark design';
  if (input.allSaved) {
    return input.count === 1 ? 'Remove bookmark' : 'Remove bookmarks';
  }
  return input.count === 1 ? 'Bookmark design' : 'Bookmark designs';
}
