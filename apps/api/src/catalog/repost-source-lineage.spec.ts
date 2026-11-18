import { describe, expect, it } from 'vitest';
import { uniqueSharedRepostHop } from '@ekum/domain-types';
import {
  collectionSourceShopNames,
  sourceHopsFromRows,
  type SourceCreditHopRow,
} from '../discovery/source-shop-credit';

/**
 * Pack→pack curate must retain repostSourceCollectionId; inherit uses uniqueSharedRepostHop.
 * stampManualRepostLineage only stamps root/origin — source id comes from create/inherit.
 */
describe('repost source lineage retention', () => {
  it('pack→pack create shape keeps a single shared source collection id', () => {
    expect(
      uniqueSharedRepostHop([
        { collectionId: 't1-pack', productId: 'p1' },
        { collectionId: 't1-pack', productId: 'p2' },
      ]),
    ).toEqual({ repostSourceCollectionId: 't1-pack' });
  });

  it('mixed source packs do not invent a single hop (no silent mill credit path)', () => {
    expect(
      uniqueSharedRepostHop([
        { collectionId: 't1-pack', productId: 'p1' },
        { collectionId: 'other-pack', productId: 'p2' },
      ]),
    ).toEqual({});
  });

  it('resolved hop from retained source id credits Trader not S1', () => {
    const byId = new Map<string, SourceCreditHopRow>([
      [
        't1-pack',
        {
          companyId: 't1',
          companyName: 'Trader 1',
          showSourceShops: false,
          repostSourceCollectionId: null,
        },
      ],
    ]);
    const hops = sourceHopsFromRows('t1-pack', byId);
    expect(hops).toHaveLength(1);
    const names = collectionSourceShopNames(
      'b1',
      true,
      [{ product: { companyId: 's1', company: { name: 'Supplier 1' } } }],
      hops,
      { declaredSourceCollectionId: 't1-pack' },
    );
    expect(names).toEqual(['Trader 1']);
    expect(names).not.toContain('Supplier 1');
  });
});
