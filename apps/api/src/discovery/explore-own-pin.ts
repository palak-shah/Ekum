/**
 * Own live packs must stay on Explore Buying / Stories You even when
 * followed shops already fill the 12-post home window.
 */

export function pinOwnRows<T>(rows: T[], isOwn: (row: T) => boolean): T[] {
  const own = rows.filter(isOwn);
  if (own.length === 0) return rows;
  const rest = rows.filter((row) => !isOwn(row));
  return [...own, ...rest];
}

export function prependUniqueById<T>(
  own: T[],
  rest: T[],
  idOf: (row: T) => string,
): T[] {
  if (own.length === 0) return rest;
  const seen = new Set(own.map(idOf));
  return [...own, ...rest.filter((row) => !seen.has(idOf(row)))];
}
