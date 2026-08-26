import { describe, expect, it } from 'vitest';
import { filterByAttachSearch, matchesAttachSearch } from './attachShareSearch';

describe('matchesAttachSearch', () => {
  it('matches empty query as all', () => {
    expect(matchesAttachSearch('Saree', '')).toBe(true);
    expect(matchesAttachSearch('Saree', '   ')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchesAttachSearch('Chiffon Saree', 'saree')).toBe(true);
    expect(matchesAttachSearch('Kurta 3', 'xyz')).toBe(false);
  });
});

describe('filterByAttachSearch', () => {
  it('filters by haystack', () => {
    const items = [{ name: 'Saree' }, { name: 'Kurta 2' }, { name: 'Chiffon Saree' }];
    expect(filterByAttachSearch(items, 'saree', (row) => row.name).map((r) => r.name)).toEqual([
      'Saree',
      'Chiffon Saree',
    ]);
  });
});
