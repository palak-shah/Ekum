import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import {
  collectionFactsCategoryLine,
  collectionFactsLine,
  collectionMoreMenuNote,
  collectionOwnerManageDock,
  collectionOwnerCanEditDesign,
  collectionPackDetailSections,
  collectionPackQtySheet,
  collectionPackTradeDock,
  collectionShowHandleCopy,
  collectionShowOwnerCompanyRow,
  collectionShowPackNote,
  collectionThisPackSelectedIds,
  collectionViewerListedProducts,
  collectionViewerPrimaryAction,
  designSheetRateBand,
  designTileMetaLine,
  designTileRateOverlay,
  noteBlockOverflows,
  PACK_DETAILS_COLLAPSED_MAX_H_CLASS,
} from './collectionViewerChrome';

describe('collectionViewerListedProducts', () => {
  it('drops unpublished tiles', () => {
    expect(
      collectionViewerListedProducts([
        { id: 'a', status: ProductStatus.Published },
        { id: 'b', status: ProductStatus.Draft },
      ]),
    ).toEqual([{ id: 'a', status: ProductStatus.Published }]);
  });
});

describe('collectionViewerPrimaryAction', () => {
  it('keeps the header to ⋯ only — owner manage lives in the more sheet', () => {
    expect(collectionViewerPrimaryAction(true)).toBeNull();
    expect(collectionViewerPrimaryAction(false)).toBeNull();
  });
});

describe('collectionPackTradeDock', () => {
  const base = {
    visitor: true,
    live: true,
    hasProducts: true,
    selecting: false,
    resumeContinue: false,
    thisPackSelectedCount: 2,
  };

  it('shows Order only when this pack has picks', () => {
    expect(collectionPackTradeDock(base)).toBe(true);
    expect(collectionPackTradeDock({ ...base, thisPackSelectedCount: 0 })).toBe(false);
  });

  it('hides while selecting or for the owner', () => {
    expect(collectionPackTradeDock({ ...base, selecting: true })).toBe(false);
    expect(collectionPackTradeDock({ ...base, visitor: false })).toBe(false);
  });

  it('opens How many on origin packs, not only curated', () => {
    expect(collectionPackQtySheet({ visitor: true, hasProducts: true })).toBe(true);
    expect(collectionPackQtySheet({ visitor: true, hasProducts: false })).toBe(false);
    expect(collectionPackQtySheet({ visitor: false, hasProducts: true })).toBe(false);
  });
});

describe('collectionOwnerManageDock / company row', () => {
  it('claims the band only for owners opened to manage (packManage)', () => {
    expect(collectionOwnerManageDock({ isOwner: true, packManage: true })).toBe(true);
    expect(collectionOwnerManageDock({ isOwner: true, packManage: false })).toBe(false);
    expect(collectionOwnerManageDock({ isOwner: false, packManage: true })).toBe(false);
    expect(collectionShowOwnerCompanyRow(true)).toBe(false);
    expect(collectionShowOwnerCompanyRow(false)).toBe(false);
  });

  it('Explore own pack (!packManage) uses browse shortlist — not manage select', () => {
    // Same gate as manage dock: browse own select = !collectionOwnerManageDock
    expect(collectionOwnerManageDock({ isOwner: true, packManage: false })).toBe(false);
  });

  it('offers Edit on the design sheet only for own designs on own pack', () => {
    expect(
      collectionOwnerCanEditDesign({
        isOwner: true,
        myCompanyId: 'me',
        productCompanyId: 'me',
      }),
    ).toBe(true);
    expect(
      collectionOwnerCanEditDesign({
        isOwner: true,
        myCompanyId: 'me',
        productCompanyId: 'mill',
      }),
    ).toBe(false);
    expect(
      collectionOwnerCanEditDesign({
        isOwner: false,
        myCompanyId: 'buyer',
        productCompanyId: 'me',
      }),
    ).toBe(false);
  });
});

