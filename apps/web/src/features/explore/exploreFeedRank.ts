import type { ExploreDesignOpportunity, ExploreOpportunity } from '@ekum/domain-types';
import { isExplorePostUnseen } from './exploreFeedSeen';

export type MixedOpportunity =
  | {
      kind: 'collection';
      id: string;
      opportunity: ExploreOpportunity;
      tier: number;
      at: number;
      activityAt: string;
    }
  | {
      kind: 'design';
      id: string;
      opportunity: ExploreDesignOpportunity;
      tier: number;
      at: number;
      activityAt: string;
    };

/** First screen of posts on Explore — discovery shelves sit below this. */
export const EXPLORE_FEED_HOME_CAP = 12;

/**
 * Feed tiers (high → low):
 * 1. People you follow
 * 2. Connected + category interest
 * 3. Category interest (not connected)
 * 4. Connected without category match
 * 0. Everything else (All tab only)
 */
export function explorePostTier(relevance: string | null | undefined): number {
  const line = relevance ?? '';
  if (line.includes('In your network')) return 40;
  if (line.includes('Connected') && line.includes('Matches')) return 30;
  if (line.includes('Matches')) return 20;
  if (line.includes('Connected')) return 10;
  return 0;
}

export function buildRankedPostFeed(
  fromNetworkCollections: ExploreOpportunity[],
  fromNetworkDesigns: ExploreDesignOpportunity[],
  forYouCollections: ExploreOpportunity[],
  forYouDesigns: ExploreDesignOpportunity[],
  options?: {
    buyingFeed?: boolean;
    viewerCompanyId?: string;
    seenMap?: Record<string, { activityAt: string }>;
  },
): MixedOpportunity[] {
  const networkCollectionIds = new Set(fromNetworkCollections.map((row) => row.collection.id));
  const networkDesignIds = new Set(fromNetworkDesigns.map((row) => row.product.id));

  const rows: MixedOpportunity[] = [];

  for (const opportunity of fromNetworkCollections) {
    const activityAt = opportunity.collection.updatedAt;
    rows.push({
      kind: 'collection',
      id: `c:${opportunity.collection.id}`,
      opportunity,
      tier: 40,
      at: Date.parse(activityAt) || 0,
      activityAt,
    });
  }
  for (const opportunity of fromNetworkDesigns) {
    const activityAt = opportunity.product.postedAt;
    rows.push({
      kind: 'design',
      id: `d:${opportunity.product.id}`,
      opportunity,
      tier: 40,
      at: Date.parse(activityAt) || 0,
      activityAt,
    });
  }
  for (const opportunity of forYouCollections) {
    if (networkCollectionIds.has(opportunity.collection.id)) continue;
    const activityAt = opportunity.collection.updatedAt;
    rows.push({
      kind: 'collection',
      id: `c:${opportunity.collection.id}`,
      opportunity,
      tier: explorePostTier(opportunity.relevance),
      at: Date.parse(activityAt) || 0,
      activityAt,
    });
  }
  for (const opportunity of forYouDesigns) {
    if (networkDesignIds.has(opportunity.product.id)) continue;
    const activityAt = opportunity.product.postedAt;
    rows.push({
      kind: 'design',
      id: `d:${opportunity.product.id}`,
      opportunity,
      tier: explorePostTier(opportunity.relevance),
      at: Date.parse(activityAt) || 0,
      activityAt,
    });
  }

  const filtered = options?.buyingFeed ? rows.filter((row) => row.tier > 0) : rows;
  const viewerCompanyId = options?.viewerCompanyId;
  const seenMap = options?.seenMap;

  return filtered.sort((a, b) => {
    const tierDelta = b.tier - a.tier;
    if (tierDelta !== 0) return tierDelta;

    const aUnseen = isExplorePostUnseen(viewerCompanyId, a.id, a.activityAt, seenMap);
    const bUnseen = isExplorePostUnseen(viewerCompanyId, b.id, b.activityAt, seenMap);
    if (aUnseen !== bUnseen) return aUnseen ? -1 : 1;

    return b.at - a.at;
  });
}
