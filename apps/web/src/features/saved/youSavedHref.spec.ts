import { describe, expect, it } from 'vitest';
import {
  isYouSavedSearch,
  youLibraryTabFromSearch,
  youSavedHref,
} from './youSavedHref';

describe('youSavedHref', () => {
  it('opens Saved on You beside Archived', () => {
    expect(youSavedHref()).toBe('/more?saved=1');
    expect(youSavedHref({ collections: true })).toBe('/more?tab=collections&saved=1');
    expect(youSavedHref({ select: true })).toBe('/more?saved=1&select=1');
  });

  it('reads Saved from saved=1 or legacy tab=saved', () => {
    expect(isYouSavedSearch(new URLSearchParams('saved=1'))).toBe(true);
    expect(isYouSavedSearch(new URLSearchParams('tab=saved'))).toBe(true);
    expect(isYouSavedSearch(new URLSearchParams('tab=collections'))).toBe(false);
    expect(youLibraryTabFromSearch(new URLSearchParams('tab=saved&kind=collections'))).toBe(
      'collections',
    );
    expect(youLibraryTabFromSearch(new URLSearchParams('tab=collections&saved=1'))).toBe(
      'collections',
    );
    expect(youLibraryTabFromSearch(new URLSearchParams('saved=1'))).toBe('products');
  });
});
