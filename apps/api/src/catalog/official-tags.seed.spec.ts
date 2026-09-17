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
});
