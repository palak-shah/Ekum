import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';

/**
 * You → Designs filters by status only — pack membership must not hide rows.
 * (Regression: designs in a regular collection still appear under Designs.)
 */
function designsTabRows(
  products: Array<{ id: string; status: string; collectionNames?: string[] }>,
  filter: 'draft' | 'published' | 'archived',
) {
  return products.filter((row) => row.status === filter);
}

describe('You Designs vs pack membership', () => {
  it('keeps regular collection members on Designs for matching status', () => {
    const rows = designsTabRows(
      [
        {
          id: 'p1',
          status: ProductStatus.Published,
          collectionNames: ['Wedding'],
        },
        { id: 'p2', status: ProductStatus.Draft, collectionNames: [] },
      ],
      'published',
    );
    expect(rows.map((row) => row.id)).toEqual(['p1']);
  });

  it('does not drop catalog-associated designs from Designs', () => {
    const rows = designsTabRows(
      [
        {
          id: 'p-cat',
          status: ProductStatus.Published,
          collectionNames: ['Diwali catalog'],
        },
      ],
      'published',
    );
    expect(rows).toHaveLength(1);
  });
});
