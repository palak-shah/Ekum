import { CollectionKind } from '@ekum/domain-types';
import { describe, expect, it } from 'vitest';
import {
  askedToOpenThisPack,
  askToSeeThisPack,
  askToSeeThisPackBody,
  allowedForThisPackOnly,
  bookmarkThisPackLabel,
  chooseWhoCanSeeThisPack,
  couldNotLoadThisPack,
  createKindFromFlag,
  deleteOnlyThisPackBody,
  editPackDetailsLabel,
  editPackTitle,
  enterPackNameError,
  findInThisPack,
  libraryReplaceKeepsPack,
  loadingPackLabel,
  missingPackError,
  newPackTitle,
  noDesignsInThisPack,
  onlyThisPackLabel,
  packNameLabel,
  packNameTakenBody,
  packNameTakenTitle,
  packNoun,
  packNounCap,
  pickWhoCanSeeThisPack,
  publishPackSheetTitle,
  publishThisPackBeforeShare,
  publishThisPackConsent,
  publishingThisPackExplore,
  ratesOnRequestWhenForeign,
  removedAccessToThisPack,
  replaceEntirePackLabel,
  shareThisPackLabel,
  thisPack,
  untitledPackFallback,
  updatePackLabel,
  youCanViewThisPack,
} from './packKindCopy';

const COLLECTION = CollectionKind.Regular;
const CATALOG = CollectionKind.Catalog;

type CopyFn = (kind?: string | null) => string;

const PAIR: Array<{ name: string; fn: CopyFn }> = [
  { name: 'packNoun', fn: packNoun },
  { name: 'packNounCap', fn: packNounCap },
  { name: 'thisPack', fn: thisPack },
  { name: 'packNameLabel', fn: packNameLabel },
  { name: 'enterPackNameError', fn: enterPackNameError },
  { name: 'couldNotLoadThisPack', fn: couldNotLoadThisPack },
  { name: 'loadingPackLabel', fn: loadingPackLabel },
  { name: 'missingPackError', fn: missingPackError },
  { name: 'newPackTitle', fn: newPackTitle },
  { name: 'editPackTitle', fn: editPackTitle },
  { name: 'updatePackLabel', fn: updatePackLabel },
  { name: 'editPackDetailsLabel', fn: editPackDetailsLabel },
  { name: 'shareThisPackLabel', fn: shareThisPackLabel },
  { name: 'bookmarkThisPackLabel', fn: bookmarkThisPackLabel },
  { name: 'replaceEntirePackLabel', fn: replaceEntirePackLabel },
  { name: 'findInThisPack', fn: findInThisPack },
  { name: 'pickWhoCanSeeThisPack', fn: pickWhoCanSeeThisPack },
  { name: 'chooseWhoCanSeeThisPack', fn: chooseWhoCanSeeThisPack },
  { name: 'publishPackSheetTitle', fn: publishPackSheetTitle },
  { name: 'publishThisPackBeforeShare', fn: publishThisPackBeforeShare },
  { name: 'packNameTakenTitle', fn: packNameTakenTitle },
  { name: 'youCanViewThisPack', fn: youCanViewThisPack },
  { name: 'removedAccessToThisPack', fn: removedAccessToThisPack },
  { name: 'allowedForThisPackOnly', fn: allowedForThisPackOnly },
  { name: 'onlyThisPackLabel', fn: onlyThisPackLabel },
  { name: 'askToSeeThisPack', fn: askToSeeThisPack },
  { name: 'libraryReplaceKeepsPack', fn: libraryReplaceKeepsPack },
  { name: 'untitledPackFallback', fn: untitledPackFallback },
];

const COLLECTION_WORD = /\bcollections?\b/i;
const CATALOG_WORD = /\bcatalogs?\b/i;

describe('pack kind copy never interchanges', () => {
  it('catalog strings say catalog, not collection', () => {
    for (const row of PAIR) {
      const text = row.fn(CATALOG);
      expect(text, row.name).toMatch(CATALOG_WORD);
      expect(text, row.name).not.toMatch(COLLECTION_WORD);
    }
    expect(noDesignsInThisPack(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(noDesignsInThisPack(CATALOG, true)).not.toMatch(COLLECTION_WORD);
    expect(publishThisPackConsent(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(publishThisPackConsent(CATALOG, true)).not.toMatch(COLLECTION_WORD);
    expect(publishingThisPackExplore(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(ratesOnRequestWhenForeign(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(packNameTakenBody('Diwali', CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(askToSeeThisPackBody('Ravi Textiles', CATALOG)).toMatch(CATALOG_WORD);
    expect(askedToOpenThisPack('Ravi Textiles', CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(deleteOnlyThisPackBody(CATALOG)).toMatch(/this catalog/);
  });

  it('collection strings say collection, not catalog', () => {
    for (const row of PAIR) {
      const text = row.fn(COLLECTION);
      expect(text, row.name).toMatch(COLLECTION_WORD);
      expect(text, row.name).not.toMatch(CATALOG_WORD);
    }
    expect(noDesignsInThisPack(COLLECTION)).not.toMatch(CATALOG_WORD);
    expect(publishThisPackConsent(COLLECTION)).not.toMatch(CATALOG_WORD);
    expect(publishingThisPackExplore(COLLECTION)).not.toMatch(CATALOG_WORD);
    expect(packNameTakenBody('Wedding', COLLECTION)).not.toMatch(CATALOG_WORD);
    expect(askedToOpenThisPack('Ravi Textiles', COLLECTION)).not.toMatch(CATALOG_WORD);
  });

  it('New catalog vs New collection, Catalog name vs Collection name', () => {
    expect(newPackTitle(CATALOG)).toBe('New catalog');
    expect(newPackTitle(COLLECTION)).toBe('New collection');
    expect(editPackTitle(CATALOG)).toBe('Edit catalog');
    expect(packNameLabel(CATALOG)).toBe('Catalog name');
    expect(packNameLabel(COLLECTION)).toBe('Collection name');
    expect(updatePackLabel(CATALOG)).toBe('Update catalog');
    expect(enterPackNameError(CATALOG)).toBe('Enter a catalog name.');
    expect(findInThisPack(CATALOG)).toBe('Find in this catalog');
    expect(shareThisPackLabel(CATALOG)).toBe('Share this catalog');
    expect(createKindFromFlag(true)).toBe(CollectionKind.Catalog);
    expect(createKindFromFlag(false)).toBe(CollectionKind.Regular);
  });

  it('ask-to-see body may mention your collection as the dest, never this collection on a catalog', () => {
    const catalogAsk = askToSeeThisPackBody('Meena', CATALOG);
    expect(catalogAsk).toContain('this catalog');
    expect(catalogAsk).not.toContain('this collection');
    expect(catalogAsk).toContain('your collection');
  });
});
