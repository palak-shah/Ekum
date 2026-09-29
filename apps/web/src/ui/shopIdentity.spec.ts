import { describe, expect, it } from 'vitest';
import { shopIdentityLine, shopSellCategories } from './shopIdentity';

describe('shopIdentityLine', () => {
  it('is city · two human categories', () => {
    expect(shopIdentityLine('Surat', ['Fabric', 'Dress material'])).toBe(
      'Surat · Fabric, Dress material',
    );
  });

  it('prints Women’s apparel not womens_apparel', () => {
    expect(shopIdentityLine('Surat', ['womens_apparel'])).toBe("Surat · Women's apparel");
  });

  it('is city only when they have no categories', () => {
    expect(shopIdentityLine('Surat', [])).toBe('Surat');
  });
});

describe('shopSellCategories', () => {
  it('prefers sellCategories over profile categories', () => {
    expect(
      shopSellCategories({ sellCategories: ['Sarees'], categories: ['womens_apparel'] }),
    ).toEqual(['Sarees']);
  });
});
