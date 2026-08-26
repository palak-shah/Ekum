import { describe, expect, it } from 'vitest';
import { buildRankedPostFeed, explorePostTier } from './exploreFeedRank';
import type { ExploreDesignOpportunity, ExploreOpportunity } from '@ekum/domain-types';

function collectionOpportunity(
  id: string,
  relevance: string | null,
  updatedAt: string,
): ExploreOpportunity {
  return {
    relevance,
    collection: {
      id,
      name: id,
      updatedAt,
      coverImage: null,
      productCount: 1,
      allowForward: true,
      company: {
        id: `co-${id}`,
        name: 'Co',
        city: 'Surat',
        logoUrl: null,
        verification: 'unverified',
        sellCategories: [],
        buyCategories: [],
      },
    },
  };
}

function designOpportunity(
  id: string,
  relevance: string | null,
  postedAt: string,
): ExploreDesignOpportunity {
  return {
    relevance,
    product: {
      id,
      name: id,
      postedAt,
      images: [],
      allowForward: true,
      company: {
        id: `co-${id}`,
        name: 'Co',
        city: 'Surat',
        logoUrl: null,
        verification: 'unverified',
        sellCategories: [],
        buyCategories: [],
      },
    },
  };
}

describe('exploreFeedRank', () => {
  it('ranks follow, connected+interest, then interest', () => {
    expect(explorePostTier('In your network · Matches Sarees')).toBe(40);
    expect(explorePostTier('Connected · Matches Sarees')).toBe(30);
    expect(explorePostTier('Matches Sarees')).toBe(20);
    expect(explorePostTier('Connected')).toBe(10);
    expect(explorePostTier('Surat')).toBe(0);
  });

  it('orders feed tiers then recency', () => {
    const feed = buildRankedPostFeed(
      [collectionOpportunity('follow', 'In your network', '2026-08-20T10:00:00.000Z')],
      [],
      [
        collectionOpportunity('interest', 'Matches Sarees', '2026-08-22T10:00:00.000Z'),
        collectionOpportunity('connected', 'Connected · Matches Sarees', '2026-08-21T10:00:00.000Z'),
      ],
      [],
    );
    expect(feed.map((row) => row.id)).toEqual(['c:follow', 'c:connected', 'c:interest']);
  });

  it('buying feed drops unrelated market posts', () => {
    const feed = buildRankedPostFeed(
      [],
      [],
      [
        collectionOpportunity('interest', 'Matches Sarees', '2026-08-22T10:00:00.000Z'),
        collectionOpportunity('other', 'Surat', '2026-08-23T10:00:00.000Z'),
      ],
      [designOpportunity('design', 'Matches Fabric', '2026-08-21T10:00:00.000Z')],
      { buyingFeed: true },
    );
    expect(feed.map((row) => row.id)).toEqual(['c:interest', 'd:design']);
  });

  it('puts unseen posts above seen within the same tier', () => {
    const feed = buildRankedPostFeed(
      [],
      [],
      [
        collectionOpportunity('seen', 'Matches Sarees', '2026-08-22T10:00:00.000Z'),
        collectionOpportunity('new', 'Matches Sarees', '2026-08-21T10:00:00.000Z'),
      ],
      [],
      {
        viewerCompanyId: 'co-me',
        seenMap: { 'c:seen': { activityAt: '2026-08-22T10:00:00.000Z' } },
      },
    );
    expect(feed.map((row) => row.id)).toEqual(['c:new', 'c:seen']);
  });
});