describe('collectionShowPackNote / facts / selection scope', () => {
  it('shows a filled pack note on the album, including our own', () => {
    expect(collectionShowPackNote('Festive sets.')).toBe(true);
    expect(collectionShowPackNote('  ')).toBe(false);
  });

  it('joins categories for the facts line', () => {
    expect(collectionFactsCategoryLine(['Fabric', 'Festive'])).toBe('Fabric · Festive');
    expect(collectionFactsCategoryLine([])).toBeNull();
    expect(collectionFactsLine(['Fabric'], '₹85–₹160 /mtr')).toBe('Fabric · ₹85–₹160 /mtr');
    expect(collectionFactsLine([], '₹85–₹160 /mtr')).toBe('₹85–₹160 /mtr');
    expect(collectionFactsLine(['Fabric'], null)).toBe('Fabric');
  });

  it('builds pack details in Rate · Size · Description · Item · Quality order', () => {
    expect(
      collectionPackDetailSections({
        categories: ['Kurti', 'Embroidered', 'S'],
        description: 'Festive.',
        rateBand: '₹1,200 /pc',
      }).map((row) => row.key),
    ).toEqual(['rate', 'size', 'description', 'item-tags', 'quality-tags']);
  });

  it('omits Size and Rate when empty', () => {
    expect(
      collectionPackDetailSections({
        categories: ['Kurti'],
        description: null,
        rateBand: null,
      }),
    ).toEqual([{ key: 'item-tags', label: 'Item tags', body: 'Kurti' }]);
  });

  it('builds design-sheet sections with honest rate only', () => {
    expect(
      collectionPackDetailSections({
        categories: ['Readymade', 'Embroidered', 'S'],
        description: 'Soft georgette.',
        rateBand: designSheetRateBand('₹400/pc'),
      }).map((row) => row.key),
    ).toEqual(['rate', 'size', 'description', 'item-tags', 'quality-tags']);
    expect(
      collectionPackDetailSections({
        categories: ['Readymade'],
        description: null,
        rateBand: designSheetRateBand('On request'),
      }),
    ).toEqual([{ key: 'item-tags', label: 'Item tags', body: 'Readymade' }]);
  });

  it('keeps only this-pack shortlist ids', () => {
    expect(
      collectionThisPackSelectedIds(['a', 'b', 'c'], new Set(['b', 'x'])),
    ).toEqual(['b']);
  });

  it('keeps album thumbs free of rate chips and SKU under the name', () => {
    expect(designTileRateOverlay('₹280 /mtr')).toBeNull();
    expect(designTileRateOverlay('On request')).toBeNull();
    expect(designTileRateOverlay(null)).toBeNull();
    expect(
      designTileMetaLine({ sku: 'SKU-1', rateLabel: '₹280 /mtr', variant: 'grid' }),
    ).toBe('');
    expect(
      designTileMetaLine({ sku: 'SKU-1', rateLabel: '₹280 /mtr', variant: 'feed' }),
    ).toBe('');
  });

  it('keeps honest ₹ on the design sheet and drops On request', () => {
    expect(designSheetRateBand('₹400/pc')).toBe('₹400/pc');
    expect(designSheetRateBand('On request')).toBeNull();
    expect(designSheetRateBand('')).toBeNull();
    expect(designSheetRateBand(null)).toBeNull();
  });

  it('flags overflow so View more can sit on the last clamped line', () => {
    expect(noteBlockOverflows(120, 80)).toBe(true);
    expect(noteBlockOverflows(80, 80)).toBe(false);
    // 3 × leading-5 (1.25rem) — not 4.5rem, which sliced mid-line.
    expect(PACK_DETAILS_COLLAPSED_MAX_H_CLASS).toBe('max-h-[3.75rem]');
  });
});

describe('collectionMoreMenuNote', () => {
  it('stays quiet for a normal visitor pack', () => {
    expect(
      collectionMoreMenuNote({ visitor: true, allowForward: true }),
    ).toBeNull();
  });

  it('explains look-only and Curate lock without blocking Forward', () => {
    expect(
      collectionMoreMenuNote({ visitor: true, lookOnly: true, allowForward: true }),
    ).toBe('You can view this collection.');
    expect(
      collectionMoreMenuNote({ visitor: true, allowForward: false }),
    ).toBe('You can look through — Curate into your collection is off.');
  });
});

describe('collectionShowHandleCopy', () => {
  it('shows trader copy on I handle, hides it on Direct (sr 16)', () => {
    expect(
      collectionShowHandleCopy({ curatedVisitor: true, viewerTicket: 'me' }),
    ).toBe(true);
    expect(
      collectionShowHandleCopy({ curatedVisitor: true, viewerTicket: 'mill' }),
    ).toBe(false);
    expect(collectionShowHandleCopy({ curatedVisitor: true })).toBe(true);
    expect(
      collectionShowHandleCopy({ curatedVisitor: false, viewerTicket: 'me' }),
    ).toBe(false);
  });
});
