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
}

function makeService(collectionRow: unknown, visibility: VisibilityStub) {
  const prisma = {
    collection: { findUnique: async () => collectionRow },
  } as unknown as PrismaService;
  const visibilityService = {
    isBlocked: async () => visibility.blocked ?? false,
    canViewCatalog: async () => visibility.connected ?? false,
  } as unknown as VisibilityService;
  const catalog = {
    toProductView: (product: { id: string; rate?: number | null }) => ({
      id: product.id,
      rate: product.rate ?? null,
    }),
  } as unknown as CatalogSerializer;
  const discovery = {
    toCollectionCard: (row: { id: string; companyId: string; _count: { products: number } }) => ({
      id: row.id,
      name: 'Wedding Edit',
      company: { id: row.companyId },
      coverImage: null,
      previewImages: [],
      imageCount: 0,
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
  company: { id: 'owner' },
  _count: { products: 2 },
  products: [
    { product: { id: 'p1', rate: 100 } },
    { product: { id: 'p2', rate: 200 } },
  ],
};

describe('ExploreService.collectionDetail trust rules', () => {
  it('returns a blurred preview (products null) to a non-connected viewer', async () => {
    const service = makeService(publishedCollection, { blocked: false, connected: false });
    const view = await service.collectionDetail('viewer', 'col1');
    expect(view.connected).toBe(false);
    expect(view.products).toBeNull();
    // The product count is still advertised so the viewer knows what to unlock.
    expect(view.productCount).toBe(2);
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
});
