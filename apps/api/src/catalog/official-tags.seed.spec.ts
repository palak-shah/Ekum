import { describe, expect, it } from 'vitest';
import { OFFICIAL_TAG_SEEDS } from './official-tags.seed';

describe('OFFICIAL_TAG_SEEDS', () => {
  it('covers the six main taxonomy categories', () => {
    const parents = new Set(OFFICIAL_TAG_SEEDS.map((row) => row.parentKey));
    expect(parents).toEqual(
      new Set([
        'HOME TEXTILES',
        'WOMENS WEAR',
        'MENS WEAR',
        'FABRICS',
        'ACCESSORIES',
        'KIDS WEAR',
      ]),
    );
  });

  it('dedupes labels within a parentKey', () => {
    const keys = OFFICIAL_TAG_SEEDS.map(
      (row) => `${row.parentKey}::${row.label.toLowerCase()}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes drill-down item, size, and quality labels', () => {
    const womens = OFFICIAL_TAG_SEEDS.filter((row) => row.parentKey === 'WOMENS WEAR').map(
      (row) => row.label,
    );
    expect(womens).toEqual(
      expect.arrayContaining(['Readymade', 'MM - Top/Bottom/Dupatta', 'S', 'Cotton']),
    );
  });
});
