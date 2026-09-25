import { describe, expect, it } from 'vitest';
import {
  collectionPackTradeDock,
  collectionShowHandleCopy,
  collectionViewerPrimaryAction,
} from './collectionViewerChrome';

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
