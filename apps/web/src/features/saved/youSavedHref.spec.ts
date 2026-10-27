import { describe, expect, it } from 'vitest';
import {
  isYouSavedSearch,
  youLibraryTabFromSearch,
  youLibraryWriteSearch,
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
    expect(youLibraryTabFromSearch(new URLSearchParams('tab=saved&kind=products'))).toBe(
      'products',
    );
    expect(youLibraryTabFromSearch(new URLSearchParams('tab=collections&saved=1'))).toBe(
      'collections',
    );
    expect(youLibraryTabFromSearch(new URLSearchParams('saved=1'))).toBe('collections');
    expect(youLibraryTabFromSearch(new URLSearchParams())).toBe('collections');
    expect(youLibraryTabFromSearch(new URLSearchParams('tab=products'))).toBe('products');
    expect(youLibraryTabFromSearch(new URLSearchParams('tab=catalogs'))).toBe('catalogs');
  });

  it('writes tab=products so Designs is not a dead tap (default is Collections)', () => {
    expect(youLibraryWriteSearch({ tab: 'products' }).toString()).toBe('tab=products');
    expect(youLibraryTabFromSearch(youLibraryWriteSearch({ tab: 'products' }))).toBe('products');
    expect(youLibraryWriteSearch({ tab: 'collections' }).get('tab')).toBe('collections');
    expect(youLibraryWriteSearch({ tab: 'catalogs' }).get('tab')).toBe('catalogs');
    expect(youLibraryWriteSearch({ tab: 'products', saved: true, select: true }).toString()).toBe(
      'tab=products&saved=1&select=1',
    );
    expect(youLibraryWriteSearch({ tab: 'collections', drafts: true }).toString()).toBe(
      'tab=collections&view=draft',
    );
    expect(
      youLibraryWriteSearch({ tab: 'collections', drafts: true, archived: true }).get('view'),
    ).toBe('draft');
    expect(youLibraryWriteSearch({ tab: 'collections', archived: true }).get('view')).toBe(
      'archived',
    );
    expect(youLibraryWriteSearch({ tab: 'collections', drafts: true, saved: true }).has('view')).toBe(
      false,
    );
  });
});
