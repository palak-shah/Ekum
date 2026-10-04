/**
 * Max rows pulled per lane before in-memory merge/page.
 * Keeps Explore feed/collections from loading the whole market into Nest.
 */
export function rankWindowTake(limit: number): number {
  const safe = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12;
  return Math.min(Math.max(safe * 5, 60), 200);
}
