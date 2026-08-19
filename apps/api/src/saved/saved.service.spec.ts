import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConnectionStatus, ProductStatus } from '@ekum/domain-types';
import { SavedService } from './saved.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CompanySerializer } from '../access/company.serializer';

const serializer = {
  toPublicSummary: (company: { id: string; name?: string }) => ({
    id: company.id,
    name: company.name ?? company.id,
    city: null,
    verification: 'not_verified',
    logoUrl: null,
  }),
} as unknown as CompanySerializer;

const publishedProduct = {
  id: 'prod-1',
  companyId: 'seller-co',
  name: 'Silk Shirt',
  images: ['https://cdn/shirt.jpg'],
  audience: 'everyone',
  audienceCompanyIds: [] as string[],
  status: ProductStatus.Published,
  postedToMarketAt: new Date('2026-01-01'),
  company: { id: 'seller-co', name: 'Ravi Textiles' },
};

function makeService(prisma: unknown) {
  return new SavedService(prisma as PrismaService, serializer);
}

describe('SavedService.create', () => {
  it('saves a discoverable product (idempotent upsert)', async () => {
    const upsert = vi.fn(async () => ({
      id: 'saved-1',
      companyId: 'me',
      productId: 'prod-1',
      collectionId: null,
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
      product: publishedProduct,
      collection: null,
    }));
    const prisma = {
      product: {
        findUnique: async () => publishedProduct,
      },
      connection: {
        findMany: async () => [],
      },
      follow: {
        findMany: async () => [],
      },
      savedItem: { upsert },
    };
    const service = makeService(prisma);

    const view = await service.create('me', { productId: 'prod-1' });

    expect(view.kind).toBe('product');
    expect(view.productId).toBe('prod-1');
    expect(view.name).toBe('Silk Shirt');
    expect(view.thumbUrl).toBe('https://cdn/shirt.jpg');
    expect(view.company.id).toBe('seller-co');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId_productId: { companyId: 'me', productId: 'prod-1' } },
        create: { companyId: 'me', productId: 'prod-1' },
        update: {},
      }),
    );
  });

  it('rejects an undiscoverable product', async () => {
    const product = {
      ...publishedProduct,
      audience: 'connections',
    };
    const prisma = {
      product: {
        findUnique: async () => product,
      },
      connection: {
        findMany: async () => [],
      },
      follow: {
        findMany: async () => [],
      },
      savedItem: { upsert: vi.fn() },
    };
    const service = makeService(prisma);

    await expect(service.create('me', { productId: 'prod-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.savedItem.upsert).not.toHaveBeenCalled();
  });

  it('rejects both productId and collectionId', async () => {
    const service = makeService({});
    await expect(
      service.create('me', { productId: 'p1', collectionId: 'c1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects neither productId nor collectionId', async () => {
    const service = makeService({});
    await expect(service.create('me', {})).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SavedService.list', () => {
  it('lists saved items for the company newest first', async () => {
    const prisma = {
      savedItem: {
        findMany: async () => [
          {
            id: 'saved-1',
            companyId: 'me',
            productId: 'prod-1',
            collectionId: null,
            createdAt: new Date('2026-08-02T10:00:00.000Z'),
            product: publishedProduct,
            collection: null,
          },
          {
            id: 'saved-2',
            companyId: 'me',
            productId: null,
            collectionId: 'col-1',
            createdAt: new Date('2026-08-01T10:00:00.000Z'),
            product: null,
            collection: {
              id: 'col-1',
              companyId: 'seller-co',
              name: 'Monsoon Pack',
              coverImage: 'https://cdn/pack.jpg',
              company: { id: 'seller-co', name: 'Ravi Textiles' },
              products: [],
            },
          },
        ],
      },
    };
    const service = makeService(prisma);

    const list = await service.list('me');
    expect(list).toHaveLength(2);
    expect(list[0].kind).toBe('product');
    expect(list[1].kind).toBe('collection');
    expect(list[1].name).toBe('Monsoon Pack');
    expect(list[1].thumbUrl).toBe('https://cdn/pack.jpg');
  });
});

describe('SavedService.remove', () => {
  it('deletes an owned saved item', async () => {
    const deleteFn = vi.fn(async () => ({}));
    const prisma = {
      savedItem: {
        findFirst: async () => ({ id: 'saved-1', companyId: 'me' }),
        delete: deleteFn,
      },
    };
    const service = makeService(prisma);

    await service.remove('me', 'saved-1');
    expect(deleteFn).toHaveBeenCalledWith({ where: { id: 'saved-1' } });
  });

  it('throws when the saved item is missing', async () => {
    const prisma = {
      savedItem: {
        findFirst: async () => null,
        delete: vi.fn(),
      },
    };
    const service = makeService(prisma);
    await expect(service.remove('me', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SavedService.create (connected audience)', () => {
  it('allows save when viewer has an active connection', async () => {
    const product = {
      ...publishedProduct,
      audience: 'connections',
    };
    const upsert = vi.fn(async () => ({
      id: 'saved-1',
      companyId: 'me',
      productId: 'prod-1',
      collectionId: null,
      createdAt: new Date(),
      product,
      collection: null,
    }));
    const prisma = {
      product: { findUnique: async () => product },
      connection: {
        findMany: async () => [
          { ownerCompanyId: 'seller-co', status: ConnectionStatus.Active },
        ],
      },
      follow: { findMany: async () => [] },
      savedItem: { upsert },
    };
    const service = makeService(prisma);

    const view = await service.create('me', { productId: 'prod-1' });
    expect(view.productId).toBe('prod-1');
    expect(upsert).toHaveBeenCalled();
  });
});
