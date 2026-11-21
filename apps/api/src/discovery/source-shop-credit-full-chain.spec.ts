import { describe, expect, it } from 'vitest';
import {
  collectionSourceShopNames,
  revealedCreditCompanyId,
  sourceHopChainIncomplete,
  sourceHopsFromRows,
  type SourceCreditHopRow,
} from './source-shop-credit';

describe('full-chain supplier identity (H4)', () => {
  it.each([1, 4, 5, 8, 12])(
    'walks %s hops without a depth cap in sourceHopsFromRows',
    (depth) => {
      const byId = new Map<string, SourceCreditHopRow>();
      let prev: string | null = null;
      for (let i = 1; i <= depth; i += 1) {
        const id = `h${i}`;
        byId.set(id, {
          companyId: `c${i}`,
          companyName: `Shop ${i}`,
          showSourceShops: true,
          repostSourceCollectionId: prev,
        });
        prev = id;
      }
      const hops = sourceHopsFromRows(`h${depth}`, byId);
      expect(hops).toHaveLength(depth);
      expect(revealedCreditCompanyId('mill', hops)).toBe('mill');
    },
  );

  it('hide at first intermediary blocks original supplier', () => {
    const byId = new Map<string, SourceCreditHopRow>([
      [
        'root',
        {
          companyId: 's1',
          companyName: 'S1',
          showSourceShops: false,
          repostSourceCollectionId: null,
        },
      ],
      [
        'leaf',
        {
          companyId: 't1',
          companyName: 'T1',
          showSourceShops: true,
          repostSourceCollectionId: 'root',
        },
      ],
    ]);
    expect(revealedCreditCompanyId('s1', sourceHopsFromRows('leaf', byId))).toBe('s1');
    expect(
      collectionSourceShopNames(
        'buyer',
        true,
        [{ product: { companyId: 's1', company: { name: 'S1' } } }],
        sourceHopsFromRows('leaf', byId),
        { declaredSourceCollectionId: 'leaf', hopRows: byId },
      ),
    ).toEqual(['S1']);
  });

  it('middle intermediary hide blocks revealing original supplier', () => {
    const byId = new Map<string, SourceCreditHopRow>([
      [
        'root',
        {
          companyId: 's1',
          companyName: 'S1',
          showSourceShops: true,
          repostSourceCollectionId: null,
        },
      ],
      [
        'mid',
        {
          companyId: 't1',
          companyName: 'T1',
          showSourceShops: false,
          repostSourceCollectionId: 'root',
        },
      ],
      [
        'leaf',
        {
          companyId: 'b1',
          companyName: 'B1',
          showSourceShops: true,
          repostSourceCollectionId: 'mid',
        },
      ],
    ]);
    const hops = sourceHopsFromRows('leaf', byId);
    expect(revealedCreditCompanyId('s1', hops)).toBe('t1');
    const names = collectionSourceShopNames(
      'buyer',
      true,
      [{ product: { companyId: 's1', company: { name: 'S1' } } }],
      hops,
      { declaredSourceCollectionId: 'leaf', hopRows: byId },
    );
    expect(names).toEqual(['T1']);
    expect(names).not.toContain('S1');
  });

  it('incomplete lineage fails closed (no mill names)', () => {
    const byId = new Map<string, SourceCreditHopRow>([
      [
        'leaf',
        {
          companyId: 't1',
          companyName: 'T1',
          showSourceShops: true,
          repostSourceCollectionId: 'missing',
        },
      ],
    ]);
    const hops = sourceHopsFromRows('leaf', byId);
    expect(sourceHopChainIncomplete('leaf', hops, byId)).toBe(true);
    expect(
      collectionSourceShopNames(
        'buyer',
        true,
        [{ product: { companyId: 's1', company: { name: 'S1' } } }],
        hops,
        { declaredSourceCollectionId: 'leaf', hopRows: byId },
      ),
    ).toEqual([]);
  });

  it('cyclic lineage fails closed', () => {
    const byId = new Map<string, SourceCreditHopRow>([
      [
        'a',
        {
          companyId: 'c1',
          companyName: 'C1',
          showSourceShops: true,
          repostSourceCollectionId: 'b',
        },
      ],
      [
        'b',
        {
          companyId: 'c2',
          companyName: 'C2',
          showSourceShops: true,
          repostSourceCollectionId: 'a',
        },
      ],
    ]);
    const hops = sourceHopsFromRows('a', byId);
    expect(sourceHopChainIncomplete('a', hops, byId)).toBe(true);
  });

  it('showSourceShops true on leaf does not override upstream hide', () => {
    const byId = new Map<string, SourceCreditHopRow>([
      [
        'root',
        {
          companyId: 's1',
          companyName: 'S1',
          showSourceShops: false,
          repostSourceCollectionId: null,
        },
      ],
      [
        'auto',
        {
          companyId: 't1',
          companyName: 'T1',
          showSourceShops: true, // auto-repost forces true — still ceiling-bound
          repostSourceCollectionId: 'root',
        },
      ],
    ]);
    const hops = sourceHopsFromRows('auto', byId);
    expect(revealedCreditCompanyId('s1', hops)).toBe('s1'); // root hop company when hide
    // First hop is root with showSourceShops false → credit that hop's company (s1 as intermediary id)
    // Actually revealedCreditCompanyId returns first hop with !showSourceShops → root.companyId = s1
    // Wait - if root IS s1 the mill, and showSourceShops false on root pack owned by s1:
    // hops = [{ companyId: s1, showSourceShops: false }] then revealed = s1
    // For Direct Link auto, root is mill pack - hide means credit mill company id which equals mill - names still need show on leaf
    // Better case: trader hide
    const traderHide = new Map<string, SourceCreditHopRow>([
      [
        'mill',
        {
          companyId: 's1',
          companyName: 'S1',
          showSourceShops: true,
          repostSourceCollectionId: null,
        },
      ],
      [
        'trader',
        {
          companyId: 't1',
          companyName: 'T1',
          showSourceShops: false,
          repostSourceCollectionId: 'mill',
        },
      ],
      [
        'auto-child',
        {
          companyId: 't2',
          companyName: 'T2',
          showSourceShops: true,
          repostSourceCollectionId: 'trader',
        },
      ],
    ]);
    const autoHops = sourceHopsFromRows('auto-child', traderHide);
    expect(revealedCreditCompanyId('s1', autoHops)).toBe('t1');
  });
});
