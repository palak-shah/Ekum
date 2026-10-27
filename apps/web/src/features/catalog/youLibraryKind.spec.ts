import { CollectionKind, CollectionStatus } from '@ekum/domain-types';
import { describe, expect, it } from 'vitest';
import {
  YOU_LIBRARY_TABS,
  collectionsForYouTab,
  generalCollectionBadge,
  isGeneralCollection,
  collectionShowsPackOrderChrome,
  collectionShowsPackIdentityFacts,
  pinGeneralCollectionFirst,
  treatReadyAsDraft,
  youLibraryDeletedMenuLabel,
  youLibraryHrefAfterPackPublish,
  removeFromThisPackLabel,
  removedFromPackToast,
  deletedFromThisPackToast,
} from './youLibraryKind';

describe('you library tabs', () => {
  it('encodes Collections · Catalogs · Designs', () => {
    expect(YOU_LIBRARY_TABS.map((tab) => tab.label)).toEqual([
      'Collections',
      'Catalogs',
      'Designs',
    ]);
  });

  it('pins General Collection first and badges from kind after rename', () => {
    const rows = [
      { id: 'r1', kind: CollectionKind.Regular, name: 'Wedding' },
      { id: 'g1', kind: CollectionKind.General, name: 'Shop leftover' },
      { id: 'c1', kind: CollectionKind.Catalog, name: 'Season book' },
    ];
    expect(pinGeneralCollectionFirst(rows).map((row) => row.id)).toEqual(['g1', 'r1', 'c1']);
    expect(generalCollectionBadge('general')).toBe('General Collection');
    expect(isGeneralCollection('general')).toBe(true);
    expect(collectionsForYouTab(rows, 'collections').map((row) => row.id)).toEqual(['r1', 'g1']);
    expect(collectionsForYouTab(rows, 'catalogs').map((row) => row.id)).toEqual(['c1']);
  });

  it('hides pack apply-all and Order and dispatch on General Collection', () => {
    expect(collectionShowsPackOrderChrome(CollectionKind.General)).toBe(false);
    expect(collectionShowsPackOrderChrome(CollectionKind.Regular)).toBe(true);
    expect(collectionShowsPackOrderChrome(CollectionKind.Catalog)).toBe(true);
    expect(collectionShowsPackIdentityFacts(CollectionKind.General)).toBe(false);
    expect(collectionShowsPackIdentityFacts(CollectionKind.Regular)).toBe(true);
  });

  it('treats leftover Ready as Draft', () => {
    expect(treatReadyAsDraft(CollectionStatus.Ready)).toBe(true);
    expect(treatReadyAsDraft(CollectionStatus.Draft)).toBe(true);
    expect(treatReadyAsDraft(CollectionStatus.Published)).toBe(false);
  });

  it('Deleted menu matches the open tab', () => {
    expect(youLibraryDeletedMenuLabel('collections')).toBe('Deleted collections');
    expect(youLibraryDeletedMenuLabel('catalogs')).toBe('Deleted catalogs');
    expect(youLibraryDeletedMenuLabel('products')).toBe('Deleted designs');
  });

  it('Create & Publish catalog lands on Catalogs', () => {
    expect(youLibraryHrefAfterPackPublish(CollectionKind.Catalog)).toBe('/catalog?tab=catalogs');
    expect(youLibraryHrefAfterPackPublish(CollectionKind.Regular)).toBe('/catalog?tab=collections');
    expect(youLibraryHrefAfterPackPublish()).toBe('/catalog?tab=collections');
  });

  it('Remove on a catalog album says catalog, not collection', () => {
    expect(removeFromThisPackLabel(CollectionKind.Catalog)).toBe('Remove from this catalog');
    expect(removeFromThisPackLabel(CollectionKind.Regular)).toBe('Remove from this collection');
    expect(removedFromPackToast(CollectionKind.Catalog)).toBe('Removed from catalog');
    expect(deletedFromThisPackToast(CollectionKind.Catalog)).toBe('Deleted from this catalog');
  });
});
