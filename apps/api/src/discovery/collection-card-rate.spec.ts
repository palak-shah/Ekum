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

  it('prefers pack rate over stale member stamps', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 1500,
        rateMax: null,
        products: [
          { product: { rate: 1200, rateMax: null, unit: 'pc' } },
          { product: { rate: 1200, rateMax: null, unit: 'pc' } },
        ],
      }),
    ).toEqual({ rateMin: 1500, rateMax: null, rateUnit: 'pc' });
  });

  it('pack rate with mixed member units omits rateUnit', () => {
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
    ).toEqual({ rateMin: 1500, rateMax: null, rateUnit: null });
  });
});
