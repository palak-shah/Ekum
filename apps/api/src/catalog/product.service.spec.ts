import { describe, expect, it, vi } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import { ProductService } from './product.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';

function setup(canPublish: boolean) {
  const productUpdate = vi.fn(async () => ({ id: 'p1', status: ProductStatus.Published }));
  const companyUpdate = vi.fn(async () => ({ id: 'c1', canPublish: true }));
  let canPublishNow = canPublish;
  const prisma = {
    product: {
      findFirst: async () => ({
        id: 'p1',
        companyId: 'c1',
        sku: 'EK-EXISTING',
        audience: 'connections',
        rateVisibility: 'on_request',
        postedToMarketAt: null,
      }),
      update: productUpdate,
    },
    company: {
      findUnique: async () => ({ canPublish: canPublishNow }),
      findUniqueOrThrow: async () => ({ canPublish: canPublishNow }),
      update: async () => {
        canPublishNow = true;
        return companyUpdate();
      },
    },
    companySettings: {
      findUnique: async () => null,
      upsert: vi.fn(async () => ({})),
    },
  } as unknown as PrismaService;
  const serializer = {
    toProductView: (product: unknown) => product,
  } as unknown as CatalogSerializer;
  return {
    service: new ProductService(prisma, serializer),
    productUpdate,
    companyUpdate,
  };
}

describe('ProductService.setStatus publish gate', () => {
  it('blocks publishing when the company cannot publish', async () => {
    const { service, productUpdate } = setup(false);
    await expect(service.setStatus('c1', 'u1', 'p1', ProductStatus.Published)).rejects.toThrow();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it('allows publishing when the company can publish', async () => {
    const { service, productUpdate } = setup(true);
    await service.setStatus('c1', 'u1', 'p1', ProductStatus.Published);
    expect(productUpdate).toHaveBeenCalled();
  });

  it('does not gate archiving', async () => {
    const { service, productUpdate } = setup(false);
    await service.setStatus('c1', 'u1', 'p1', ProductStatus.Archived);
    expect(productUpdate).toHaveBeenCalled();
  });
});

describe('ProductService.publish consent', () => {
  it('blocks catalog publish without consent when locked', async () => {
    const { service, productUpdate, companyUpdate } = setup(false);
    await expect(service.publish('c1', 'u1', 'p1', {})).rejects.toThrow();
    expect(productUpdate).not.toHaveBeenCalled();
    expect(companyUpdate).not.toHaveBeenCalled();
  });

  it('grants capability and publishes when consent is sent', async () => {
    const { service, productUpdate, companyUpdate } = setup(false);
    await service.publish('c1', 'u1', 'p1', {
      audience: 'connections',
      rateVisibility: 'on_request',
      consentToSell: true,
    });
    expect(companyUpdate).toHaveBeenCalled();
    expect(productUpdate).toHaveBeenCalled();
  });

  it('publishes without consent when already unlocked', async () => {
    const { service, productUpdate, companyUpdate } = setup(true);
    await service.publish('c1', 'u1', 'p1', {
      audience: 'connections',
      rateVisibility: 'on_request',
    });
    expect(companyUpdate).not.toHaveBeenCalled();
    expect(productUpdate).toHaveBeenCalled();
  });
});

describe('ProductService.postToMarket / unpost / unpublish', () => {
  it('postToMarket sets postedToMarketAt and audience', async () => {
    const { service, productUpdate } = setup(true);
    await service.postToMarket('c1', 'u1', 'p1', {
      audience: 'everyone',
      rateVisibility: 'visible',
      allowForward: true,
    });
    expect(productUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postedToMarketAt: expect.any(Date),
          audience: 'everyone',
          rateVisibility: 'visible',
          status: ProductStatus.Published,
        }),
      }),
    );
  });

  it('unpostFromMarket hides to draft (clears Explore)', async () => {
    const { service, productUpdate } = setup(true);
    await service.unpostFromMarket('c1', 'u1', 'p1');
    expect(productUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProductStatus.Draft,
          postedToMarketAt: null,
        }),
      }),
    );
  });

  it('unpublish via setStatus clears postedToMarketAt', async () => {
    const { service, productUpdate } = setup(true);
    await service.setStatus('c1', 'u1', 'p1', ProductStatus.Draft);
    expect(productUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProductStatus.Draft,
          postedToMarketAt: null,
        }),
      }),
    );
  });
});

describe('ProductService.create', () => {
  it('ensures selling is enabled after creating a design', async () => {
    const settingsUpsert = vi.fn(async () => ({}));
    const productCreate = vi.fn(async () => ({
      id: 'p-new',
      companyId: 'c1',
      name: 'Banarasi',
      sku: 'EK-1',
      status: ProductStatus.Draft,
    }));
    const prisma = {
      product: {
        findFirst: async () => null,
        create: productCreate,
        count: async () => 0,
      },
      companySettings: {
        findUnique: async () => ({ tradeDefaults: { sellingEnabled: false } }),
        upsert: settingsUpsert,
      },
    } as unknown as PrismaService;
    const serializer = {
      toProductView: (product: unknown) => product,
    } as unknown as CatalogSerializer;
    const service = new ProductService(prisma, serializer);

    await service.create('c1', 'u1', {
      name: 'Banarasi',
      categories: [],
      images: [],
    });

    expect(productCreate).toHaveBeenCalled();
    expect(settingsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          tradeDefaults: expect.objectContaining({ sellingEnabled: true }),
        }),
      }),
    );
  });
});
