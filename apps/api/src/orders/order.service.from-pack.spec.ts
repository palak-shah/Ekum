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

const stubAudit = { appendQty: async () => undefined } as never;

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
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
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
      stubAudit,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id: opts?.tradeMode === OrderTradeMode.Manage ? 'down-1' : `up-${dto.sellerCompanyId}`,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${dto.sellerCompanyId}-${index}`,
          productId: item.productId ?? null,
          name: item.name ?? 'Design',
        })),
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

    expect(result.downstream?.id).toBe('down-1');
    expect(result.upstreams).toHaveLength(2);
    expect(result.directs).toHaveLength(0);
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

  it('keeps Place note/voice/photos on the parent; mill hops get none', async () => {
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
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
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
      stubAudit,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id: opts?.tradeMode === OrderTradeMode.Manage ? 'down-1' : `up-${dto.sellerCompanyId}`,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${dto.sellerCompanyId}-${index}`,
          productId: item.productId ?? null,
          name: item.name ?? 'Design',
        })),
      } as never;
    });

    const attach = {
      note: 'Need lining',
      noteVoiceMediaId: 'media-voice',
      noteVoiceDurationMs: 1800,
      noteImageUrls: ['https://cdn.example/a.jpg'],
    };
    await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-1',
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      ...attach,
      items: [
        { productId: 'p1', quantity: 5, images: [] },
        { productId: 'p2', quantity: 3, images: [] },
      ],
    });

    const parentDto = create.mock.calls.find(
      (call) => call[3]?.tradeMode === OrderTradeMode.Manage,
    )?.[2] as typeof attach;
    expect(parentDto).toMatchObject(attach);
    const hopDtos = create.mock.calls
      .filter((call) => call[3]?.downstreamOrderId === 'down-1')
      .map((call) => call[2] as Record<string, unknown>);
    expect(hopDtos).toHaveLength(2);
    for (const hop of hopDtos) {
      expect(hop.note).toBeUndefined();
      expect(hop.noteVoiceMediaId).toBeUndefined();
      expect(hop.noteVoiceDurationMs).toBeUndefined();
      expect(hop.noteImageUrls).toBeUndefined();
    }
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
      stubAudit,
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
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
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
      stubAudit,
    );
    (service as unknown as { create: typeof create }).create = create;

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-d',
      items: [{ productId: 'p1', quantity: 1, images: [] }],
    });
    expect(create).toHaveBeenCalled();
    expect(result.downstream?.id).toBe('down-1');
  });

  it('splits Direct-linked mill from I-handle mill and trader-owned in one checkout', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-mix',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p1' }, { productId: 'p2' }, { productId: 'p3' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 's-direct', company: { name: 'Direct Mill' } },
          { id: 'p2', companyId: 's-handle', company: { name: 'Handle Mill' } },
          { id: 'p3', companyId: 'trader', company: { name: 'Trader Own' } },
        ]),
      },
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: { traderCompanyId_sellerCompanyId_buyerCompanyId: { sellerCompanyId: string } };
          }) =>
            where.traderCompanyId_sellerCompanyId_buyerCompanyId.sellerCompanyId === 's-direct'
              ? { ticket: 'mill', behaviors: { directOrder: true, autoRepost: true } }
              : { ticket: 'me', behaviors: { directOrder: true, autoRepost: true } },
        ),
      },
      order: {
        update: vi.fn(async () => ({})),
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
      stubAudit,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      const isYouHop =
        opts?.downstreamOrderId === 'down-mix' && dto.sellerCompanyId === 'trader';
      return {
        id:
          opts?.tradeMode === OrderTradeMode.Direct
            ? `dir-${dto.sellerCompanyId}`
            : opts?.tradeMode === OrderTradeMode.Manage
              ? 'down-mix'
              : isYouHop
                ? 'you-hop'
                : `up-${dto.sellerCompanyId}`,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: opts?.onBehalfBuyerCompanyId ?? actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        facilitatorCompanyId: opts?.facilitatorCompanyId ?? null,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${dto.sellerCompanyId}-${index}`,
          productId: item.productId ?? null,
          name: item.name ?? 'Design',
          quantity: item.quantity,
        })),
      } as never;
    });

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-mix',
      items: [
        { productId: 'p1', quantity: 5, images: [] },
        { productId: 'p2', quantity: 3, images: [] },
        { productId: 'p3', quantity: 2, images: [] },
      ],
    });

    expect(result.downstream?.id).toBe('down-mix');
    // Mill hop + linked You Selling hop for leftover trader SKU.
    expect(result.upstreams).toHaveLength(2);
    expect(result.upstreams.map((row) => row.sellerCompanyId).sort()).toEqual([
      's-handle',
      'trader',
    ]);
    expect(result.directs).toHaveLength(1);
    expect(result.directs[0]?.sellerCompanyId).toBe('s-direct');
    expect(result.directs[0]?.facilitatorCompanyId).toBe('trader');
    const parentDto = create.mock.calls.find(
      (call) => call[3]?.tradeMode === OrderTradeMode.Manage,
    )?.[2] as { items: Array<{ productId: string }> };
    const parentIds = parentDto.items.map((item) => item.productId);
    expect(parentIds).toEqual(expect.arrayContaining(['p2', 'p3']));
    expect(parentIds).not.toContain('p1');
    const millHopDto = create.mock.calls.find(
      (call) =>
        call[3]?.downstreamOrderId === 'down-mix' && call[2].sellerCompanyId === 's-handle',
    )?.[2] as { items: Array<{ productId: string; sourceItemId?: string }> };
    expect(millHopDto.items).toHaveLength(1);
    expect(millHopDto.items[0]?.productId).toBe('p2');
    expect(millHopDto.items[0]?.sourceItemId).toBeTruthy();
    const youHopCall = create.mock.calls.find(
      (call) =>
        call[3]?.downstreamOrderId === 'down-mix' && call[2].sellerCompanyId === 'trader',
    );
    expect(youHopCall?.[3]).toEqual(
      expect.objectContaining({
        onBehalfBuyerCompanyId: 'buyer',
        createdByCompanyId: 'buyer',
        holdUntilSend: true,
        allowSourceItemIds: true,
        skipLanePlace: true,
      }),
    );
    const youHopDto = youHopCall?.[2] as {
      items: Array<{ productId: string; sourceItemId?: string }>;
    };
    expect(youHopDto.items).toHaveLength(1);
    expect(youHopDto.items[0]?.productId).toBe('p3');
    expect(youHopDto.items[0]?.sourceItemId).toBeTruthy();
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'you-hop' } }),
    );
  });

  it('keeps Place attach on Direct tickets when mixed with I-handle hops', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-mix',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p1' }, { productId: 'p2' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 's-direct', company: { name: 'Direct Mill' } },
          { id: 'p2', companyId: 's-handle', company: { name: 'Handle Mill' } },
        ]),
      },
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: { traderCompanyId_sellerCompanyId_buyerCompanyId: { sellerCompanyId: string } };
          }) =>
            where.traderCompanyId_sellerCompanyId_buyerCompanyId.sellerCompanyId === 's-direct'
              ? { ticket: 'mill', behaviors: { directOrder: true, autoRepost: true } }
              : { ticket: 'me', behaviors: { directOrder: true, autoRepost: true } },
        ),
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
      stubAudit,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id:
          opts?.tradeMode === OrderTradeMode.Direct
            ? `dir-${dto.sellerCompanyId}`
            : opts?.tradeMode === OrderTradeMode.Manage
              ? 'down-mix'
              : `up-${dto.sellerCompanyId}`,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        facilitatorCompanyId: opts?.facilitatorCompanyId ?? null,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${dto.sellerCompanyId}-${index}`,
          productId: item.productId ?? null,
          name: item.name ?? 'Design',
        })),
      } as never;
    });

    const attach = {
      note: 'Need lining',
      noteVoiceMediaId: 'media-voice',
      noteVoiceDurationMs: 900,
      noteImageUrls: ['https://cdn.example/n.jpg'],
    };
    await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-mix',
      ...attach,
      items: [
        { productId: 'p1', quantity: 5, images: [] },
        { productId: 'p2', quantity: 3, images: [] },
      ],
    });

    const hopDto = create.mock.calls.find((call) => call[3]?.downstreamOrderId === 'down-mix')?.[2] as Record<
      string,
      unknown
    >;
    expect(hopDto.note).toBeUndefined();
    expect(hopDto.noteImageUrls).toBeUndefined();
    const directDto = create.mock.calls.find((call) => call[3]?.tradeMode === OrderTradeMode.Direct)?.[2] as typeof attach;
    expect(directDto).toMatchObject(attach);
  });

  it('spawns a silent-released You Selling hop for leftover trader-owned lines', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-you',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p-mill' }, { productId: 'p-you' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p-mill', companyId: 'mill', company: { name: 'Mill Co' } },
          { id: 'p-you', companyId: 'trader', company: { name: 'Trader Own' } },
        ]),
      },
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
      },
      order: { update: vi.fn(async () => ({})) },
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
      stubAudit,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      const isYou =
        opts?.downstreamOrderId === 'down-you' && dto.sellerCompanyId === 'trader';
      return {
        id:
          opts?.tradeMode === OrderTradeMode.Manage
            ? 'down-you'
            : isYou
              ? 'you-1'
              : 'up-mill',
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: opts?.onBehalfBuyerCompanyId ?? actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${index}-${item.productId}`,
          productId: item.productId ?? null,
          name: item.name ?? 'Design',
          quantity: item.quantity,
        })),
      } as never;
    });

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-you',
      items: [
        { productId: 'p-mill', quantity: 10, images: [] },
        { productId: 'p-you', quantity: 4, images: [] },
      ],
    });

    expect(result.downstream?.id).toBe('down-you');
    expect(result.upstreams).toHaveLength(2);
    expect(result.upstreams.map((row) => row.id).sort()).toEqual(['up-mill', 'you-1']);
    expect(create).toHaveBeenCalledTimes(3);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'you-1' },
        data: expect.objectContaining({ upstreamReleasedAt: expect.any(Date) }),
      }),
    );
  });

  it('does not spawn a You hop for mill-only I-handle packs', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-mill',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p1' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 'mill', company: { name: 'Mill Co' } },
        ]),
      },
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
      },
      order: { update: vi.fn(async () => ({})) },
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
      stubAudit,
    );

    vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id: opts?.tradeMode === OrderTradeMode.Manage ? 'down-m' : 'up-m',
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${index}`,
          productId: item.productId ?? null,
          name: 'Design',
          quantity: item.quantity,
        })),
      } as never;
    });

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-mill',
      items: [{ productId: 'p1', quantity: 5, images: [] }],
    });
    expect(result.upstreams).toHaveLength(1);
    expect(result.upstreams[0]?.sellerCompanyId).toBe('mill');
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('hops mill lines even when the placing buyer owns that mill catalog', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-dual',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p-buyer-mill' }, { productId: 'p-other-mill' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p-buyer-mill', companyId: 'buyer', company: { name: 'Buyer Mill' } },
          { id: 'p-other-mill', companyId: 's2', company: { name: 'Other Mill' } },
        ]),
      },
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
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
      stubAudit,
    );

    const create = vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id: opts?.tradeMode === OrderTradeMode.Manage ? 'down-dual' : `up-${dto.sellerCompanyId}`,
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode ?? OrderTradeMode.Bilateral,
        downstreamOrderId: opts?.downstreamOrderId ?? null,
        items: dto.items.map((item, index) => ({
          id: `oi-${dto.sellerCompanyId}-${index}`,
          productId: item.productId ?? null,
          name: item.name ?? 'Design',
        })),
      } as never;
    });

    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-dual',
      items: [
        { productId: 'p-buyer-mill', quantity: 4, images: [] },
        { productId: 'p-other-mill', quantity: 6, images: [] },
      ],
    });

    expect(result.downstream?.id).toBe('down-dual');
    expect(result.upstreams.map((row) => row.sellerCompanyId).sort()).toEqual(['buyer', 's2']);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('creates only Direct tickets when every mill is Direct-linked', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'pack-dir',
          companyId: 'trader',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [{ productId: 'p1' }],
        })),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 's-direct', company: { name: 'Direct Mill' } },
        ]),
      },
      follow: { findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })) },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => ({
          ticket: 'mill',
          behaviors: { directOrder: true, autoRepost: true },
        })),
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
      stubAudit,
    );
    vi.spyOn(service, 'create').mockImplementation(async (actor, _user, dto, opts) => {
      return {
        id: 'dir-1',
        sellerCompanyId: dto.sellerCompanyId,
        buyerCompanyId: actor,
        tradeMode: opts?.tradeMode,
        facilitatorCompanyId: opts?.facilitatorCompanyId ?? null,
        items: [],
      } as never;
    });
    const result = await service.createFromPack('buyer', 'user-1', {
      collectionId: 'pack-dir',
      items: [{ productId: 'p1', quantity: 4, images: [] }],
    });
    expect(result.downstream).toBeNull();
    expect(result.upstreams).toHaveLength(0);
    expect(result.directs).toHaveLength(1);
    expect(result.directs[0]?.sellerCompanyId).toBe('s-direct');
  });

  it('rejects cherry-pick of a whole catalog', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'cat-whole',
          companyId: 'trader',
          name: 'Season',
          kind: 'catalog',
          orderMode: 'whole',
          company: { settings: { tradeDefaults: { tradingEnabled: true } } },
          products: [
            { productId: 'p1', product: { status: 'published' } },
            { productId: 'p2', product: { status: 'published' } },
          ],
        })),
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
      stubAudit,
    );

    try {
      await service.createFromPack('buyer', 'user-1', {
        collectionId: 'cat-whole',
        items: [{ productId: 'p1', quantity: 1, images: [] }],
      });
      expect.fail('expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        code: 'CATALOG_WHOLE_REQUIRED',
        message: 'Season is ordered as a whole.',
      });
    }
  });
});

