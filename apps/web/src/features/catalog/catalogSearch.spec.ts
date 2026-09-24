import { describe, expect, it } from 'vitest';
import { catalogSearchMatches, designFindParts } from './catalogSearch';

describe('catalogSearchMatches', () => {
  it('keeps every row when the field is empty or spaces', () => {
    expect(catalogSearchMatches('', 'Banarasi Silk')).toBe(true);
    expect(catalogSearchMatches('   ', 'Banarasi Silk')).toBe(true);
  });

  it('matches name, sku, tags, and pack names case-insensitively', () => {
    expect(catalogSearchMatches('banarasi', 'Banarasi Silk Saree', 'EK-1', ['saree'])).toBe(
      true,
    );
    expect(catalogSearchMatches('ek-1', 'Banarasi Silk Saree', 'EK-1')).toBe(true);
    expect(catalogSearchMatches('wedding', 'Silk', null, ['Wedding 2026'])).toBe(true);
    expect(catalogSearchMatches('zzzz', 'Banarasi Silk Saree')).toBe(false);
  });

  it('matches notes, shop, and rate from designFindParts', () => {
    const parts = designFindParts({
      name: 'Kurta 2',
      sku: 'K-2',
      description: '44 inch cotton',
      categories: ['Festive'],
      companyName: 'Ahmedabad Loom Co',
      unit: 'set',
      rate: 1200,
    });
    expect(catalogSearchMatches('cotton', ...parts)).toBe(true);
    expect(catalogSearchMatches('festive', ...parts)).toBe(true);
    expect(catalogSearchMatches('ahmedabad', ...parts)).toBe(true);
    expect(catalogSearchMatches('1200', ...parts)).toBe(true);
    expect(catalogSearchMatches('k-2', ...parts)).toBe(true);
  });
});
