import { describe, expect, it } from 'vitest';
import {
  howManyShopGroups,
  howManySingleGoesTo,
  howManySplitBanner,
} from './howManySplitBanner';

describe('howManySplitBanner (BM — sr 42 mixed basket)', () => {
  it('names each shop and drops a single Order goes to', () => {
    const products = [
      { companyId: 'a', companyName: 'Shreeji Textiles' },
      { companyId: 'b', companyName: 'Surat Silk House' },
      { companyId: 'b', companyName: 'Surat Silk House' },
    ];
    expect(howManyShopGroups(products)).toEqual([
      { name: 'Shreeji Textiles', count: 1 },
      { name: 'Surat Silk House', count: 2 },
    ]);
    expect(howManySplitBanner(products)).toBe(
      'This becomes 2 orders — Shreeji Textiles (1 design), Surat Silk House (2 designs)',
    );
    expect(howManySingleGoesTo(products, 'Ravi Trading Co.')).toBeNull();
  });

  it('keeps Order goes to on a one-shop basket', () => {
    const products = [
      { companyId: 'a', companyName: 'Shreeji Textiles' },
      { companyId: 'a', companyName: 'Shreeji Textiles' },
    ];
    expect(howManySplitBanner(products)).toBeNull();
    expect(howManySingleGoesTo(products, 'Ravi Trading Co.')).toBe('Ravi Trading Co.');
  });
});
