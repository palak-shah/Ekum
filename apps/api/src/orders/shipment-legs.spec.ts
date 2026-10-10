import { describe, expect, it } from 'vitest';
import {
  primaryLrFromLegs,
  resolveParcelCount,
  resolveShipmentLegs,
} from './shipment-legs';

describe('resolveShipmentLegs', () => {
  it('maps legs from DTO including imageUrls', () => {
    expect(
      resolveShipmentLegs({
        legs: [
          { lrNumber: ' LR-1 ', billNumber: ' B1 ', imageUrls: [' https://a/1.jpg '] },
          { lrNumber: '', billNumber: null },
        ],
      }),
    ).toEqual([
      {
        lrNumber: 'LR-1',
        billNumber: 'B1',
        imageUrls: ['https://a/1.jpg'],
        sortOrder: 0,
      },
      { lrNumber: null, billNumber: null, imageUrls: [], sortOrder: 1 },
    ]);
  });

  it('maps legacy lrNumber when legs omitted', () => {
    expect(resolveShipmentLegs({ lrNumber: 'LR-OLD' })).toEqual([
      { lrNumber: 'LR-OLD', billNumber: null, imageUrls: [], sortOrder: 0 },
    ]);
  });

  it('prefers legs over legacy lrNumber', () => {
    expect(
      resolveShipmentLegs({
        lrNumber: 'IGNORE',
        legs: [{ lrNumber: 'A', billNumber: '1' }],
      }),
    ).toEqual([{ lrNumber: 'A', billNumber: '1', imageUrls: [], sortOrder: 0 }]);
  });

  it('allows empty legs array', () => {
    expect(resolveShipmentLegs({ legs: [], lrNumber: 'X' })).toEqual([]);
  });

  it('caps leg photos at 3 and drops blanks', () => {
    expect(
      resolveShipmentLegs({
        legs: [
          {
            lrNumber: 'A',
            imageUrls: ['a', '', 'b', 'a', 'c', 'd'],
          },
        ],
      }),
    ).toEqual([
      {
        lrNumber: 'A',
        billNumber: null,
        imageUrls: ['a', 'b', 'c'],
        sortOrder: 0,
      },
    ]);
  });
});

describe('primaryLrFromLegs', () => {
  it('returns first non-empty LR', () => {
    expect(
      primaryLrFromLegs([
        { lrNumber: null, billNumber: 'B', imageUrls: [], sortOrder: 0 },
        { lrNumber: 'LR-2', billNumber: null, imageUrls: [], sortOrder: 1 },
      ]),
    ).toBe('LR-2');
  });
});

describe('resolveParcelCount', () => {
  it('keeps explicit parcelCount', () => {
    expect(
      resolveParcelCount(3, [
        { lrNumber: 'A', billNumber: null, imageUrls: [], sortOrder: 0 },
        { lrNumber: 'B', billNumber: null, imageUrls: [], sortOrder: 1 },
      ]),
    ).toBe(3);
  });

  it('falls back to legs.length', () => {
    expect(
      resolveParcelCount(undefined, [
        { lrNumber: 'A', billNumber: null, imageUrls: [], sortOrder: 0 },
        { lrNumber: 'B', billNumber: null, imageUrls: [], sortOrder: 1 },
      ]),
    ).toBe(2);
  });
});
