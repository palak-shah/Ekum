import type { ExplorePost } from '@ekum/domain-types';
import { explorePostTier, type MixedOpportunity } from './exploreFeedRank';

/** Initial buying feed window — then Load more for older (explore.md). */
export const EXPLORE_INITIAL_FEED_POSTS = 12;
/** Light parallel feed for first paint while home enriches. */
export const EXPLORE_FIRST_PAINT_POSTS = 6;

/** Map mixed feed API rows into Explore card models (first-paint / progressive). */
export function mixedOpportunitiesFromExplorePosts(posts: ExplorePost[]): MixedOpportunity[] {
  return posts.map((post) => {
    if (post.kind === 'collection') {
      const activityAt = post.postedAt || post.collection.updatedAt;
      return {
        kind: 'collection' as const,
        id: `c:${post.collection.id}`,
        opportunity: { collection: post.collection, relevance: null },
        tier: explorePostTier(null),
        at: Date.parse(activityAt) || 0,
        activityAt,
      };
    }
    const activityAt = post.postedAt || post.product.postedAt;
    return {
      kind: 'design' as const,
      id: `d:${post.product.id}`,
      opportunity: { product: post.product, relevance: null },
      tier: explorePostTier(null),
      at: Date.parse(activityAt) || 0,
      activityAt,
    };
  });
}

/** Full-page Explore loader only when neither first-paint feed nor home has arrived. */
export function exploreLandingBlocked(input: {
  homeLoading: boolean;
  homeHasData: boolean;
  firstPaintLoading: boolean;
  firstPaintHasData: boolean;
  useFirstPaint: boolean;
}): boolean {
  if (input.homeHasData) return false;
  if (input.useFirstPaint && input.firstPaintHasData) return false;
  if (input.useFirstPaint) {
    // Empty first-paint still waits on home (ranked shelves may have posts).
    return input.firstPaintLoading || input.homeLoading;
  }
  return input.homeLoading;
}

/**
 * Quiet end footer when posts exist and Load more has no further pages.
 * `feedExhausted` is true only after the home tail is open and the feed cursor is done.
 */
export function exploreFeedEndVisible(input: {
  postCount: number;
  homeReady: boolean;
  feedExhausted: boolean;
}): boolean {
  return input.homeReady && input.postCount > 0 && input.feedExhausted;
}

/** Kit Load more under Buying — mutually exclusive with the end footer. */
export function exploreFeedLoadMoreVisible(input: {
  homeReady: boolean;
  feedExhausted: boolean;
  storyFiltered: boolean;
  canLoadMore: boolean;
}): boolean {
  return (
    input.homeReady &&
    !input.storyFiltered &&
    !input.feedExhausted &&
    input.canLoadMore
  );
}

/** Home mixed ids use `d:`; feed cursors use `p:` for designs. */
export function feedCursorFromMixedId(id: string): string {
  if (id.startsWith('d:')) return `p:${id.slice(2)}`;
  return id;
}
