import { describe, expect, it } from 'vitest';
import {
  exploreFeedAboutText,
  exploreFeedCategoryLine,
  exploreFeedNewDesignsLine,
  exploreFeedRateLine,
  exploreFeedSourceLine,
} from './exploreFeedCaptionLines';

describe('exploreFeedRateLine', () => {
  it('formats a band with a space before the unit slash', () => {
    expect(exploreFeedRateLine({ rate: 430, rateMax: 1450, unit: 'pc' })).toBe(
      '₹430–₹1,450 /pc',
    );
  });

  it('omits when there is no rate', () => {
    expect(exploreFeedRateLine({ rate: null, unit: 'pc' })).toBeNull();
  });

  it('shows pack rates per dispatch pc', () => {
    expect(
      exploreFeedRateLine({ rate: 640, unit: 'set', dispatchUnit: 'pc' }),
    ).toBe('₹640 /pc');
  });
});

describe('exploreFeedCategoryLine', () => {
  it('joins tags', () => {
    expect(exploreFeedCategoryLine(['Saree', 'Kurti fabric'])).toBe('Saree · Kurti fabric');
  });

  it('is null when empty', () => {
    expect(exploreFeedCategoryLine([])).toBeNull();
    expect(exploreFeedCategoryLine(null)).toBeNull();
  });
});

describe('exploreFeedAboutText', () => {
  it('trims description', () => {
    expect(exploreFeedAboutText('  Soft handloom.  ')).toBe('Soft handloom.');
  });

  it('is null when blank', () => {
    expect(exploreFeedAboutText('   ')).toBeNull();
    expect(exploreFeedAboutText(null)).toBeNull();
  });
});

describe('exploreFeedNewDesignsLine', () => {
  it('uses You added for own packs', () => {
    expect(exploreFeedNewDesignsLine({ count: 6, isOwn: true })).toBe('You added 6 new designs');
    expect(exploreFeedNewDesignsLine({ count: 1, isOwn: true })).toBe('You added 1 new design');
  });

  it('uses N new designs for others', () => {
    expect(exploreFeedNewDesignsLine({ count: 6, isOwn: false })).toBe('6 new designs');
  });

  it('omits when zero', () => {
    expect(exploreFeedNewDesignsLine({ count: 0, isOwn: true })).toBeNull();
  });
});

describe('exploreFeedSourceLine', () => {
  it('formats From credit', () => {
    expect(exploreFeedSourceLine(['Ahmedabad Loom Co'])).toBe('From Ahmedabad Loom Co');
    expect(exploreFeedSourceLine(['A', 'B'])).toBe('From A, B');
    expect(exploreFeedSourceLine(['A', 'B', 'C'])).toBe('From 3 shops');
  });

  it('omits when empty', () => {
    expect(exploreFeedSourceLine([])).toBeNull();
    expect(exploreFeedSourceLine(null)).toBeNull();
  });
});
