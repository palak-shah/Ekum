import { describe, expect, it } from 'vitest';
import {
  orderDispatchPreview,
  orderDispatchSectionSummary,
  piecesPerPackFieldValue,
} from './orderDispatchPreview';
import { collectionGalleryInputProps } from './collectionGalleryInput';
import { parseRateParts, rateRangeCaption } from './rateRange';
import { collectRateConflicts } from './collectionSameForAll';

describe('orderDispatchPreview', () => {
  it('shows 10 sets (= 40 pcs)', () => {
    expect(orderDispatchPreview('set', 4, 'pc')).toBe('10 sets (= 40 pcs)');
  });
});

describe('orderDispatchSectionSummary', () => {
  it('builds a quiet collapsed line from unit / contains / dispatch / MOQ', () => {
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '4',
        dispatchUnit: 'pc',
        moq: '10',
      }),
    ).toBe('set · 4 pcs · dispatch pc · MOQ 10');
  });

  it('omits dispatch when it matches order unit', () => {
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'pc',
        piecesPerPack: '1',
        dispatchUnit: 'pc',
        moq: '',
      }),
    ).toBe('pc · 1 pc');
  });

  it('uses dispatch noun for pack contents when Rate per is not stored (legacy)', () => {
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '5',
        dispatchUnit: 'mtr',
        moq: '',
      }),
    ).toBe('set · 5 mtrs · dispatch mtr');
  });

  it('keeps Rate per mtrs when dispatch is set', () => {
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '47',
        dispatchUnit: 'set',
        moq: '',
        contentsUnit: 'mtr',
      }),
    ).toBe('set · 47 mtrs');
    expect(orderDispatchPreview('set', 47, 'set', 10, 'mtr')).toBe(
      '10 sets (= 470 mtrs)',
    );
  });

  it('treats 0 as not given in the editor field', () => {
    expect(piecesPerPackFieldValue('0')).toBe('');
    expect(piecesPerPackFieldValue(0)).toBe('');
    expect(piecesPerPackFieldValue(4)).toBe('4');
  });

  it('treats 0 or blank pack as unset', () => {
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '0',
        dispatchUnit: 'mtr',
        moq: '',
      }),
    ).toBe('set · dispatch mtr');
    expect(
      orderDispatchSectionSummary({
        orderUnit: 'set',
        piecesPerPack: '',
        dispatchUnit: 'mtr',
        moq: '',
      }),
    ).toBe('set · dispatch mtr');
  });
});

describe('collectionGalleryInputProps', () => {
  it('does not set capture so Android Gallery is a picker', () => {
    expect(collectionGalleryInputProps).not.toHaveProperty('capture');
    expect(collectionGalleryInputProps.accept).toMatch(/image/);
    expect(collectionGalleryInputProps.multiple).toBe(true);
  });
});

describe('rate range', () => {
  it('captions single and range', () => {
    expect(rateRangeCaption('1200', '')).toBe('₹1,200');
    expect(rateRangeCaption('1200', '1400')).toBe('₹1,200–₹1,400');
    expect(rateRangeCaption('', '')).toBe('');
  });

  it('flags inverted range', () => {
    expect(parseRateParts('1400', '1200').invalid).toBe(true);
  });

  it('single rate is default — empty to means not a range', () => {
    expect(parseRateParts('1200', '').rateMax).toBeNull();
  });
});

describe('collectRateConflicts', () => {
  it('lists library designs with a different filled rate', () => {
    expect(
      collectRateConflicts('1200', [
        { id: 'a', name: 'Kurti', rate: '900', otherPacks: ['Wedding'] },
        { id: 'b', name: 'Same', rate: '1200' },
        { id: 'c', name: 'Empty', rate: '' },
      ]),
    ).toEqual([
      {
        id: 'a',
        name: 'Kurti',
        existing: '900',
        incoming: '1200',
        otherPacks: ['Wedding'],
      },
    ]);
  });
});
