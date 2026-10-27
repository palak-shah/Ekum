import { describe, expect, it } from 'vitest';
import { CollectionKind, CollectionStatus } from '@ekum/domain-types';
import {
  addToPackActionLabel,
  addToPackCanOffer,
  addToPackConfirmLabel,
  addToPackIsMove,
  libraryDesignMembershipLine,
  addToPackAddedToast,
  addToPackAllCollectionsSelected,
  addToPackAlreadyInIds,
  addToPackEligibleTargets,
  addToPackEmptyCopy,
  addToPackGrouped,
  addToPackIsDraft,
  addToPackMatchesQuery,
  addToPackMergeMembership,
  addToPackSelectAll,
  addToPackToggle,
  emptyAddToPackPick,
  libraryDesignsEligibleForPack,
  libraryPickerEmptyCopy,
  libraryPickerHint,
} from './libraryPickerSource';

const gc = { id: 'gc-1', catalogCollectionId: null, collectionNames: [] as string[] };
const inPack = { id: 'p1', catalogCollectionId: null, collectionNames: ['Wedding'] };
const inCatalog = { id: 'c1', catalogCollectionId: 'cat-1', collectionNames: ['Season'] };

describe('libraryDesignsEligibleForPack', () => {
  it('catalog picker is General Collection leftovers only', () => {
    expect(libraryDesignsEligibleForPack([gc, inPack, inCatalog], 'catalog').map((d) => d.id)).toEqual(
      ['gc-1'],
    );
  });

  it('regular picker includes designs already in other packs, not catalog exclusive', () => {
    expect(libraryDesignsEligibleForPack([gc, inPack, inCatalog], 'regular').map((d) => d.id)).toEqual(
      ['gc-1', 'p1'],
    );
  });
});

const packs = [
  { id: 'col', kind: CollectionKind.Regular, status: CollectionStatus.Published },
  { id: 'cat', kind: CollectionKind.Catalog, status: CollectionStatus.Published },
  { id: 'draft', kind: CollectionKind.Regular, status: CollectionStatus.Draft },
  { id: 'gone', kind: CollectionKind.Regular, status: CollectionStatus.Archived },
];

describe('addToPackEligibleTargets', () => {
  it('offers live packs when moving an exclusive catalog design', () => {
    expect(addToPackEligibleTargets(packs, [inCatalog]).map((row) => row.id)).toEqual([
      'col',
      'cat',
      'draft',
    ]);
    expect(addToPackEmptyCopy([inCatalog])).toMatch(/Create a collection/);
    expect(addToPackEligibleTargets(packs, [gc, inCatalog])).toEqual([]);
    expect(addToPackEmptyCopy([gc, inCatalog])).toMatch(/not both/);
  });

  it('hides catalogs when a design already sits in a regular pack, and keeps drafts', () => {
    expect(addToPackEligibleTargets(packs, [inPack]).map((row) => row.id)).toEqual(['col', 'draft']);
  });

  it('offers published and draft collections plus catalogs for General Collection leftovers', () => {
    expect(addToPackEligibleTargets(packs, [gc]).map((row) => row.id)).toEqual(['col', 'cat', 'draft']);
  });
});

describe('addToPackAlreadyInIds', () => {
  it('marks packs every selected design already belongs to', () => {
    expect(
      [...addToPackAlreadyInIds([{ collectionIds: ['col', 'other'] }, { collectionIds: ['col'] }])],
    ).toEqual(['col']);
    expect(
      [
        ...addToPackAlreadyInIds([{ collectionNames: ['Wedding Edit'] }], [
          { id: 'col', name: 'Wedding Edit' },
          { id: 'other', name: 'Saree Daily' },
        ]),
      ],
    ).toEqual(['col']);
    expect(
      [
        ...addToPackAlreadyInIds(
          [{ collectionIds: ['col'], collectionNames: ['Saree Daily'], catalogCollectionId: 'cat' }],
          packs,
        ),
      ].sort(),
    ).toEqual(['cat', 'col']);
    expect(
      addToPackMergeMembership(
        { collectionIds: ['col'], collectionNames: ['Wedding'] },
        { collectionIds: ['other'], collectionNames: ['Saree Daily'] },
      ),
    ).toEqual({
      collectionIds: ['col', 'other'],
      collectionNames: ['Wedding', 'Saree Daily'],
      catalogCollectionId: null,
    });
    expect(addToPackIsDraft(CollectionStatus.Draft)).toBe(true);
    expect(addToPackToggle(emptyAddToPackPick, packs[0], new Set(['col']))).toEqual(
      emptyAddToPackPick,
    );
    expect(
      addToPackSelectAll(
        packs.filter((row) => row.status !== CollectionStatus.Archived),
        new Set(['col']),
      ),
    ).toEqual({
      collectionIds: ['draft'],
      catalogId: null,
    });
  });
});

describe('addToPackGrouped', () => {
  it('lists collections then catalogs', () => {
    expect(addToPackGrouped(packs.filter((row) => row.status === CollectionStatus.Published))).toEqual({
      collections: [packs[0]],
      catalogs: [packs[1]],
    });
  });
});

