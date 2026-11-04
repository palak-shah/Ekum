/**
 * Own live packs stay on Explore Buying / Stories You without crowding
 * other businesses out of the first 12.
 */

/** Newest own packs that sit in the first 12; the rest go behind More posts. */
export const EXPLORE_OWN_PIN_LEAD = 2;

/** Other-lane ranking never includes the viewer. */
export function peerCompanyIdFilter(viewerCompanyId: string, followedIds: string[]) {
  return { notIn: [viewerCompanyId, ...followedIds] };
}

export function pinOwnRows<T>(
  rows: T[],
  isOwn: (row: T) => boolean,
  lead = EXPLORE_OWN_PIN_LEAD,
): T[] {
  const own = rows.filter(isOwn);
  if (own.length === 0) return rows;
  const rest = rows.filter((row) => !isOwn(row));
  return [...own.slice(0, lead), ...rest, ...own.slice(lead)];
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

/** At most `lead` newest own packs first, then peers, then remaining own. */
export function prependOwnCapped<T>(
  own: T[],
  rest: T[],
  idOf: (row: T) => string,
  lead = EXPLORE_OWN_PIN_LEAD,
): T[] {
  if (own.length === 0) return rest;
  const seen = new Set(own.map(idOf));
  const peers = rest.filter((row) => !seen.has(idOf(row)));
  return [...own.slice(0, lead), ...peers, ...own.slice(lead)];
}
