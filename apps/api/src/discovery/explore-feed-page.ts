/**
 * Buying feed paging helpers — first window soft-rank, later pages keyset.
 */

/** Newest pack per company first, then fill remaining slots by existing order. */
export function diversifyNewestThenFill<T>(
  rows: T[],
  companyIdOf: (row: T) => string,
  limit: number,
): T[] {
  if (limit <= 0 || rows.length === 0) return [];
  const seen = new Set<string>();
  const lead: T[] = [];
  const rest: T[] = [];
  for (const row of rows) {
    const companyId = companyIdOf(row);
    if (!seen.has(companyId)) {
      seen.add(companyId);
      lead.push(row);
    } else {
      rest.push(row);
    }
  }
  return [...lead, ...rest].slice(0, limit);
}

/** Parse `c:` / `p:` feed cursors. */
export function parseFeedCursor(
  cursor: string,
): { kind: 'collection' | 'product'; entityId: string } | null {
  if (cursor.startsWith('c:') && cursor.length > 2) {
    return { kind: 'collection', entityId: cursor.slice(2) };
  }
  if (cursor.startsWith('p:') && cursor.length > 2) {
    return { kind: 'product', entityId: cursor.slice(2) };
  }
  return null;
}

/** Prisma OR for rows strictly older than the cursor anchor (activity desc, id desc). */
export function olderThanActivityWhere(
  postedAt: Date,
  entityId: string,
  activityField: 'exploreActivityAt' | 'postedToMarketAt',
): Record<string, unknown> {
  return {
    OR: [
      { [activityField]: { lt: postedAt } },
      {
        AND: [{ [activityField]: postedAt }, { id: { lt: entityId } }],
      },
    ],
  };
}
