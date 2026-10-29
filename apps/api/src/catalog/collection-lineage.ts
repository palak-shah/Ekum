import { CollectionStatus, PublishAudience, RepostOrigin } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import { effectivePublishAudience } from './audience-visibility';

export async function resolveRepostRootId(
  prisma: PrismaService,
  sourceCollectionId: string,
): Promise<string> {
  let current = sourceCollectionId;
  const seen = new Set<string>();
  for (let i = 0; i < 32; i += 1) {
    if (seen.has(current)) return current;
    seen.add(current);
    const row = (await prisma.collection.findUnique({
      where: { id: current },
      select: {
        id: true,
        repostRootCollectionId: true,
        repostSourceCollectionId: true,
      },
    })) as {
      id: string;
      repostRootCollectionId: string | null;
      repostSourceCollectionId: string | null;
    } | null;
    if (!row) return sourceCollectionId;
    if (row.repostRootCollectionId) return row.repostRootCollectionId;
    if (!row.repostSourceCollectionId) return row.id;
    current = row.repostSourceCollectionId;
  }
  return current;
}

export function chainHasCompany(
  chainCompanyIds: string[],
  companyId: string,
): boolean {
  return chainCompanyIds.includes(companyId);
}

type ExistingPack = {
  id: string;
  status: string;
  createdAt: Date;
  publishedAt?: Date | null;
  exploreActivityAt?: Date | null;
};

/** Oldest published survivor; else oldest row. Never deletes duplicates. */
export function pickRootSurvivor<T extends ExistingPack>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  const live = rows.filter((row) => row.status === CollectionStatus.Published);
  const pool = live.length > 0 ? live : rows;
  return [...pool].sort((a, b) => {
    const aAt = (a.exploreActivityAt ?? a.createdAt).getTime();
    const bAt = (b.exploreActivityAt ?? b.createdAt).getTime();
    return aAt - bAt || a.createdAt.getTime() - b.createdAt.getTime();
  })[0];
}

export function isAutomaticOrigin(origin: string | null | undefined): boolean {
  return origin === RepostOrigin.Automatic;
}

/** Draft always reuses. Published automatic Selected may widen via manual Repost. */
export function shouldReuseRepostChild(existing: {
  status: string;
  audience?: string | null;
  repostOrigin?: string | null;
}): boolean {
  if (existing.status === CollectionStatus.Draft) return true;
  if (existing.status !== CollectionStatus.Published) return false;
  return (
    isAutomaticOrigin(existing.repostOrigin) &&
    effectivePublishAudience(existing.audience ?? '') === PublishAudience.Selected
  );
}

/**
 * Auto Selected → Followers keeps Direct Link buyers already delivered so Explore
 * can skip them. Ordinary Followers still store []. A second Followers save on
 * the same automatic hop must not wipe that skip list.
 */
export function audienceCompanyIdsForPublish(input: {
  nextAudience: string;
  nextCompanyIds?: string[] | null;
  priorAudience?: string | null;
  repostOrigin?: string | null;
  priorCompanyIds?: string[] | null;
}): string[] {
  if (effectivePublishAudience(input.nextAudience) === PublishAudience.Selected) {
    return [...new Set(input.nextCompanyIds ?? [])];
  }
  const priorIds = [...new Set(input.priorCompanyIds ?? [])];
  const prior = effectivePublishAudience(input.priorAudience ?? '');
  const keepDelivered =
    isAutomaticOrigin(input.repostOrigin) &&
    effectivePublishAudience(input.nextAudience) === PublishAudience.Followers &&
    (prior === PublishAudience.Selected || priorIds.length > 0);
  return keepDelivered ? priorIds : [];
}
