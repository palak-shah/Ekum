/**
 * Unique Cart / Repost source. One pack or one solo design; omit when mixed.
 * Category/tags inherit the same uniqueness: copy only when every member agrees.
 */

export function uniqueSharedRepostHop(
  items: Array<{ collectionId?: string | null; productId: string }>,
): { repostSourceCollectionId?: string; repostSourceProductId?: string } {
  if (items.length === 0) return {};
  const collectionIds = [
    ...new Set(items.map((item) => item.collectionId).filter((id): id is string => Boolean(id))),
  ];
  if (collectionIds.length === 1 && items.every((item) => item.collectionId === collectionIds[0])) {
    return { repostSourceCollectionId: collectionIds[0] };
  }
  if (collectionIds.length > 0) return {};
  const productIds = [...new Set(items.map((item) => item.productId))];
  if (productIds.length === 1) return { repostSourceProductId: productIds[0] };
  return {};
}

/** First value when every entry equals it; otherwise null (including all-empty). */
export function uniqueSharedValue<T>(values: Array<T | null | undefined>): T | null {
  if (values.length === 0) return null;
  const first = values[0] ?? null;
  if (first === null) return null;
  for (const value of values) {
    if ((value ?? null) !== first) return null;
  }
  return first;
}

/** Same tag list (order-insensitive) on every member; omit when empty or mixed. */
export function uniqueSharedStringList(lists: string[][]): string[] | null {
  if (lists.length === 0) return null;
  if (lists.every((list) => (list?.length ?? 0) === 0)) return null;
  const keyOf = (list: string[]) => [...list].sort().join('\0');
  const firstKey = keyOf(lists[0] ?? []);
  if (lists.some((list) => keyOf(list ?? []) !== firstKey)) return null;
  return [...(lists[0] ?? [])];
}
