import { describe, expect, it } from 'vitest';
import type { ExplorePost } from '@ekum/domain-types';
import {
  exploreFeedEndVisible,
  exploreLandingBlocked,
  mixedOpportunitiesFromExplorePosts,
} from './exploreFeedFromPosts';

const collectionPost = {
  kind: 'collection',
  id: 'c1',
  postedAt: '2026-10-01T10:00:00.000Z',
  collection: {
    id: 'c1',
    name: 'Wedding',
    description: null,
    categories: [],
    memberFind: [],
    coverImage: null,
    previewImages: [],
    imageCount: 0,
    productCount: 2,
    status: 'live',
    updatedAt: '2026-10-01T10:00:00.000Z',
    allowForward: true,
    orderPathPreference: null,
    rateMin: null,
    rateMax: null,
    rateUnit: null,
    exploreNewDesignCount: 0,
    showSourceShops: false,
    sourceShopNames: [],
    company: {
      id: 'co1',
      name: 'Surat Silk',
      city: 'Surat',
      verification: 'none',
      logoUrl: null,
      sellCategories: [],
    },
  },
} as ExplorePost;

describe('exploreFeedFromPosts', () => {
  it('maps feed posts into mixed opportunities', () => {
    const rows = mixedOpportunitiesFromExplorePosts([collectionPost]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'collection', id: 'c:c1' });
  });

  it('unblocks landing when first-paint posts exist', () => {
    expect(
      exploreLandingBlocked({
        homeLoading: true,
        homeHasData: false,
        firstPaintLoading: false,
        firstPaintHasData: true,
        useFirstPaint: true,
      }),
    ).toBe(false);
  });

  it('keeps landing blocked while first-paint empty and home loading', () => {
    expect(
      exploreLandingBlocked({
        homeLoading: true,
        homeHasData: false,
        firstPaintLoading: false,
        firstPaintHasData: false,
        useFirstPaint: true,
      }),
    ).toBe(true);
  });

  it('shows end footer only when home ready and no more posts', () => {
    expect(
      exploreFeedEndVisible({ postCount: 3, morePostsCount: 0, homeReady: true }),
    ).toBe(true);
    expect(
      exploreFeedEndVisible({ postCount: 3, morePostsCount: 4, homeReady: true }),
    ).toBe(false);
    expect(
      exploreFeedEndVisible({ postCount: 3, morePostsCount: 0, homeReady: false }),
    ).toBe(false);
  });
});
