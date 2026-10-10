import { describe, expect, it } from 'vitest';
import { curateSheetDesigns } from './curateSheetDesigns';
import type { BrowseShortlistEntry } from './browseShortlist';

function row(id: string, name = id): BrowseShortlistEntry {
  return {
    productId: id,
    name,
    thumbUrl: null,
    companyId: 'co',
    companyName: 'Shop',
  };
}

describe('curateSheetDesigns', () => {
  it('uses cart when staging is empty (Cart → Repost)', () => {
    const cart = [row('a', 'Organza'), row('b', 'Chiffon')];
    const { ids, entries } = curateSheetDesigns({
      productIds: ['a', 'b'],
      staging: [],
      cart,
    });
    expect(ids).toEqual(['a', 'b']);
    expect(entries.map((e) => e.name)).toEqual(['Organza', 'Chiffon']);
  });

  it('does not report 0 designs when ids are only in cart', () => {
    const { entries } = curateSheetDesigns({
      productIds: ['x'],
      staging: [],
      cart: [row('x')],
    });
    expect(entries).toHaveLength(1);
  });

  it('prefers staging meta when the same id is in cart', () => {
    const { entries } = curateSheetDesigns({
      productIds: ['a'],
      staging: [row('a', 'From staging')],
      cart: [row('a', 'From cart')],
    });
    expect(entries[0]?.name).toBe('From staging');
  });

  it('falls back to pooled designs when productIds omitted', () => {
    const { ids, entries } = curateSheetDesigns({
      staging: [row('s')],
      cart: [row('c')],
    });
    expect(ids.sort()).toEqual(['c', 's']);
    expect(entries).toHaveLength(2);
  });
});
