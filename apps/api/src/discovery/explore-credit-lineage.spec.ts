/**
 * Album collectionDetail credit path — same Trader-hide / Buyer-show matrix.
 * Uses real DiscoverySerializer + visitorDesignCreditCompanyName (not hop-blind mocks).
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

describe('Explore album credit ceiling (lineage)', () => {
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

  it('collectionDetail-shaped payload: sourceShopNames and design companyName never S1', () => {
    const serializer = new DiscoverySerializer({
      toPublicSummary: (row: Company) => ({
        id: row.id,
        name: row.name,
        city: null,
        verification: 'unverified',
        logoUrl: null,
        sellCategories: [],
      }),
    } as unknown as CompanySerializer);

    const collection = {
      id: 'b1-pack',
      companyId: 'b1',
      name: 'Buyer pack',
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
      company: { id: 'b1', name: B1 } as Company,
      _count: { products: 1 },
      products: [
        {
          product: {
            images: [],
            companyId: 's1',
            company: { name: S1 },
            status: 'published',
          },
        },
      ],
    };

    const card = serializer.toCollectionCard(collection as never, {
      viewerCompanyId: 'visitor',
      sourceHops: hops,
    });
    const sourceShopNames =
      card.sourceShopNames.length > 0
        ? card.sourceShopNames
        : collectionSourceShopNames(
            'b1',
            true,
            collection.products,
            hops,
            { declaredSourceCollectionId: 't1-pack' },
          );

    expect(sourceShopNames).toEqual([T1]);
    expect(sourceShopNames).not.toContain(S1);

    const designName = visitorDesignCreditCompanyName({
      isOwner: false,
      showSourceShops: true,
      packCompanyId: 'b1',
      packCompanyName: B1,
      productCompanyId: 's1',
      productCompanyName: S1,
      sourceHops: hops,
      declaredSourceCollectionId: 't1-pack',
    });
    expect(designName).toBe(T1);
    expect(designName).not.toBe(S1);
  });
});
