import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ExploreService } from './explore.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import type { CatalogSerializer } from '../catalog/catalog.serializer';
import type { DiscoverySerializer } from './discovery.serializer';

interface VisibilityStub {
  blocked?: boolean;
  connected?: boolean;
  /** Per-target overrides for canViewCatalog (e.g. foreign source companies). */
  connectedByCompany?: Record<string, boolean>;
}

function makeService(
  collectionRow: unknown,
  visibility: VisibilityStub,
  opts?: { sharedInChat?: boolean; following?: boolean },
) {
  const prisma = {
    collection: { findUnique: async () => collectionRow },
    follow: {
      findUnique: async () => (opts?.following ? { id: 'f1' } : null),
    },
    message: {
      findFirst: async () => (opts?.sharedInChat ? { id: 'm1' } : null),
    },
    company: {
      findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
        (where.id.in ?? []).map((id) => ({ id, name: id })),
    },
  } as unknown as PrismaService;
  const visibilityService = {
    isBlocked: async () => visibility.blocked ?? false,
    canViewCatalog: async (_viewer: string, target: string) => {
      if (visibility.connectedByCompany && target in visibility.connectedByCompany) {
        return visibility.connectedByCompany[target]!;
      }
      return visibility.connected ?? false;
    },
  } as unknown as VisibilityService;
  const catalog = {
    toProductView: (product: {
      id: string;
      companyId?: string;
      rate?: number | null;
      rateVisibility?: string;
    }) => ({
      id: product.id,
      companyId: product.companyId ?? 'owner',
      rate: product.rate ?? null,
      rateVisibility: product.rateVisibility ?? 'on_request',
    }),
  } as unknown as CatalogSerializer;
  const discovery = {
    toCollectionCard: (row: {
      id: string;
      companyId: string;
      _count: { products: number };
      company?: { id: string };
      coverImage?: string | null;
    }) => ({
      id: row.id,
      name: 'Wedding Edit',
      company: { id: row.company?.id ?? row.companyId },
      coverImage: row.coverImage ?? null,
      previewImages: row.coverImage ? [row.coverImage] : [],
      imageCount: row.coverImage ? 1 : 0,
      productCount: row._count.products,
      updatedAt: new Date().toISOString(),
    }),
  } as unknown as DiscoverySerializer;
  return new ExploreService(prisma, visibilityService, catalog, discovery);
}

const publishedCollection = {
  id: 'col1',
  companyId: 'owner',
  status: 'published',
  audience: 'connections',
  rateVisibility: 'on_request',
  audienceCompanyIds: [] as string[],
  startsAt: null as Date | null,
  endsAt: null as Date | null,
  company: { id: 'owner' },
  _count: { products: 2 },
  products: [
    { product: { id: 'p1', companyId: 'owner', rate: 100, rateVisibility: 'on_request' } },
    { product: { id: 'p2', companyId: 'owner', rate: 200, rateVisibility: 'on_request' } },
  ],
};

describe('ExploreService.collections follow-then-interest ranking', () => {
  function feedRow(
    id: string,
    companyId: string,
    sellCategories: string[],
    superCategories: string[] = [],
    city = 'Surat',
  ) {
    return {
      feedId: `c:${id}`,
      postedAt: new Date(),
      kind: 'collection' as const,
      company: { id: companyId, city, sellCategories, superCategories },
      collection: { id },
    };
  }

  const sareesInterest = {
    tags: ['Sarees'],
    supers: ['womens_apparel'],
    preferFine: true,
  };

  it('keeps all followed before public, then interest public before unrelated public', () => {
    const service = makeService(publishedCollection, {});
    const followed = [
      feedRow('f-fabric', 'followed-fabric', ['Fabric']),
      feedRow('f-saree', 'followed-saree', ['Sarees']),
    ];
    const other = [
      feedRow('p-saree', 'public-saree', ['Sarees']),
      feedRow('p-fabric', 'public-fabric', ['Fabric']),
    ];
    const merged = service.mergeFollowThenInterest(followed as never, other as never, sareesInterest);
    expect(merged.map((item) => item.feedId)).toEqual([
      'c:f-fabric',
      'c:f-saree',
      'c:p-saree',
      'c:p-fabric',
    ]);
  });

  it('keeps followed outside interest above non-followed interest match', () => {
    const service = makeService(publishedCollection, {});
    const followed = [feedRow('f-other', 'followed', ['Fabric'])];
    const other = [feedRow('p-match', 'public', ['Sarees'])];
    const merged = service.mergeFollowThenInterest(followed as never, other as never, sareesInterest);
    expect(merged.map((item) => item.feedId)).toEqual(['c:f-other', 'c:p-match']);
  });
});

