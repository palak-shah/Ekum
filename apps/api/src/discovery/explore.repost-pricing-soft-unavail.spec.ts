import { describe, expect, it } from 'vitest';
import { ExploreService } from './explore.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { CatalogSerializer } from '../catalog/catalog.serializer';
import { collectionSourceShopNames, type DiscoverySerializer } from './discovery.serializer';
import { RateVisibility, RepostPricingMode } from '@ekum/domain-types';

/**
 * Batch 3.2 — soft-unavailable packs with calc pricing must not leak designs or ₹.
 */
describe('Explore album soft-unavailable + pricing (Batch 3.2)', () => {
  function makeService(album: unknown, upstreamRows: unknown[]) {
    const prisma = {
      collection: {
        findUnique: async () => album,
        findMany: async () => upstreamRows,
        updateMany: async () => ({ count: 0 }),
      },
      collectionProduct: {
        findMany: async () =>
          (
            album as {
              products: Array<{
                product: { id: string; rate: number; companyId: string };
              }>;
            }
          ).products.map((row) => ({
            productId: row.product.id,
            pricingMode: null,
            marginValue: null,
            editedRate: null,
            editOwnBase: null,
            product: {
              id: row.product.id,
              rate: row.product.rate,
              companyId: row.product.companyId,
            },
          })),
      },
      follow: {
        findUnique: async () => ({ status: 'allowed' }),
        findMany: async () => [],
      },
      message: { findFirst: async () => null },
      collectionViewGrant: { findFirst: async () => null },
      company: {
        findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
          (where.id.in ?? []).map((id) => ({ id, name: id })),
      },
      tradeLane: { findMany: async () => [] },
      product: { findMany: async () => [] },
    } as unknown as PrismaService;

    const visibilityService = {
      isBlocked: async () => false,
      canViewCatalog: async () => true,
    } as unknown as VisibilityService;

    const catalog = {
      toProductView: (product: {
        id: string;
        companyId?: string;
        status?: string;
        rate?: number | null;
      }) => ({
        id: product.id,
        companyId: product.companyId ?? 'mill',
        status: product.status ?? 'published',
        rate: product.rate ?? null,
        rateVisibility: 'visible',
      }),
    } as unknown as CatalogSerializer;

    const discovery = {
      toCollectionCard: (
        row: {
          id: string;
          companyId: string;
          _count: { products: number };
          company?: { id: string };
          showSourceShops?: boolean;
          products?: Array<{
            product: { companyId?: string; company?: { name: string } | null };
          }>;
        },
        opts?: { resolvedBand?: { rateMin: number | null; rateMax: number | null } | null },
      ) => ({
        id: row.id,
        name: 'Trader B Pack',
        company: { id: row.company?.id ?? row.companyId },
        coverImage: null,
        previewImages: [],
        imageCount: 0,
        productCount: row._count.products,
        showSourceShops: row.showSourceShops === true,
        sourceShopNames: collectionSourceShopNames(
          row.companyId,
          row.showSourceShops === true,
          row.products,
        ),
        rateMin: opts?.resolvedBand?.rateMin ?? null,
        rateMax: opts?.resolvedBand?.rateMax ?? null,
        rateUnit: null,
        updatedAt: new Date().toISOString(),
      }),
    } as unknown as DiscoverySerializer;

    return new ExploreService(
      prisma,
      visibilityService,
      catalog,
      discovery,
      {
        checkCurateProducts: async (_c: string, ids: string[]) => ({
          allowedProductIds: ids,
          blocked: [],
        }),
      } as never,
    );
  }

  const softUnavailableAlbum = {
    id: 'pack-b',
    companyId: 'trader-b',
    name: 'B Pack',
    description: 'Should hide',
    status: 'published',
    audience: 'followers',
    rateVisibility: RateVisibility.Visible,
    audienceCompanyIds: [] as string[],
    startsAt: null as Date | null,
    endsAt: null as Date | null,
    allowForward: true,
    showSourceShops: true,
    coverImage: 'https://img/cover.jpg',
    rate: null,
    rateMax: null,
    repostSourceCollectionId: 'pack-a',
    repostPricingMode: RepostPricingMode.MarginFixed,
    repostMarginValue: 25,
    company: { id: 'trader-b', name: 'Trader B' },
    _count: { products: 1 },
    products: [
      {
        product: {
          id: 'sku-1',
          companyId: 'mill',
          status: 'published',
          rate: 100,
          rateVisibility: 'visible',
          allowForward: true,
          company: { name: 'Mill Co' },
        },
      },
    ],
  };

  it('P1 soft-unavailable: no products, no rate band, no supplier credit', async () => {
    const service = makeService(softUnavailableAlbum, [
      {
        id: 'pack-a',
        companyId: 'trader-a',
        allowForward: false,
        status: 'published',
        showSourceShops: true,
        repostSourceCollectionId: null,
        company: { name: 'Trader A' },
      },
    ]);

    const view = await service.collectionDetail('buyer', 'pack-b');
    expect(view.products).toBeNull();
    expect(view.softUnavailable).toBe(true);
    expect(view.upstreamUnavailable).toBe(false);
    expect(view.rateMin).toBeNull();
    expect(view.rateMax).toBeNull();
    expect(view.rateUnit).toBeNull();
    expect(view.sourceShopNames).toEqual([]);
    expect(view.coverImage).toBeNull();
    expect(view.description).toBeNull();
  });

  it('owner still sees products with upstreamUnavailable banner flag', async () => {
    const service = makeService(softUnavailableAlbum, [
      {
        id: 'pack-a',
        companyId: 'trader-a',
        allowForward: false,
        status: 'published',
        showSourceShops: true,
        repostSourceCollectionId: null,
        company: { name: 'Trader A' },
      },
    ]);
    const view = await service.collectionDetail('trader-b', 'pack-b');
    expect(view.products?.length).toBeGreaterThan(0);
    expect(view.softUnavailable).toBe(false);
    expect(view.upstreamUnavailable).toBe(true);
  });

  it('P2 locked design is omitted; remaining rates do not expose locked mill ₹', async () => {
    const album = {
      ...softUnavailableAlbum,
      repostSourceCollectionId: null,
      repostPricingMode: null,
      rateVisibility: RateVisibility.Visible,
      rate: null,
      products: [
        {
          product: {
            id: 'locked',
            companyId: 'mill',
            status: 'published',
            rate: 999,
            rateVisibility: 'visible',
            allowForward: false,
            company: { name: 'Mill Co' },
          },
        },
        {
          product: {
            id: 'open',
            companyId: 'trader-b',
            status: 'published',
            rate: 80,
            rateVisibility: 'visible',
            allowForward: true,
            company: { name: 'Trader B' },
          },
        },
      ],
      _count: { products: 2 },
    };

    const service = makeService(album, []);
    const view = await service.collectionDetail('buyer', 'pack-b');
    expect(view.products?.map((p) => p.id)).toEqual(['open']);
    expect(view.products?.find((p) => p.id === 'locked')).toBeUndefined();
    expect(view.products?.every((p) => p.rate !== 999)).toBe(true);
  });

  it('on_request with calc mode still omits pack band for non-owners', async () => {
    const album = {
      ...softUnavailableAlbum,
      audience: 'everyone',
      repostSourceCollectionId: null,
      repostPricingMode: RepostPricingMode.Edit,
      repostEditedRate: 150,
      repostEditOwnBase: null,
      rateVisibility: RateVisibility.OnRequest,
      products: [
        {
          product: {
            id: 'sku-1',
            companyId: 'trader-b',
            status: 'published',
            rate: 150,
            rateVisibility: 'on_request',
            allowForward: true,
            company: { name: 'Trader B' },
          },
        },
      ],
    };
    // Not connected — on_request hides member ₹; pack band also omitted.
    const prisma = {
      collection: {
        findUnique: async () => album,
        findMany: async () => [],
        updateMany: async () => ({ count: 0 }),
      },
      collectionProduct: {
        findMany: async () => [
          {
            productId: 'sku-1',
            pricingMode: null,
            marginValue: null,
            editedRate: 150,
            editOwnBase: null,
            product: { id: 'sku-1', rate: 150, companyId: 'trader-b' },
          },
        ],
      },
      follow: { findUnique: async () => ({ status: 'allowed' }), findMany: async () => [] },
      message: { findFirst: async () => null },
      collectionViewGrant: { findFirst: async () => null },
      company: {
        findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
          (where.id.in ?? []).map((id) => ({ id, name: id })),
      },
      tradeLane: { findMany: async () => [] },
      product: { findMany: async () => [] },
    } as unknown as PrismaService;
    const service = new ExploreService(
      prisma,
      {
        isBlocked: async () => false,
        canViewCatalog: async () => false,
      } as unknown as VisibilityService,
      {
        toProductView: (product: { id: string; companyId?: string; rate?: number | null }) => ({
          id: product.id,
          companyId: product.companyId ?? 'trader-b',
          status: 'published',
          rate: product.rate ?? null,
          rateVisibility: 'on_request',
        }),
      } as unknown as CatalogSerializer,
      {
        toCollectionCard: () => ({
          id: 'pack-b',
          name: 'B',
          company: { id: 'trader-b' },
          coverImage: null,
          previewImages: [],
          imageCount: 0,
          productCount: 1,
          showSourceShops: false,
          sourceShopNames: [],
          rateMin: null,
          rateMax: null,
          rateUnit: null,
          updatedAt: new Date().toISOString(),
        }),
      } as unknown as DiscoverySerializer,
      {
        checkCurateProducts: async (_c: string, ids: string[]) => ({
          allowedProductIds: ids,
          blocked: [],
        }),
      } as never,
    );
    const view = await service.collectionDetail('buyer', 'pack-b');
    expect(view.rateMin).toBeNull();
    expect(view.rateMax).toBeNull();
    expect(view.products?.[0]?.rate).toBeNull();
  });
});
