import { CollectionStatus, type CollectionView } from '@ekum/domain-types';

/** Union current members with designs being curated (order: existing first, then new). */
export function mergeCollectionProductIds(
  existingIds: string[],
  addingIds: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...existingIds, ...addingIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

const STATUS_RANK: Record<string, number> = {
  [CollectionStatus.Draft]: 0,
  [CollectionStatus.Ready]: 1,
  [CollectionStatus.Published]: 2,
};

/** Owned albums eligible for Curate → Existing: non-archived, drafts/ready before published. */
export function curateExistingTargets(collections: CollectionView[]): CollectionView[] {
  return collections
    .filter((c) => c.status !== CollectionStatus.Archived)
    .slice()
    .sort((a, b) => {
      const rankDiff = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}

export function filterCurateTargetsByQuery(
  collections: CollectionView[],
  query: string,
): CollectionView[] {
  const q = query.trim().toLowerCase();
  if (!q) return collections;
  return collections.filter((c) => c.name.toLowerCase().includes(q));
}
