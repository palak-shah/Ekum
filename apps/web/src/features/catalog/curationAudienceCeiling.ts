import { PublishAudience } from '@ekum/domain-types';

/** Same ranks as apps/api curation-ceiling — lower = narrower. */
const AUDIENCE_RANK: Record<string, number> = {
  [PublishAudience.Selected]: 0,
  [PublishAudience.Connections]: 1,
  [PublishAudience.Followers]: 2,
  [PublishAudience.Everyone]: 3,
};

const RANK_TO_AUDIENCE = [
  PublishAudience.Selected,
  PublishAudience.Connections,
  PublishAudience.Followers,
  PublishAudience.Everyone,
] as const;

export function audienceRank(audience: string): number | null {
  const rank = AUDIENCE_RANK[audience];
  return rank === undefined ? null : rank;
}

export type CuratedMemberAudience = {
  companyId: string;
  audience: string;
};

/**
 * Narrowest foreign-member audience the pack may publish at.
 * `null` = no ceiling (own designs only, or unknown owner).
 */
export function maxPublishAudienceForCuratedPack(
  curatorCompanyId: string | undefined,
  products: CuratedMemberAudience[],
): string | null {
  if (!curatorCompanyId) return null;
  let minRank: number | null = null;
  for (const product of products) {
    if (product.companyId === curatorCompanyId) continue;
    const rank = audienceRank(product.audience);
    if (rank === null) continue;
    minRank = minRank === null ? rank : Math.min(minRank, rank);
  }
  if (minRank === null) return null;
  return RANK_TO_AUDIENCE[minRank] ?? null;
}

export function isAudienceWithinCeiling(
  audience: string,
  maxAudience: string | null,
): boolean {
  if (!maxAudience) return true;
  const want = audienceRank(audience);
  const max = audienceRank(maxAudience);
  if (want === null || max === null) return true;
  return want <= max;
}

export function clampAudienceToCeiling(
  audience: string,
  maxAudience: string | null,
): string {
  if (!maxAudience || isAudienceWithinCeiling(audience, maxAudience)) {
    return audience;
  }
  return maxAudience;
}
