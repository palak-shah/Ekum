import type { CursorPage } from '@ekum/domain-types';

/**
 * Turns a "fetch limit + 1" result set into a cursor page. Feeds order by
 * (createdAt desc, id desc); the opaque cursor is the last row's id.
 */
export function toCursorPage<T extends { id: string }, R>(
  rows: T[],
  limit: number,
  map: (row: T) => R,
): CursorPage<R> {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    results: page.map(map),
    nextCursor: hasMore && last ? last.id : null,
  };
}

/** Shared cursor arguments for a findMany over a createdAt/id-ordered feed. */
export function cursorArgs(query: { cursor?: string; limit: number }) {
  return {
    take: query.limit + 1,
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  };
}
