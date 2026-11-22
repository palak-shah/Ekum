/** How many loose lines stamped from an expanded pack. */
export type HowManyCollectionStamp = {
  id: string;
  sourceCollectionId?: string | null;
  sourceCollectionName?: string | null;
};

export type HowManyCollectionGroup<T extends HowManyCollectionStamp> =
  | { kind: 'collection'; collectionId: string; name: string; items: T[] }
  | { kind: 'loose'; items: T[] };

/**
 * Group How many lines by expanded pack id (stable first-seen order).
 * Designs without a pack stamp stay in a trailing loose bucket.
 */
export function groupHowManyByCollection<T extends HowManyCollectionStamp>(
  items: T[],
): HowManyCollectionGroup<T>[] {
  const groups: HowManyCollectionGroup<T>[] = [];
  const byId = new Map<string, Extract<HowManyCollectionGroup<T>, { kind: 'collection' }>>();
  const loose: T[] = [];

  for (const item of items) {
    const collectionId = item.sourceCollectionId?.trim();
    if (!collectionId) {
      loose.push(item);
      continue;
    }
    let group = byId.get(collectionId);
    if (!group) {
      const name = item.sourceCollectionName?.trim() || 'Collection';
      group = { kind: 'collection', collectionId, name, items: [] };
      byId.set(collectionId, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  if (loose.length > 0) {
    groups.push({ kind: 'loose', items: loose });
  }
  return groups;
}
