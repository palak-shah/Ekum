import { describe, expect, it } from 'vitest';
import type { SavedItemView } from '@ekum/domain-types';
import {
  savedProductIdSet,
  selectDesignBookmarkLabel,
  selectDesignsAllSaved,
} from './selectDesignBookmark';

describe('selectDesignBookmarkLabel', () => {
  it('singular / plural bookmark and remove', () => {
    expect(selectDesignBookmarkLabel({ count: 1, allSaved: false })).toBe('Bookmark design');
    expect(selectDesignBookmarkLabel({ count: 2, allSaved: false })).toBe('Bookmark designs');
    expect(selectDesignBookmarkLabel({ count: 1, allSaved: true })).toBe('Remove bookmark');
    expect(selectDesignBookmarkLabel({ count: 3, allSaved: true })).toBe('Remove bookmarks');
  });
});

describe('savedProductIdSet / selectDesignsAllSaved', () => {
  const items = [
    { kind: 'product', productId: 'a' },
    { kind: 'collection', collectionId: 'c1' },
    { kind: 'product', productId: 'b' },
  ] as SavedItemView[];

  it('keeps product bookmarks only', () => {
    expect([...savedProductIdSet(items)].sort()).toEqual(['a', 'b']);
  });

  it('requires every selected id saved', () => {
    const saved = savedProductIdSet(items);
    expect(selectDesignsAllSaved(['a', 'b'], saved)).toBe(true);
    expect(selectDesignsAllSaved(['a', 'x'], saved)).toBe(false);
    expect(selectDesignsAllSaved([], saved)).toBe(false);
  });
});