describe('OrderService.spawnHandleUpstreams', () => {
  it('omits Place note/voice/photos on mill hops and still maps sourceItemId', async () => {
    const prisma = {
      product: {
        findMany: vi.fn(async () => [{ id: 'p1', companyId: 'mill' }]),
      },
      order: {
        findUnique: vi.fn(async () => ({
          buyerCompanyId: 'buyer',
          items: [{ id: 'pi-1', productId: 'p1', name: 'Cotton' }],
        })),
      },
      tradeLane: {
        upsert: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => null),
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
      stubAudit,
    );
    const create = vi.spyOn(service, 'create').mockResolvedValue({
      id: 'up-1',
      items: [{ id: 'ui-1', productId: 'p1' }],
    } as never);

    await (
      service as unknown as {
        spawnHandleUpstreams: (
          handlerCompanyId: string,
          userId: string,
          downstreamId: string,
          dto: {
            sellerCompanyId: string;
            kind: typeof OrderKind.Standard;
            note?: string;
            noteVoiceMediaId?: string;
            noteVoiceDurationMs?: number;
            noteImageUrls?: string[];
            items: Array<{ productId: string; quantity: number; images: string[] }>;
          },
        ) => Promise<void>;
      }
    ).spawnHandleUpstreams('trader', 'u1', 'down-1', {
      sellerCompanyId: 'trader',
      kind: OrderKind.Standard,
      note: 'Need lining',
      noteVoiceMediaId: 'media-voice',
      noteVoiceDurationMs: 900,
      noteImageUrls: ['https://cdn.example/n.jpg'],
      items: [{ productId: 'p1', quantity: 5, images: [] }],
    });

    expect(create).toHaveBeenCalledTimes(1);
    const hopDto = create.mock.calls[0]?.[2] as {
      note?: string;
      noteVoiceMediaId?: string;
      noteVoiceDurationMs?: number;
      noteImageUrls?: string[];
      items: Array<{ sourceItemId?: string }>;
    };
    expect(hopDto.note).toBeUndefined();
    expect(hopDto.noteVoiceMediaId).toBeUndefined();
    expect(hopDto.noteVoiceDurationMs).toBeUndefined();
    expect(hopDto.noteImageUrls).toBeUndefined();
    expect(hopDto.items[0]?.sourceItemId).toBe('pi-1');
    expect(create.mock.calls[0]?.[3]).toEqual(
      expect.objectContaining({ downstreamOrderId: 'down-1', holdUntilSend: true }),
    );
  });
});
