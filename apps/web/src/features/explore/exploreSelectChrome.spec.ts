import { describe, expect, it } from 'vitest';
import { exploreShowSelectChrome } from './exploreSelectChrome';

describe('exploreShowSelectChrome', () => {
  const buyingPosts = {
    searchFocused: false,
    tradeSide: 'buying' as const,
    contentMode: 'all' as const,
    selectableCount: 3,
  };

  it('shows Select on a buying feed with posts', () => {
    expect(exploreShowSelectChrome(buyingPosts)).toBe(true);
  });

  it('hides Select while searching, selling, or browsing businesses', () => {
    expect(exploreShowSelectChrome({ ...buyingPosts, searchFocused: true })).toBe(false);
    expect(exploreShowSelectChrome({ ...buyingPosts, tradeSide: 'selling' })).toBe(false);
    expect(
      exploreShowSelectChrome({ ...buyingPosts, contentMode: 'businesses', selectableCount: 1 }),
    ).toBe(false);
  });

  it('hides Select when the shelf is empty', () => {
    expect(exploreShowSelectChrome({ ...buyingPosts, selectableCount: 0 })).toBe(false);
  });
});
