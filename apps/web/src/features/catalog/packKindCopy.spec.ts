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
  ownerUpstreamUnavailableBody,
  ownerUpstreamUnavailableTitle,
  packUnavailableBody,
  packUnavailableTitle,
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
  { name: 'packUnavailableTitle', fn: packUnavailableTitle },
  { name: 'libraryReplaceKeepsPack', fn: libraryReplaceKeepsPack },
  { name: 'untitledPackFallback', fn: untitledPackFallback },
];

const COLLECTION_WORD = /\bcollections?\b/i;
const CATALOGUE_WORD = /\bcatalogues?\b/i;

describe('pack kind copy never interchanges', () => {
  it('catalogue strings say catalogue, not collection', () => {
    for (const row of PAIR) {
      const text = row.fn(CATALOG);
      expect(text, row.name).toMatch(CATALOGUE_WORD);
      expect(text, row.name).not.toMatch(COLLECTION_WORD);
    }
    expect(noDesignsInThisPack(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(noDesignsInThisPack(CATALOG, true)).not.toMatch(COLLECTION_WORD);
    expect(publishThisPackConsent(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(publishThisPackConsent(CATALOG, true)).not.toMatch(COLLECTION_WORD);
    expect(publishingThisPackExplore(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(ratesOnRequestWhenForeign(CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(packNameTakenBody('Diwali', CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(askToSeeThisPackBody('Ravi Textiles', CATALOG)).toMatch(CATALOGUE_WORD);
    expect(askedToOpenThisPack('Ravi Textiles', CATALOG)).not.toMatch(COLLECTION_WORD);
    expect(deleteOnlyThisPackBody(CATALOG)).toMatch(/this catalogue/);
  });

  it('collection strings say collection, not catalogue', () => {
    for (const row of PAIR) {
      const text = row.fn(COLLECTION);
      expect(text, row.name).toMatch(COLLECTION_WORD);
      expect(text, row.name).not.toMatch(CATALOGUE_WORD);
    }
    expect(noDesignsInThisPack(COLLECTION)).not.toMatch(CATALOGUE_WORD);
    expect(publishThisPackConsent(COLLECTION)).not.toMatch(CATALOGUE_WORD);
    expect(publishingThisPackExplore(COLLECTION)).not.toMatch(CATALOGUE_WORD);
    expect(packNameTakenBody('Wedding', COLLECTION)).not.toMatch(CATALOGUE_WORD);
    expect(askedToOpenThisPack('Ravi Textiles', COLLECTION)).not.toMatch(CATALOGUE_WORD);
  });

  it('New catalogue vs New collection, Catalogue name vs Collection name', () => {
    expect(newPackTitle(CATALOG)).toBe('New catalogue');
    expect(newPackTitle(COLLECTION)).toBe('New collection');
    expect(editPackTitle(CATALOG)).toBe('Edit catalogue');
    expect(packNameLabel(CATALOG)).toBe('Catalogue name');
    expect(packNameLabel(COLLECTION)).toBe('Collection name');
    expect(updatePackLabel(CATALOG)).toBe('Update catalogue');
    expect(enterPackNameError(CATALOG)).toBe('Enter a catalogue name.');
    expect(findInThisPack(CATALOG)).toBe('Find in this catalogue');
    expect(shareThisPackLabel(CATALOG)).toBe('Share this catalogue');
    expect(createKindFromFlag(true)).toBe(CollectionKind.Catalog);
    expect(createKindFromFlag(false)).toBe(CollectionKind.Regular);
  });

  it('ask-to-see body may mention your collection as the dest, never this collection on a catalogue', () => {
    const catalogAsk = askToSeeThisPackBody('Meena', CATALOG);
    expect(catalogAsk).toContain('this catalogue');
    expect(catalogAsk).not.toContain('this collection');
    expect(catalogAsk).toContain('your collection');
  });

  it('soft-unavailable copy is not Ask / Request to access', () => {
    expect(packUnavailableTitle(COLLECTION)).toMatch(/isn’t available/);
    expect(packUnavailableTitle(CATALOG)).toMatch(/catalogue/);
    expect(packUnavailableBody()).not.toMatch(/Ask|Request to access/i);
    expect(packUnavailableBody()).toMatch(/source/i);
  });

  it('owner upstream banner never names a supplier', () => {
    expect(ownerUpstreamUnavailableTitle(COLLECTION)).toMatch(/Buyers can’t open/);
    expect(ownerUpstreamUnavailableBody()).toMatch(/source/i);
    expect(ownerUpstreamUnavailableBody()).not.toMatch(/Ask|mill|supplier/i);
  });
});
