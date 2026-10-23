import { describe, expect, it } from 'vitest';
import {
  collectionCardRateFields,
  collectionCardRateVisibility,
} from './collection-card-rate';

describe('collectionCardRateVisibility', () => {
  it('lets the owner see the band even when Show rates is on request', () => {
    expect(
      collectionCardRateVisibility({
        rateVisibility: 'on_request',
        packCompanyId: 'me',
        viewerCompanyId: 'me',
      }),
    ).toBe('visible');
  });

  it('keeps on request for other shops', () => {
    expect(
      collectionCardRateVisibility({
        rateVisibility: 'on_request',
        packCompanyId: 'me',
        viewerCompanyId: 'buyer',
      }),
    ).toBe('on_request');
  });
});

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

  it('uses collection details rate when designs kept their own rupee', () => {
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
    ).toEqual({ rateMin: 50, rateMax: null, rateUnit: 'pc' });
  });

  it('keeps collection Rate per when pack rate and design rates differ', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 91,
        rateMax: null,
        catalogRateUnit: 'mtr',
        products: [
          { product: { rate: 1680, unit: 'pc', catalogRateUnit: 'pc' } },
          { product: { rate: 1680, unit: 'pc', catalogRateUnit: 'pc' } },
        ],
      }),
    ).toEqual({ rateMin: 91, rateMax: null, rateUnit: 'mtr' });
  });

  it('still shows pack rate when member units mix', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 1500,
        rateMax: null,
        catalogRateUnit: 'pc',
        products: [
          { product: { rate: 1200, unit: 'pc' } },
          { product: { rate: 800, unit: 'mtr' } },
        ],
      }),
    ).toEqual({ rateMin: 1500, rateMax: null, rateUnit: 'pc' });
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

  it('Rate per mtr with dispatch set stays /mtr on Explore', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 91,
        rateMax: null,
        catalogRateUnit: 'mtr',
        products: [
          {
            product: {
              rate: 91,
              unit: 'set',
              dispatchUnit: 'set',
              catalogRateUnit: 'mtr',
            },
          },
        ],
      }),
    ).toEqual({ rateMin: 91, rateMax: null, rateUnit: 'mtr' });
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

  it('falls back to design min–max when collection details has no rupee', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: null,
        products: [
          {
            product: {
              rate: 90,
              unit: 'set',
              dispatchUnit: 'set',
              catalogRateUnit: 'mtr',
            },
          },
          {
            product: {
              rate: 110,
              unit: 'set',
              dispatchUnit: 'set',
              catalogRateUnit: 'mtr',
            },
          },
        ],
      }),
    ).toEqual({ rateMin: 90, rateMax: 110, rateUnit: 'mtr' });
  });

  it('keeps collection Rate per mtr when an unpriced member still has leftover /pc', () => {
    expect(
      collectionCardRateFields({
        rateVisibility: 'visible',
        rate: 91,
        rateMax: null,
        products: [
          { product: { rate: 91, unit: 'set', dispatchUnit: 'mtr' } },
          { product: { rate: null, unit: 'set', dispatchUnit: 'set' } },
        ],
      }),
    ).toEqual({ rateMin: 91, rateMax: null, rateUnit: 'mtr' });
  });
});
