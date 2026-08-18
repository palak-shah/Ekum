import type { CursorPage } from '@ekum/domain-types';

/**
 * Turns a "fetch limit + 1" result set into a cursor page. Feeds order by
 * (createdAt desc, id desc); the opaque cursor defaults to the last row's id.
 */
export function toCursorPage<T, R>(
  rows: T[],
  limit: number,
  map: (row: T) => R,
  cursorOf: (row: T) => string = (row) => (row as { id: string }).id,
): CursorPage<R> {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    results: page.map(map),
    nextCursor: hasMore && last ? cursorOf(last) : null,
  };
}

/** Shared cursor arguments for a findMany over a createdAt/id-ordered feed. */
export function cursorArgs(query: {
  cursor?: string;
  limit: number;
  sort?: 'newest' | 'oldest';
}) {
  const dir = query.sort === 'oldest' ? ('asc' as const) : ('desc' as const);
  return {
    take: query.limit + 1,
    orderBy: [{ createdAt: dir }, { id: dir }],
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  };
}