describe('addToPackToggle', () => {
  it('multi-selects collections and clears a catalog', () => {
    const one = addToPackToggle(emptyAddToPackPick, packs[0]);
    const two = addToPackToggle(one, { id: 'col-2', kind: CollectionKind.Regular });
    expect(two.collectionIds).toEqual(['col', 'col-2']);
    expect(two.catalogId).toBeNull();
  });

  it('selects one catalog and drops collections', () => {
    const withCols = addToPackToggle(emptyAddToPackPick, packs[0]);
    const withCat = addToPackToggle(withCols, packs[1]);
    expect(withCat).toEqual({ collectionIds: [], catalogId: 'cat' });
    expect(addToPackToggle(withCat, packs[1]).catalogId).toBeNull();
  });
});

describe('addToPackSelectAll', () => {
  it('picks every collection in this filter and never a catalog', () => {
    const live = packs.filter((row) => row.status !== CollectionStatus.Archived);
    expect(addToPackSelectAll(live)).toEqual({ collectionIds: ['col', 'draft'], catalogId: null });
    expect(
      addToPackAllCollectionsSelected({ collectionIds: ['col', 'draft'], catalogId: null }, live),
    ).toBe(true);
    expect(addToPackAllCollectionsSelected({ collectionIds: ['col'], catalogId: null }, live)).toBe(
      false,
    );
    expect(addToPackAllCollectionsSelected({ collectionIds: [], catalogId: 'cat' }, live)).toBe(
      false,
    );
  });
});

describe('addToPackMatchesQuery', () => {
  it('matches published names', () => {
    expect(addToPackMatchesQuery({ name: 'Wedding Edit' }, 'wed')).toBe(true);
    expect(addToPackMatchesQuery({ name: 'Wedding Edit' }, 'saree')).toBe(false);
  });
});

describe('addToPackActionLabel', () => {
  it('is library vs album, and Move when exclusive', () => {
    expect(addToPackCanOffer([gc])).toBe(true);
    expect(addToPackCanOffer([inPack])).toBe(true);
    expect(addToPackCanOffer([inCatalog])).toBe(true);
    expect(addToPackIsMove([inCatalog])).toBe(true);
    expect(addToPackCanOffer([gc, inCatalog])).toBe(false);
    expect(addToPackActionLabel([gc], 'library')).toBe('Add to collection / catalog');
    expect(addToPackActionLabel([inPack], 'library')).toBe('Add to collection / catalog');
    expect(addToPackActionLabel([inPack], 'album')).toBe('Add to other collections');
    expect(addToPackActionLabel([inCatalog], 'library')).toBe('Move to catalog / collection');
    expect(addToPackActionLabel([inCatalog], 'album')).toBe('Move to catalog / collection');
    expect(addToPackConfirmLabel([inCatalog])).toBe('Move');
    expect(addToPackConfirmLabel([gc])).toBe('Add');
    expect(addToPackActionLabel([gc])).toBe('Add to other collections');
  });
});

describe('libraryDesignMembershipLine', () => {
  it('joins pack names; leftover is blank', () => {
    expect(libraryDesignMembershipLine([])).toBeNull();
    expect(libraryDesignMembershipLine(['Wedding Edit', 'Season'])).toBe(
      'Wedding Edit · Season',
    );
  });
});

describe('addToPackAddedToast', () => {
  it('names catalog vs one vs many collections', () => {
    expect(addToPackAddedToast({ collectionIds: [], catalogId: 'cat' })).toBe('Added to catalog');
    expect(addToPackAddedToast({ collectionIds: ['col'], catalogId: null })).toBe(
      'Added to collection',
    );
    expect(addToPackAddedToast({ collectionIds: ['a', 'b'], catalogId: null })).toBe(
      'Added to 2 collections',
    );
    expect(addToPackAddedToast({ collectionIds: [], catalogId: 'cat' }, true)).toBe(
      'Moved to catalog',
    );
    expect(addToPackAddedToast({ collectionIds: ['col'], catalogId: null }, true)).toBe(
      'Moved to collection',
    );
  });
});

describe('libraryPickerHint', () => {
  it('tells catalog pickers to use General Collection leftovers', () => {
    expect(libraryPickerHint('catalog', false)).toMatch(/General Collection/);
    expect(libraryPickerHint('regular', false)).not.toMatch(/General Collection/);
  });

  it('replace hint keeps catalog vs collection', () => {
    expect(libraryPickerHint('catalog', true)).toMatch(/keeps the catalog/);
    expect(libraryPickerHint('catalog', true)).not.toMatch(/collection/);
    expect(libraryPickerHint('regular', true)).toMatch(/keeps the collection/);
    expect(libraryPickerHint('regular', true)).not.toMatch(/catalog/);
  });
});

describe('libraryPickerEmptyCopy', () => {
  it('explains catalog leftovers vs already-in-this-collection', () => {
    expect(libraryPickerEmptyCopy('catalog')).toMatch(/General Collection/);
    expect(libraryPickerEmptyCopy('regular')).toMatch(/already in this collection/);
  });
});