describe('ExploreService.collectionDetail trust rules', () => {
  it('404s connections-audience collections for a non-connected viewer', async () => {
    const service = makeService(publishedCollection, { blocked: false, connected: false });
    await expect(service.collectionDetail('viewer', 'col1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('unlocks the full product list once connected', async () => {
    const service = makeService(publishedCollection, { blocked: false, connected: true });
    const view = await service.collectionDetail('viewer', 'col1');
    expect(view.connected).toBe(true);
    expect(view.products).toHaveLength(2);
  });

  it('returns 404 to a blocked viewer, never a 403 that would confirm the block', async () => {
    const service = makeService(publishedCollection, { blocked: true });
    await expect(service.collectionDetail('viewer', 'col1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('404s a draft collection for a non-owner, indistinguishable from missing', async () => {
    const service = makeService(
      { ...publishedCollection, status: 'draft' },
      { blocked: false, connected: false },
    );
    await expect(service.collectionDetail('viewer', 'col1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('shows products to everyone when audience is everyone, but masks on-request rates', async () => {
    const service = makeService(
      { ...publishedCollection, audience: 'everyone', rateVisibility: 'on_request' },
      { blocked: false, connected: false },
    );
    const view = await service.collectionDetail('viewer', 'col1');
    expect(view.connected).toBe(false);
    expect(view.products).toHaveLength(2);
    expect(view.products?.[0]?.rate).toBeNull();
  });

  it('404s selected-audience collections for companies not on the list', async () => {
    const service = makeService(
      {
        ...publishedCollection,
        audience: 'selected',
        audienceCompanyIds: ['buyer-a'],
      },
      { blocked: false, connected: false },
    );
    await expect(service.collectionDetail('viewer', 'col1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('unlocks products for a company on the selected list', async () => {
    const service = makeService(
      {
        ...publishedCollection,
        audience: 'selected',
        audienceCompanyIds: ['viewer'],
      },
      { blocked: false, connected: false },
    );
    const view = await service.collectionDetail('viewer', 'col1');
    expect(view.products).toHaveLength(2);
  });

  it('chat share opens a Followers pack shell without products so Ask can target the owner', async () => {
    const service = makeService(
      {
        ...publishedCollection,
        audience: 'followers',
        coverImage: 'https://img/cover',
      },
      { blocked: false, connected: false },
      { sharedInChat: true, following: false },
    );
    const view = await service.collectionDetail('viewer', 'col1');
    expect(view.products).toBeNull();
    expect(view.productCount).toBe(2);
    expect(view.company.id).toBe('owner');
    expect(view.coverImage).toBeNull();
    expect(view.previewImages).toEqual([]);
    expect(view.imageCount).toBe(0);
  });

  it('still 404s a Followers pack with no follow and no chat share', async () => {
    const service = makeService(
      { ...publishedCollection, audience: 'followers' },
      { blocked: false, connected: false },
      { sharedInChat: false, following: false },
    );
    await expect(service.collectionDetail('viewer', 'col1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('masks foreign member rates when source is on_request and viewer is not connected to source', async () => {
    const service = makeService(
      {
        ...publishedCollection,
        audience: 'everyone',
        rateVisibility: 'visible',
        products: [
          {
            product: {
              id: 'own-1',
              companyId: 'owner',
              rate: 100,
              rateVisibility: 'visible',
            },
          },
          {
            product: {
              id: 'foreign-1',
              companyId: 'supplier',
              rate: 200,
              rateVisibility: 'on_request',
            },
          },
        ],
      },
      { blocked: false, connected: true, connectedByCompany: { supplier: false } },
    );
    const view = await service.collectionDetail('viewer', 'col1');
    expect(view.products?.find((p) => p.id === 'own-1')?.rate).toBe(100);
    expect(view.products?.find((p) => p.id === 'foreign-1')?.rate).toBeNull();
  });
});
