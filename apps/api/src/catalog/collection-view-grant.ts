/**
 * Pack look-through grants (Ask → Allow, or legacy rows).
 * Share-link claim never creates these — Request Access + owner Allow only.
 */

export const COLLECTION_VIEW_GRANT_TTL_MS = 48 * 60 * 60 * 1000;

export function collectionViewGrantExpiresAt(
  from: Date = new Date(),
  ttlMs: number = COLLECTION_VIEW_GRANT_TTL_MS,
): Date {
  return new Date(from.getTime() + ttlMs);
}

/** Server-side: missing/past expiresAt is inactive even if the row still exists. */
export function isCollectionViewGrantActive(
  grant: { expiresAt?: Date | string | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!grant?.expiresAt) return false;
  const ends = new Date(grant.expiresAt).getTime();
  if (Number.isNaN(ends)) return false;
  return ends > now.getTime();
}

/** Prisma where fragment — prefer in queries so expired rows never unlock. */
export function activeCollectionViewGrantWhere(now: Date = new Date()) {
  return { expiresAt: { gt: now } } as const;
}
