import { describe, expect, it } from 'vitest';
import { MembershipOrigin } from '@ekum/domain-types';
import { ExploreService } from './explore.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { CatalogSerializer } from '../catalog/catalog.serializer';
import type { DiscoverySerializer } from './discovery.serializer';
import {
  filterViewerEligibleMembers,
  buyerShouldOmitRepostPack,
  upstreamChainSoftResult,
  type UpstreamPackRow,
} from '../catalog/repost-availability';
import { projectEligibleCollectionMembers } from '../catalog/load-upstream-packs';

/**
 * Mixed soft-unavailable: synced drop when chain soft; locals stay;
 * honest remaining chrome; sticky exclude / re-add synced ≠ local.
 */
describe('Explore mixed soft-unavailable (Remove-repost gate)', () => {
  function pack(
    id: string,
    over: Partial<UpstreamPackRow> = {},
  ): UpstreamPackRow {
    return {
      id,
      allowForward: true,
      status: 'published',
      repostSourceCollectionId: null,
      ...over,
    };
  }

  it('helpers: synced unavailable; local remain; omit only when zero eligible', () => {
    const mill = {
      id: 'mill-p',
      companyId: 'mill',
      allowForward: true,
      status: 'published',
    };
    const local = {
      id: 'own-p',
      companyId: 'trader',
      allowForward: true,
      status: 'published',
    };
    const eligible = filterViewerEligibleMembers(
      'trader',
      [
        {
          membershipOrigin: MembershipOrigin.Synced,
          product: mill,
        },
        {
          membershipOrigin: MembershipOrigin.Local,
          product: local,
        },
        {
          membershipOrigin: MembershipOrigin.Local,
          excluded: true,
          product: { ...local, id: 'excluded-own' },
        },
        {
          // Explicit re-add keeps synced origin — not local-style eligibility.
          membershipOrigin: MembershipOrigin.Synced,
          product: { ...mill, id: 'readded-synced' },
        },
      ],
      true,
    );
    expect(eligible.map((r) => r.product.id)).toEqual(['own-p']);

    const chain = upstreamChainSoftResult(
      { repostSourceCollectionId: 'src' },
      new Map([['src', pack('src', { allowForward: false })]]),
    );
    expect(
      buyerShouldOmitRepostPack({ chain, eligibleMemberCount: eligible.length }),
    ).toBe(false);
    expect(buyerShouldOmitRepostPack({ chain, eligibleMemberCount: 0 })).toBe(true);
  });

  it('honest chrome: projectEligibleCollectionMembers recounts from eligible ids', () => {
    const row = {
      companyId: 'trader',
      products: [
        { product: { id: 'synced', images: ['https://img/synced.jpg'] } },
        { product: { id: 'local', images: ['https://img/local.jpg'] } },
      ],
      _count: { products: 2 },
    };
    const projected = projectEligibleCollectionMembers(
      row,
      'buyer',
      new Set(['local']),
    );
    expect(projected.products.map((p) => p.product.id)).toEqual(['local']);
    expect(projected._count.products).toBe(1);
  });

  function makeAlbumService(album: {
    id: string;
    companyId: string;
    products: Array<{
      membershipOrigin?: string;
      excluded?: boolean;
      product: {
        id: string;
        companyId: string;
        status: string;
        allowForward?: boolean;
        rate?: number;
        images?: string[];
      };
    }>;
    repostSourceCollectionId: string | null;
  }) {
    const upstreamSoft = [
      {
        id: 'src-pack',
        companyId: 'mill',
        allowForward: false,
        status: 'published',
        showSourceShops: false,
        repostSourceCollectionId: null,
        company: { id: 'mill', name: 'Mill Co' },
      },
    ];
    const prisma = {
      collection: {
        findUnique: async () => ({
          ...album,
          name: 'Mixed Pack',
          description: null,
          status: 'published',
          audience: 'followers',
          rateVisibility: 'visible',
          audienceCompanyIds: [],
          startsAt: null,
          endsAt: null,
          allowForward: true,
          showSourceShops: false,
          coverImage: null,
          rate: null,
          rateMax: null,
          company: { id: album.companyId, name: 'Trader' },
          _count: { products: album.products.length },
        }),
        findMany: async (args?: { where?: { id?: { in?: string[] } } }) => {
          const ids = args?.where?.id?.in ?? [];
          if (ids.includes('src-pack')) return upstreamSoft;
          // Source-credit hop load may request the child or ancestors.
          return upstreamSoft.filter((row) => ids.includes(row.id));
        },
        updateMany: async () => ({ count: 0 }),
      },
      collectionProduct: {
        findMany: async () =>
          album.products.map((row) => ({
            collectionId: album.id,
            membershipOrigin: row.membershipOrigin ?? MembershipOrigin.Local,
            excluded: row.excluded === true,
            product: {
              id: row.product.id,
              companyId: row.product.companyId,
              allowForward: row.product.allowForward !== false,
              status: row.product.status,
              rate: row.product.rate ?? null,
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

    const catalog = {
      toProductView: (product: {
        id: string;
        companyId?: string;
        status?: string;
        rate?: number | null;
        images?: string[];
      }) => ({
        id: product.id,
        companyId: product.companyId ?? 'trader',
        status: product.status ?? 'published',
        rate: product.rate ?? null,
        images: product.images ?? [],
        rateVisibility: 'visible',
      }),
    } as unknown as CatalogSerializer;

    const discovery = {
      toCollectionCard: (row: {
        id: string;
        _count: { products: number };
        products?: Array<{ product: { id: string } }>;
      }) => ({
        id: row.id,
        productCount: row._count.products,
        products: row.products,
        sourceShopNames: [] as string[],
        rateMin: null,
        rateMax: null,
        rateUnit: null,
        coverImage: null,
        previewImages: [] as string[],
      }),
    } as unknown as DiscoverySerializer;

    return new ExploreService(
      prisma,
      {
        isBlocked: async () => false,
        canViewCatalog: async () => true,
      } as unknown as VisibilityService,
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

  it('album: chain soft with locals → eligible members only; not full soft shell', async () => {
    const service = makeAlbumService({
      id: 'mixed-1',
      companyId: 'trader',
      repostSourceCollectionId: 'src-pack',
      products: [
        {
          membershipOrigin: MembershipOrigin.Synced,
          product: {
            id: 'synced-1',
            companyId: 'mill',
            status: 'published',
            allowForward: true,
            rate: 100,
            images: ['https://img/synced.jpg'],
          },
        },
        {
          membershipOrigin: MembershipOrigin.Local,
          product: {
            id: 'local-1',
            companyId: 'trader',
            status: 'published',
            allowForward: true,
            rate: 90,
            images: ['https://img/local.jpg'],
          },
        },
      ],
    });

    const view = await service.collectionDetail('buyer', 'mixed-1');
    expect(view.softUnavailable).toBe(false);
    expect(view.products?.map((p) => p.id)).toEqual(['local-1']);
  });

  it('album: only synced left → soft shell omit chrome', async () => {
    const service = makeAlbumService({
      id: 'synced-only',
      companyId: 'trader',
      repostSourceCollectionId: 'src-pack',
      products: [
        {
          membershipOrigin: MembershipOrigin.Synced,
          product: {
            id: 'synced-1',
            companyId: 'mill',
            status: 'published',
            allowForward: true,
            rate: 100,
          },
        },
      ],
    });

    const view = await service.collectionDetail('buyer', 'synced-only');
    expect(view.softUnavailable).toBe(true);
    expect(view.products).toBeNull();
  });
});
