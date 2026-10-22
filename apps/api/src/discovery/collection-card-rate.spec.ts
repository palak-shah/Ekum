import { describe, expect, it } from 'vitest';
import { collectionCardRateFields } from './collection-card-rate';

describe('collectionCardRateFields', () => {
  it('omits band when pack rates are on request', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'on_request',
        products: [{ product: { rate: 100, rateMax: 200, unit: 'pc' } }],
      }),
    ).toEqual({ rateMin: null, rateMax: null, rateUnit: null });
  });

  it('returns min–max when pack rates are visible', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        products: [
          { product: { rate: 430, rateMax: null, unit: 'pc' } },
          { product: { rate: 1100, rateMax: 1450, unit: 'pc' } },
        ],
      }),
    ).toEqual({ rateMin: 430, rateMax: 1450, rateUnit: 'pc' });
  });

  it('omits band when units mix', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        products: [
          { product: { rate: 100, unit: 'pc' } },
          { product: { rate: 200, unit: 'mtr' } },
        ],
      }),
    ).toEqual({ rateMin: null, rateMax: null, rateUnit: null });
  });

  it('omits band when no priced members', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        products: [{ product: { rate: null, unit: 'pc' } }],
      }),
    ).toEqual({ rateMin: null, rateMax: null, rateUnit: null });
  });

  it('uses member band when designs kept their own rate', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 50,
        rateMax: null,
        products: [
          { product: { rate: 1680, rateMax: null, unit: 'pc' } },
          { product: { rate: 1680, rateMax: null, unit: 'pc' } },
        ],
      }),
    ).toEqual({ rateMin: 1680, rateMax: null, rateUnit: 'pc' });
  });

  it('omits band when pack rate disagrees and member units mix', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 1500,
        rateMax: null,
        products: [
          { product: { rate: 1200, unit: 'pc' } },
          { product: { rate: 800, unit: 'mtr' } },
        ],
      }),
    ).toEqual({ rateMin: null, rateMax: null, rateUnit: null });
  });

  it('keeps pack rate when no member is priced yet', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 50,
        rateMax: null,
        products: [{ product: { rate: null, unit: 'pc' } }],
      }),
    ).toEqual({ rateMin: 50, rateMax: null, rateUnit: 'pc' });
  });

  it('uses dispatch unit for pack order members (Rate per mtr not set/pc)', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        products: [
          { product: { rate: 94, unit: 'set', dispatchUnit: 'mtr' } },
          { product: { rate: 100, unit: 'set', dispatchUnit: 'mtr' } },
        ],
      }),
    ).toEqual({ rateMin: 94, rateMax: 100, rateUnit: 'mtr' });
  });

  it('pack rate 91 + Rate per mtr infers Explore ₹91/mtr', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 91,
        rateMax: null,
        products: [
          { product: { rate: 91, unit: 'set', dispatchUnit: 'mtr' } },
          { product: { rate: 91, unit: 'set', dispatchUnit: 'mtr' } },
        ],
      }),
    ).toEqual({ rateMin: 91, rateMax: null, rateUnit: 'mtr' });
  });
});
