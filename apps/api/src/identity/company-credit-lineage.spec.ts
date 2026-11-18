import { describe, expect, it } from 'vitest';
import { CompanyService } from './company.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { TokenService } from '../auth/token.service';
import type { CompanySerializer } from '../access/company.serializer';
import type { VisibilityService } from '../access/visibility.service';

const S1 = 'Supplier 1';
const T1 = 'Trader 1';

/**
 * Shelf list with real hop load path — Buyer pack show on, Trader source show off.
 */
describe('CompanyService.listPublishedCollections credit ceiling', () => {
  it('visitor sourceShopNames is Trader never S1 when upstream hid suppliers', async () => {
    const buyerPack = {
      id: 'b1-pack',
      name: 'Buyer MaryGold',
      kind: 'regular',
      orderMode: null,
      description: null,
      categories: [],
      coverImage: null,
      status: 'published',
      updatedAt: new Date('2026-11-18T00:00:00.000Z'),
      allowForward: true,
      orderPathPreference: null,
      rate: null,
      rateMax: null,
      catalogRateUnit: null,
      rateVisibility: 'visible',
      exploreNewDesignCount: 0,
      showSourceShops: true,
      repostSourceCollectionId: 't1-pack',
      companyId: 'b1',
      company: { id: 'b1', name: 'Buyer 1' },
      _count: { products: 1 },
      products: [
        {
          product: {
            images: ['https://img/s1'],
            companyId: 's1',
            company: { name: S1 },
            status: 'published',
            name: 'Design',
            sku: null,
            description: null,
            categories: [],
            rate: null,
            rateMax: null,
            unit: 'pc',
            dispatchUnit: 'pc',
            catalogRateUnit: 'pc',
          },
        },
      ],
    };

    const traderHop = {
      id: 't1-pack',
      companyId: 't1',
      showSourceShops: false,
      repostSourceCollectionId: null,
      company: { name: T1 },
    };

    const prisma = {
      company: {
        findUnique: async () => ({ id: 'b1', profileVisibility: 'public' }),
      },
      follow: { findUnique: async () => null },
      collection: {
        findMany: async (args: {
          where?: {
            id?: { in?: string[] };
            companyId?: string;
            repostSourceCollectionId?: { in?: string[] };
          };
        }) => {
          // viewerRepostedCollectionIds
          if (args.where?.repostSourceCollectionId?.in) {
            return [];
          }
          const ids = args.where?.id?.in;
          if (ids) {
            return ids.includes('t1-pack') ? [traderHop] : [];
          }
          // Shelf list for buyer shop
          return [buyerPack];
        },
      },
    } as unknown as PrismaService;

    const visibility = {
      isBlocked: async () => false,
    } as unknown as VisibilityService;
    const serializer = {
      toPublicSummary: (company: { id: string; name: string }) => ({
        id: company.id,
        name: company.name,
        city: null,
        verification: 'unverified',
        logoUrl: null,
        sellCategories: [],
      }),
    } as unknown as CompanySerializer;

    const service = new CompanyService(
      prisma,
      {} as TokenService,
      serializer,
      visibility,
    );

    // assertShelfProfileAccess may call more — stub via public company
    const page = await service.listPublishedCollections('visitor', 'b1', {
      limit: 20,
    });

    expect(page.results.length).toBeGreaterThanOrEqual(1);
    const card = page.results.find((row) => row.id === 'b1-pack') ?? page.results[0];
    expect(card?.showSourceShops).toBe(true);
    expect(card?.sourceShopNames).toContain(T1);
    expect(card?.sourceShopNames).not.toContain(S1);
    expect(card?.sourceShopNames).toEqual([T1]);
  });
});
