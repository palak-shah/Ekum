import { describe, expect, it } from 'vitest';
import {
  howManyIsMultiShop,
  howManyShopGroups,
  howManySingleGoesTo,
  howManySplitBanner,
} from './howManySplitBanner';

describe('howManySplitBanner (BM — sr 42 mixed basket)', () => {
  it('names each shop for grouping helpers and never emits N-orders banner', () => {
    const products = [
      { companyId: 'a', companyName: 'Shreeji Textiles' },
      { companyId: 'b', companyName: 'Surat Silk House' },
      { companyId: 'b', companyName: 'Surat Silk House' },
    ];
    expect(howManyShopGroups(products)).toEqual([
      { name: 'Shreeji Textiles', count: 1 },
      { name: 'Surat Silk House', count: 2 },
    ]);
    expect(howManyIsMultiShop(products)).toBe(true);
    expect(howManySplitBanner(products)).toBeNull();
    expect(howManySingleGoesTo(products, 'Ravi Trading Co.')).toBeNull();
  });

  it('keeps Order goes to on a one-shop basket', () => {
    const products = [
      { companyId: 'a', companyName: 'Shreeji Textiles' },
      { companyId: 'a', companyName: 'Shreeji Textiles' },
    ];
    expect(howManySplitBanner(products)).toBeNull();
    expect(howManyIsMultiShop(products)).toBe(false);
    expect(howManySingleGoesTo(products, 'Ravi Trading Co.')).toBe('Ravi Trading Co.');
  });
});
