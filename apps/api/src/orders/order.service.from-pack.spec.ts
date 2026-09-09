import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrderIntent, OrderKind, OrderTradeMode } from '@ekum/domain-types';
import { OrderService } from './order.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { TradeAccess } from './trade-access';
import type { DomainEvents } from '../events/events.module';
import type { JobQueue } from '../jobs/job-queue.service';
import type { Env } from '../core/config/config.schema';
import type { ConfigService } from '@nestjs/config';
import type { ThreadService } from '../conversation/thread.service';
import type { OrderTrailService } from './order-trail.service';

const stubTrail = {
  append: async () => undefined,
  listForViewer: async () => [],
  backfillFromOrder: async () => undefined,
} as unknown as OrderTrailService;

describe('OrderService.createFromPack', () => {
  it('creates manage downstream and upstream per supplier', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-1',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true, orderPathPreference: 'handle' } } },
          products: [{ productId: 'p1' }, { productId: 'p2' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 's1', company: { name: 'Supplier One' } },
          { id: 'p2', companyId: 's2', company: { name: 'Supplier Two' } },
        ]),
      },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
      },
    } as unknown as PrismaService;

    const service = new OrderService(
      prisma,
      {} as OrderSerializer,
      { assertCanTrade: async () => undefined } as unknown as TradeAccess,
      {} as DomainEvents,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      {} as ThreadService,
      stubTrail,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id: opts?.tradeMode === OrderTradeMode.Manage ? 'down-1' : `up-${dto.sellerCompanyId}`,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
      } as never;
    });

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-1',
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      items: [
        { productId: 'p1', quantity: 5, images: [] },
        { productId: 'p2', quantity: 3, images: [] },
      ],
    });

    expect(result.downstream.id).toBe('down-1');
    expect(result.upstreams).toHaveLength(2);
    expect(result.failures).toHaveLength(0);
    // One parent + one hop per mill — never spawnHandleUpstreams on top of this loop.
    expect(create).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledWith(
      'buyer',
      'user-1',
      expect.objectContaining({ sellerCompanyId: 'trader' }),
      expect.objectContaining({ tradeMode: OrderTradeMode.Manage, allowForeignProducts: true }),
    );
    const downDto = create.mock.calls[0]?.[2] as { orderPathPreference?: string };
    expect(downDto.orderPathPreference).toBeUndefined();
    expect(create).toHaveBeenCalledWith(
      'trader',
      'user-1',
      expect.objectContaining({ sellerCompanyId: 's1' }),
      expect.objectContaining({ downstreamOrderId: 'down-1', holdUntilSend: true }),
    );
  });

  it('rejects non-curated packs', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'own-pack',
          companyId: 'seller',
          company: { settings: { tradeDefaults: {} } },
          products: [{ productId: 'p1' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 'seller', company: { name: 'Own' } },
        ]),
      },
    } as unknown as PrismaService;

    const service = new OrderService(
      prisma,
      {} as OrderSerializer,
      { assertCanTrade: async () => undefined } as unknown as TradeAccess,
      {} as DomainEvents,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      {} as ThreadService,
      stubTrail,
    );

    await expect(
      service.createFromPack('buyer', 'user-1', {
        collectionId: 'own-pack',
        items: [{ productId: 'p1', quantity: 1, images: [] }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts curated packs even when pack stamp was Direct (lane owns path)', async () => {
    const create = vi.fn(async () => ({ id: 'down-1' }));
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-d',
          companyId: 'trader',
          orderPathPreference: 'direct',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p1' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 's1', company: { name: 'Supplier' } },
        ]),
      },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
      },
      order: {
        findUnique: vi.fn(async () => ({ buyerCompanyId: 'buyer' })),
      },
    } as unknown as PrismaService;

    const service = new OrderService(
      prisma,
      {} as OrderSerializer,
      { assertCanTrade: async () => undefined } as unknown as TradeAccess,
      {} as DomainEvents,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      {} as ThreadService,
      stubTrail,
    );
    (service as unknown as { create: typeof create }).create = create;

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-d',
      items: [{ productId: 'p1', quantity: 1, images: [] }],
    });
    expect(create).toHaveBeenCalled();
    expect(result.downstream.id).toBe('down-1');
  });
});
