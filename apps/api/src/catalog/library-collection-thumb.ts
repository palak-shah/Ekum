/**
 * Owner library thumb: last photo on the member design that was updated last.
 * Photos have no per-file time — a new upload updates the design.
 * Includes draft members (Explore mosaics stay published-only).
 */
export function libraryCollectionThumb(
  members: Array<{ images?: string[] | null; updatedAt?: Date | string | null }>,
): string | null {
  let bestTime = -Infinity;
  let bestUrl: string | null = null;
  for (const member of members) {
    const urls = (member.images ?? [])
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url));
    if (urls.length === 0) continue;
    const time = member.updatedAt ? new Date(member.updatedAt).getTime() : 0;
    if (time >= bestTime) {
      bestTime = Number.isFinite(time) ? time : 0;
      bestUrl = urls[urls.length - 1] ?? null;
    }
  }
  return bestUrl;
}
