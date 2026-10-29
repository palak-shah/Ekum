import { describe, expect, it } from 'vitest';
import {
  exploreFeedAboutText,
  exploreFeedCategoryLine,
  exploreFeedRateLine,
  exploreFeedSourceLine,
  visitorPackSourceLine,
} from './exploreFeedCaptionLines';

describe('exploreFeedRateLine', () => {
  it('formats a band with the unit slash tight', () => {
    expect(exploreFeedRateLine({ rate: 430, rateMax: 1450, unit: 'pc' })).toBe(
      '₹430–₹1,450/pc',
    );
  });

  it('omits when there is no rate', () => {
    expect(exploreFeedRateLine({ rate: null, unit: 'pc' })).toBeNull();
  });

  it('shows pack rates per dispatch pc', () => {
    expect(
      exploreFeedRateLine({ rate: 640, unit: 'set', dispatchUnit: 'pc' }),
    ).toBe('₹640/pc');
  });

  it('Explore pack card uses collection Rate per (mtr), not leftover /pc', () => {
    expect(exploreFeedRateLine({ rate: 91, unit: 'mtr' })).toBe('₹91/mtr');
    expect(exploreFeedRateLine({ rate: 91, unit: 'pc' })).toBe('₹91/pc');
    expect(
      exploreFeedRateLine({
        rate: 91,
        unit: 'set',
        dispatchUnit: 'set',
        catalogRateUnit: 'mtr',
      }),
    ).toBe('₹91/mtr');
  });
});

describe('exploreFeedCategoryLine', () => {
  it('joins every tag', () => {
    expect(exploreFeedCategoryLine(['Saree', 'Kurti fabric'])).toBe('Saree · Kurti fabric');
    expect(exploreFeedCategoryLine(['Bedsheet', 'Double', 'Set', 'King'])).toBe(
      'Bedsheet · Double · Set · King',
    );
  });

  it('is null when empty', () => {
    expect(exploreFeedCategoryLine([])).toBeNull();
    expect(exploreFeedCategoryLine(null)).toBeNull();
  });
});

describe('exploreFeedAboutText', () => {
  it('trims ends but keeps internal newlines', () => {
    expect(exploreFeedAboutText('  Soft handloom.  ')).toBe('Soft handloom.');
    expect(exploreFeedAboutText('Line one.\nLine two.\n')).toBe('Line one.\nLine two.');
  });

  it('is null when blank', () => {
    expect(exploreFeedAboutText('   ')).toBeNull();
    expect(exploreFeedAboutText(null)).toBeNull();
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

describe('visitorPackSourceLine', () => {
  it('uses stamped mill names', () => {
    expect(
      visitorPackSourceLine({
        showSourceShops: true,
        sourceShopNames: ['Ahmedabad Loom Co'],
        packCompanyId: 'trader',
        products: [],
      }),
    ).toBe('From Ahmedabad Loom Co');
  });

  it('falls back to foreign member shops when stamps are empty', () => {
    expect(
      visitorPackSourceLine({
        showSourceShops: true,
        sourceShopNames: [],
        packCompanyId: 'trader',
        products: [
          { companyId: 'mill', companyName: 'Ahmedabad Loom Co' },
          { companyId: 'trader', companyName: 'Jaipur Emporium' },
        ],
      }),
    ).toBe('From Ahmedabad Loom Co');
  });

  it('omits when Show supplier is off', () => {
    expect(
      visitorPackSourceLine({
        showSourceShops: false,
        sourceShopNames: ['Ahmedabad Loom Co'],
        packCompanyId: 'trader',
        products: [{ companyId: 'mill', companyName: 'Ahmedabad Loom Co' }],
      }),
    ).toBeNull();
  });

  it('credits catalog packs the same as collections when Show supplier is on', () => {
    expect(
      visitorPackSourceLine({
        showSourceShops: true,
        sourceShopNames: ['Ahmedabad Loom Co'],
        packCompanyId: 'trader',
        products: [{ companyId: 'mill', companyName: 'Ahmedabad Loom Co' }],
      }),
    ).toBe('From Ahmedabad Loom Co');
  });
});
