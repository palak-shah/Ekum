import { describe, expect, it } from 'vitest';
import {
  forBuyerPlaceSubsets,
  isDirectPackLine,
  packPlaceDirectEntries,
  packPlaceGoesToName,
  packPlaceGoesToSellerId,
  packPlaceHandleEntries,
  packPlaceWaveEntries,
  stampPackMillRoute,
} from './packPlacePhases';

const mill1 = {
  productId: 'p1',
  companyId: 'kavita',
  companyName: 'Ahmedabad Loom Co',
  sourceCollectionId: 'pack-1',
  sourceHandlerCompanyId: 'meena',
  sourceHandlerName: 'Jaipur Emporium',
  sourcePath: 'direct' as const,
  sourceDirect: true,
};
const mill2 = {
  productId: 'p2',
  companyId: 'ravi',
  companyName: 'Surat Silk House',
  sourceCollectionId: 'pack-1',
  sourceHandlerCompanyId: 'meena',
  sourceHandlerName: 'Jaipur Emporium',
  sourcePath: 'handle' as const,
  sourceDirect: false,
};
const mill3 = {
  productId: 'p3',
  companyId: 'loom-c',
  companyName: 'Loom C',
  sourceCollectionId: 'pack-1',
  sourceHandlerCompanyId: 'meena',
  sourceHandlerName: 'Jaipur Emporium',
  sourcePath: 'handle' as const,
  sourceDirect: false,
};

describe('stampPackMillRoute', () => {
  it('marks foreign Direct mills and leaves the rest I-handle', () => {
    expect(
      stampPackMillRoute({
        millCompanyId: 'kavita',
        packOwnerCompanyId: 'meena',
        directMillCompanyIds: ['kavita'],
      }),
    ).toEqual({ sourceDirect: true, sourcePath: 'direct' });
    expect(
      stampPackMillRoute({
        millCompanyId: 'ravi',
        packOwnerCompanyId: 'meena',
        directMillCompanyIds: ['kavita'],
      }),
    ).toEqual({ sourceDirect: false, sourcePath: 'handle' });
    expect(
      stampPackMillRoute({
        millCompanyId: 'meena',
        packOwnerCompanyId: 'meena',
        directMillCompanyIds: ['kavita'],
      }),
    ).toEqual({ sourceDirect: false, sourcePath: 'handle' });
  });
});

describe('packPlaceWaveEntries', () => {
  it('shows Direct mill lines first, then one I-handle remainder', () => {
    const mixed = [mill1, mill2, mill3];
    expect(packPlaceDirectEntries(mixed).map((row) => row.productId)).toEqual(['p1']);
    expect(packPlaceHandleEntries(mixed).map((row) => row.productId)).toEqual(['p2', 'p3']);
    expect(packPlaceWaveEntries(mixed).map((row) => row.productId)).toEqual(['p1']);
    expect(packPlaceWaveEntries([mill2, mill3]).map((row) => row.productId)).toEqual([
      'p2',
      'p3',
    ]);
  });

  it('treats sourceDirect as Direct even when sourcePath is missing', () => {
    expect(isDirectPackLine({ sourceDirect: true })).toBe(true);
    expect(isDirectPackLine({ sourcePath: 'direct' })).toBe(true);
    expect(isDirectPackLine({ sourcePath: 'handle' })).toBe(false);
  });
});

describe('packPlaceGoesTo', () => {
  it('names the Direct mill on sheet 1 and the trader on the I-handle sheet', () => {
    expect(packPlaceGoesToName([mill1, mill2, mill3])).toBe('Ahmedabad Loom Co');
    expect(packPlaceGoesToSellerId([mill1, mill2, mill3])).toBe('kavita');
    expect(packPlaceGoesToName([mill2, mill3])).toBe('Jaipur Emporium');
    expect(packPlaceGoesToSellerId([mill2, mill3])).toBe('meena');
  });

  it('uses multi when two Direct mills share sheet 1', () => {
    const mill1b = {
      ...mill1,
      productId: 'p1b',
      companyId: 'loom-d',
      companyName: 'Loom D',
    };
    expect(packPlaceGoesToSellerId([mill1, mill1b, mill2])).toBe('multi');
    expect(packPlaceGoesToName([mill1, mill1b, mill2])).toBeNull();
  });
});

describe('forBuyerPlaceSubsets', () => {
  it('splits Direct mill lines from I-handle remainder for that buyer', () => {
    const lines = [
      { productId: 'p1', companyId: 'kavita', quantity: 12 },
      { productId: 'p2', companyId: 'ravi', quantity: 12 },
      { productId: 'p3', companyId: 'meena', quantity: 12 },
    ];
    const { direct, handle } = forBuyerPlaceSubsets(lines, {
      actorCompanyId: 'meena',
      directMillCompanyIds: ['kavita'],
    });
    expect(direct.map((row) => row.productId)).toEqual(['p1']);
    expect(handle.map((row) => row.productId)).toEqual(['p2', 'p3']);
  });
});
