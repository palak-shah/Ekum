import { describe, expect, it } from 'vitest';
import { collectUsedTagSlots, filterTagSuggestions } from './tagSuggestionPool';

describe('filterTagSuggestions', () => {
  const official = ['Saree', 'Kurti', 'Lehenga', 'Dupatta', 'Gown'];
  const used = ['Saree', 'Kurti'];

  it('shows used tags first on empty focus, then official', () => {
    expect(filterTagSuggestions('', official, used)).toEqual([
      'Saree',
      'Kurti',
      'Lehenga',
      'Dupatta',
      'Gown',
    ]);
  });

  it('still offers official tags on empty focus when the shop has none used', () => {
    expect(filterTagSuggestions('', official, [])).toEqual(official);
  });

  it('searches used first then official when typing', () => {
    expect(filterTagSuggestions('e', official, used)).toEqual([
      'Saree',
      'Lehenga',
    ]);
  });
});

describe('collectUsedTagSlots', () => {
  it('buckets shop catalog tags into item / quality / size', () => {
    const slots = collectUsedTagSlots([
      { categories: ['Saree', 'Embroidered', 'M'] },
      { categories: ['Saree', 'Kurti'] },
    ]);
    expect(slots.items).toEqual(['Saree', 'Kurti']);
    expect(slots.qualities).toEqual(['Embroidered']);
    expect(slots.sizes).toEqual(['M']);
  });
});
