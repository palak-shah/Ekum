import { describe, expect, it } from 'vitest';
import type { SavedItemView } from '@ekum/domain-types';
import { savedItemMeta } from './savedItemMeta';

function item(partial: Partial<SavedItemView> & Pick<SavedItemView, 'kind'>): SavedItemView {
  return {
    id: 's1',
    kind: partial.kind,
    refId: 'r1',
    name: 'Design',
    thumbUrl: null,
    images: [],
    company: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', logoUrl: null },
    savedAt: '2026-01-01T00:00:00.000Z',
    savedBy: { id: 'u1', name: 'Ravi bhai Shah' },
    sku: null,
    rate: null,
    unit: null,
    productCount: null,
    ...partial,
  } as SavedItemView;
}

describe('savedItemMeta', () => {
  it('omits the saver name on design and collection lines (BM)', () => {
    expect(
      savedItemMeta(
        item({
          kind: 'product',
          sku: 'EK-3C05B769',
          rate: 280,
          unit: 'mtr',
        }),
      ),
    ).toBe('Jaipur Emporium · EK-3C05B769 · ₹280/mtr');

    expect(
      savedItemMeta(
        item({
          kind: 'collection',
          name: 'Festive',
          productCount: 5,
          company: { id: 'c2', name: 'Shreeji Textiles', city: 'Ahmedabad', logoUrl: null },
        }),
      ),
    ).toBe('Shreeji Textiles · 5 designs');
  });
});
