import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import {
  collectionOwnerManageDock,
  collectionPackQtySheet,
  collectionPackTradeDock,
  collectionShowHandleCopy,
  collectionShowOwnerCompanyRow,
  collectionShowPackNote,
  collectionViewerListedProducts,
  collectionViewerPrimaryAction,
  noteBlockOverflows,
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
  it('gives owners Edit and visitors Bookmark', () => {
    expect(collectionViewerPrimaryAction(true)).toBe('edit');
    expect(collectionViewerPrimaryAction(false)).toBe('bookmark');
  });
});

describe('collectionPackTradeDock', () => {
  it('pins Ask rates / Order for a visitor on a live pack', () => {
    expect(
      collectionPackTradeDock({
        visitor: true,
        live: true,
        hasProducts: true,
        selecting: false,
        resumeContinue: false,
      }),
    ).toBe(true);
  });

  it('pins the dock on an origin pack (not only curated)', () => {
    expect(
      collectionPackTradeDock({
        visitor: true,
        live: true,
        hasProducts: true,
        selecting: false,
        resumeContinue: false,
      }),
    ).toBe(true);
  });

  it('yields the band while this album is selecting', () => {
    expect(
      collectionPackTradeDock({
        visitor: true,
        live: true,
        hasProducts: true,
        selecting: true,
        resumeContinue: false,
      }),
    ).toBe(false);
  });

  it('opens How many on origin packs, not only curated', () => {
    expect(collectionPackQtySheet({ visitor: true, hasProducts: true })).toBe(true);
    expect(collectionPackQtySheet({ visitor: true, hasProducts: false })).toBe(false);
    expect(collectionPackQtySheet({ visitor: false, hasProducts: true })).toBe(false);
  });

  it('hides the dock for the owner', () => {
    expect(
      collectionPackTradeDock({
        visitor: false,
        live: true,
        hasProducts: true,
        selecting: false,
        resumeContinue: false,
      }),
    ).toBe(false);
  });
});

describe('collectionOwnerManageDock / company row', () => {
  it('claims the band for owners and hides their shop card', () => {
    expect(collectionOwnerManageDock(true)).toBe(true);
    expect(collectionOwnerManageDock(false)).toBe(false);
    expect(collectionShowOwnerCompanyRow(true)).toBe(false);
    expect(collectionShowOwnerCompanyRow(false)).toBe(true);
  });
});

describe('collectionShowPackNote', () => {
  it('shows a filled pack note on the album, including our own', () => {
    expect(collectionShowPackNote('Festive sets.')).toBe(true);
    expect(collectionShowPackNote('  ')).toBe(false);
  });

  it('flags overflow so View more can sit on the last clamped line', () => {
    expect(noteBlockOverflows(120, 80)).toBe(true);
    expect(noteBlockOverflows(80, 80)).toBe(false);
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
