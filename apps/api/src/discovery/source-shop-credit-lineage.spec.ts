/**
 * Lineage integration for visitor credit — Trader hide → Buyer show → never S1.
 * Uses real helpers + DiscoverySerializer (not ExploreService mocks that omit hops).
 */
import { describe, expect, it } from 'vitest';
import { DiscoverySerializer } from './discovery.serializer';
import {
  collectionSourceShopNames,
  sourceHopsFromRows,
  visitorDesignCreditCompanyName,
  type SourceCreditHopRow,
} from './source-shop-credit';
import type { CompanySerializer } from '../access/company.serializer';
import type { Company } from '@prisma/client';

const S1 = 'Supplier 1';
const T1 = 'Trader 1';
const B1 = 'Buyer 1';

const millProduct = {
  product: {
    images: ['https://img/s1'],
    companyId: 's1',
    company: { name: S1 },
    rate: 90,
    unit: 'mtr',
    dispatchUnit: 'mtr',
    catalogRateUnit: 'mtr',
    status: 'published',
  },
};

describe('lineage credit — Trader hide, Buyer show', () => {
  const hopRows = new Map<string, SourceCreditHopRow>([
    [
      't1-pack',
      {
        companyId: 't1',
        companyName: T1,
        showSourceShops: false,
        repostSourceCollectionId: null,
      },
    ],
  ]);
  const hops = sourceHopsFromRows('t1-pack', hopRows);

  it('sourceShopNames credits Trader and never S1', () => {
    const names = collectionSourceShopNames('b1', true, [millProduct], hops, {
      declaredSourceCollectionId: 't1-pack',
    });
    expect(names).toContain(T1);
    expect(names).not.toContain(S1);
    expect(names).toEqual([T1]);
  });

  it('design companyName is Trader not S1; companyId stays mill for routing', () => {
    const name = visitorDesignCreditCompanyName({
      isOwner: false,
      showSourceShops: true,
      packCompanyId: 'b1',
      packCompanyName: B1,
      productCompanyId: 's1',
      productCompanyName: S1,
      sourceHops: hops,
      declaredSourceCollectionId: 't1-pack',
    });
    expect(name).toBe(T1);
    expect(name).not.toBe(S1);
    // Identity on the wire remains mill — display name is what we mask.
    expect(millProduct.product.companyId).toBe('s1');
  });

  it('toCollectionCard applies the same ceiling', () => {
    const serializer = new DiscoverySerializer({
      toPublicSummary: (row: Company) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        verification: row.verification,
        logoUrl: row.logoUrl,
        sellCategories: row.sellCategories,
      }),
    } as unknown as CompanySerializer);

    const card = serializer.toCollectionCard(
      {
        id: 'b1-pack',
        companyId: 'b1',
        name: 'Buyer curate',
        kind: 'regular',
        showSourceShops: true,
        repostSourceCollectionId: 't1-pack',
        allowForward: true,
        rateVisibility: 'visible',
        rate: null,
        rateMax: null,
        updatedAt: new Date(),
        exploreActivityAt: null,
        exploreNewDesignCount: 0,
        company: {
          id: 'b1',
          name: B1,
          city: null,
          verification: 'unverified',
          logoUrl: null,
          sellCategories: [],
        } as unknown as Company,
        _count: { products: 1 },
        products: [millProduct],
      } as never,
      { viewerCompanyId: 'visitor', sourceHops: hops },
    );

    expect(card.sourceShopNames).toEqual([T1]);
    expect(card.sourceShopNames).not.toContain(S1);
  });

  it('mixed own + mill: own omitted; mill follows hop ceiling', () => {
    const mixed = [
      {
        product: {
          companyId: 'b1',
          company: { name: B1 },
        },
      },
      millProduct,
    ];
    const names = collectionSourceShopNames('b1', true, mixed, hops, {
      declaredSourceCollectionId: 't1-pack',
    });
    expect(names).toEqual([T1]);
    expect(names).not.toContain(S1);
    expect(names).not.toContain(B1);
  });

  it('owner-facing member shops still include S1 (library cue)', () => {
    // Mirrors catalog.serializer memberShops: raw product companies.
    const shops = new Map<string, string>();
    for (const row of [millProduct]) {
      shops.set(row.product.companyId, row.product.company.name);
    }
    expect([...shops.values()]).toContain(S1);
  });
});
