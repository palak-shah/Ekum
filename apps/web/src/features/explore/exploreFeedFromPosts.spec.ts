import { describe, expect, it } from 'vitest';
import type { ExplorePost } from '@ekum/domain-types';
import {
  exploreBuyingCanLoadMore,
  exploreBuyingFeedExhausted,
  exploreBuyingShouldProbeOlder,
  exploreFeedEndVisible,
  exploreFeedLoadMoreVisible,
  exploreLandingBlocked,
  feedCursorFromMixedId,
  mixedOpportunitiesFromExplorePosts,
  uniqueMixedOpportunitiesById,
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
    viewerReposted: false,
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

  it('keeps first occurrence when older pages repeat the same pack id', () => {
    const pageA = mixedOpportunitiesFromExplorePosts([collectionPost]);
    const pageB = mixedOpportunitiesFromExplorePosts([
      { ...collectionPost, postedAt: '2026-09-01T10:00:00.000Z' },
    ]);
    const home = [{ id: 'c:other', kind: 'collection' as const }];
    const older = uniqueMixedOpportunitiesById([...pageA, ...pageB]);
    expect(older.map((row) => row.id)).toEqual(['c:c1']);
    const visible = uniqueMixedOpportunitiesById([
      ...home,
      ...older.filter((row) => row.id !== 'c:other'),
    ]);
    expect(visible.map((row) => row.id)).toEqual(['c:other', 'c:c1']);
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

  it('shows end footer only when home ready and feed is exhausted', () => {
    expect(
      exploreFeedEndVisible({ postCount: 3, homeReady: true, feedExhausted: true }),
    ).toBe(true);
    expect(
      exploreFeedEndVisible({ postCount: 3, homeReady: true, feedExhausted: false }),
    ).toBe(false);
    expect(
      exploreFeedEndVisible({ postCount: 3, homeReady: false, feedExhausted: true }),
    ).toBe(false);
  });

  it('shows Load more only when home ready, not exhausted, and more exists', () => {
    expect(
      exploreFeedLoadMoreVisible({
        homeReady: true,
        feedExhausted: false,
        storyFiltered: false,
        canLoadMore: true,
      }),
    ).toBe(true);
    expect(
      exploreFeedLoadMoreVisible({
        homeReady: true,
        feedExhausted: true,
        storyFiltered: false,
        canLoadMore: true,
      }),
    ).toBe(false);
    expect(
      exploreFeedLoadMoreVisible({
        homeReady: true,
        feedExhausted: false,
        storyFiltered: true,
        canLoadMore: true,
      }),
    ).toBe(false);
    expect(
      exploreFeedLoadMoreVisible({
        homeReady: true,
        feedExhausted: false,
        storyFiltered: false,
        canLoadMore: false,
      }),
    ).toBe(false);
  });

  it('maps design mixed ids to feed product cursors', () => {
    expect(feedCursorFromMixedId('d:prod-1')).toBe('p:prod-1');
    expect(feedCursorFromMixedId('c:pack-1')).toBe('c:pack-1');
  });

  it('does not offer Load more from a seed cursor alone', () => {
    expect(
      exploreBuyingCanLoadMore({
        homeTailOpen: false,
        homeTailCount: 0,
        feedSeedCursor: 'c:last',
        olderHasNextPage: false,
        olderHasUnrevealed: false,
        olderIsFetching: false,
        olderIsFetched: true,
      }),
    ).toBe(false);
  });

  it('offers Load more when home tail or older pages remain', () => {
    expect(
      exploreBuyingCanLoadMore({
        homeTailOpen: false,
        homeTailCount: 3,
        feedSeedCursor: 'c:last',
        olderHasNextPage: false,
        olderHasUnrevealed: false,
        olderIsFetching: false,
        olderIsFetched: false,
      }),
    ).toBe(true);
    expect(
      exploreBuyingCanLoadMore({
        homeTailOpen: false,
        homeTailCount: 0,
        feedSeedCursor: 'c:last',
        olderHasNextPage: true,
        olderHasUnrevealed: false,
        olderIsFetching: false,
        olderIsFetched: true,
      }),
    ).toBe(true);
    expect(
      exploreBuyingCanLoadMore({
        homeTailOpen: false,
        homeTailCount: 0,
        feedSeedCursor: 'c:last',
        olderHasNextPage: false,
        olderHasUnrevealed: true,
        olderIsFetching: false,
        olderIsFetched: true,
      }),
    ).toBe(true);
  });

  it('marks Buying exhausted after probe finds nothing beyond home', () => {
    expect(
      exploreBuyingFeedExhausted({
        homeReady: true,
        storyFiltered: false,
        homeTailOpen: false,
        homeTailCount: 0,
        feedSeedCursor: 'c:last',
        olderIsFetched: true,
        olderIsFetching: false,
        olderHasNextPage: false,
        olderHasUnrevealed: false,
      }),
    ).toBe(true);
    expect(
      exploreBuyingFeedExhausted({
        homeReady: true,
        storyFiltered: false,
        homeTailOpen: false,
        homeTailCount: 2,
        feedSeedCursor: 'c:last',
        olderIsFetched: false,
        olderIsFetching: false,
        olderHasNextPage: false,
        olderHasUnrevealed: false,
      }),
    ).toBe(false);
  });

  it('probes older feed when home has no closed tail', () => {
    expect(
      exploreBuyingShouldProbeOlder({
        homeTailOpen: false,
        homeTailCount: 0,
        feedSeedCursor: 'c:last',
      }),
    ).toBe(true);
    expect(
      exploreBuyingShouldProbeOlder({
        homeTailOpen: false,
        homeTailCount: 4,
        feedSeedCursor: 'c:last',
      }),
    ).toBe(false);
    expect(
      exploreBuyingShouldProbeOlder({
        homeTailOpen: true,
        homeTailCount: 4,
        feedSeedCursor: 'c:last',
      }),
    ).toBe(true);
  });
});
