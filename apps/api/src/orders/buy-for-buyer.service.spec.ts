import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionStatus, OrderStatus } from '@ekum/domain-types';
import { BuyForBuyerService } from './buy-for-buyer.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ThreadService } from '../conversation/thread.service';
import type { DomainEvents } from '../events/events.module';
import type { OrderSerializer } from './order.serializer';
import type { OrderService } from './order.service';
import type { OrderTrailService } from './order-trail.service';
import { OrderKind, OrderIntent, OrderTradeMode } from '@ekum/domain-types';

function serializer() {
  return {
    toOrderView: (order: { id: string }) => ({ id: order.id }),
  } as unknown as OrderSerializer;
}

function trail() {
  return { append: vi.fn(async () => undefined) } as unknown as OrderTrailService;
}

function events() {
  return {
    orderCreated: vi.fn(),
    orderStatusChanged: vi.fn(),
  } as unknown as DomainEvents;
}

function connectedPrisma(extra: Record<string, unknown> = {}) {
  return {
    connection: {
      findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
    },
    tradeLane: { findFirst: vi.fn(async () => null) },
    ...extra,
  };
}

function makeSvc(
  prisma: PrismaService,
  threads: ThreadService = {} as ThreadService,
  events: DomainEvents = {} as DomainEvents,
  orders: OrderService = { create: vi.fn() } as unknown as OrderService,
) {
  return new BuyForBuyerService(prisma, threads, events, serializer(), orders, trail());
}

describe('BuyForBuyerService', () => {
  it('rejects unknown designs', async () => {
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'seller', city: 'Surat', name: 'Mill' })) },
      product: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma);
    await expect(
      svc.create('seller', 'u1', {
        buyerCompanyId: 'buyer',
        items: [{ productId: 'p1', quantity: 10 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a trader log mill designs as I-handle when no path is set', async () => {
    const create = vi.fn(async () => ({ id: 'o-handle' }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Surat', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: ['a.jpg'],
            companyId: 'mill',
          },
        ]),
      },
      ...connectedPrisma(),
    } as unknown as PrismaService;
    const svc = makeSvc(prisma, {} as ThreadService, {} as DomainEvents, {
      create,
    } as unknown as OrderService);
    const result = await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 20 }],
    });
    expect(result.order.id).toBe('o-handle');
    expect(create).toHaveBeenCalledWith(
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'trader',
        orderPathPreference: 'handle',
        items: [{ productId: 'p1', quantity: 20, rate: undefined }],
      }),
      expect.objectContaining({
        onBehalfBuyerCompanyId: 'buyer',
        tradeMode: OrderTradeMode.Manage,
      }),
    );
  });

  it('logs mill designs Direct when Your paths is mill', async () => {
    const create = vi.fn(async () => ({ id: 'o-direct' }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Surat', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: ['a.jpg'],
            companyId: 'mill',
          },
        ]),
      },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: { findFirst: vi.fn(async () => ({ ticket: 'mill' })) },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma, {} as ThreadService, {} as DomainEvents, {
      create,
    } as unknown as OrderService);
    await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 20 }],
    });
    expect(create).toHaveBeenCalledWith(
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'mill',
        facilitatorCompanyId: 'trader',
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
      }),
      expect.objectContaining({
        onBehalfBuyerCompanyId: 'buyer',
        tradeMode: OrderTradeMode.Direct,
      }),
    );
  });

  it('keeps mill own SKUs on a visitor pack as mill–buyer 1:1 even with a Direct Link', async () => {
    const create = vi.fn(async () => ({ id: 'should-not' }));
    const orderCreate = vi.fn(async () => ({
      id: 'o-own-pack',
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'mill',
      items: [{ id: 'i1' }],
      buyer: { name: 'Shop' },
      seller: { name: 'Loom' },
    }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'mill', city: 'Ahmedabad', name: 'Loom' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Linen',
            sku: 'L1',
            rate: 1100,
            unit: 'set',
            images: [],
            companyId: 'mill',
          },
        ]),
      },
      collection: { findUnique: vi.fn(async () => ({ companyId: 'trader' })) },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: {
        findFirst: vi.fn(async () => ({
          traderCompanyId: 'trader',
          sellerCompanyId: 'mill',
          ticket: 'mill',
        })),
      },
      order: { create: orderCreate },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const svc = makeSvc(prisma, threads, events(), {
      create,
    } as unknown as OrderService);
    const result = await svc.create('mill', 'u1', {
      buyerCompanyId: 'buyer',
      collectionId: 'pack-je',
      items: [{ productId: 'p1', quantity: 5 }],
    });
    expect(result.order.id).toBe('o-own-pack');
    expect(create).not.toHaveBeenCalled();
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.Confirmed,
          tradeMode: OrderTradeMode.Bilateral,
          sellerCompanyId: 'mill',
          buyerCompanyId: 'buyer',
        }),
      }),
    );
    expect(threads.ensureTradeThread).toHaveBeenCalledWith('buyer', 'mill');
  });

  it('uses Direct when the mill lane is stored with trader and mill swapped', async () => {
    const create = vi.fn(async () => ({ id: 'o-swapped' }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Jaipur', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Linen',
            sku: 'L1',
            rate: 1100,
            unit: 'set',
            images: [],
            companyId: 'mill',
          },
        ]),
      },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: {
        findFirst: vi.fn(async () => ({
          traderCompanyId: 'mill',
          sellerCompanyId: 'trader',
          ticket: 'mill',
        })),
      },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma, {} as ThreadService, {} as DomainEvents, {
      create,
    } as unknown as OrderService);
    await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 5 }],
    });
    expect(prisma.tradeLane.findFirst).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'mill',
        facilitatorCompanyId: 'trader',
      }),
      expect.objectContaining({
        tradeMode: OrderTradeMode.Direct,
      }),
    );
  });

  it('auto-confirms own-catalog Order for buyer', async () => {
    const orderCreate = vi.fn(async () => ({
      id: 'o1',
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      items: [{ id: 'i1' }],
      buyer: { name: 'Shop' },
      seller: { name: 'Mill' },
    }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'seller', city: 'Surat', name: 'Mill' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: ['a.jpg'],
            companyId: 'seller',
          },
        ]),
      },
      collectionProduct: { findMany: vi.fn(async () => []) },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: { findFirst: vi.fn(async () => null) },
      order: { create: orderCreate },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const events = {
      orderCreated: vi.fn(),
      orderStatusChanged: vi.fn(),
    } as unknown as DomainEvents;
    const trailSvc = trail();
    const svc = new BuyForBuyerService(
      prisma,
      threads,
      events,
      serializer(),
      { create: vi.fn() } as unknown as OrderService,
      trailSvc,
    );
    const result = await svc.create('seller', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 20 }],
    });
    expect(result.order.id).toBe('o1');
    expect(result.invitePath).toBeNull();
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.Confirmed,
          confirmedByCompanyId: 'seller',
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({ lineStatus: 'confirmed' }),
            ]),
          },
        }),
      }),
    );
    expect(trailSvc.append).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'o1',
        type: 'confirmed',
        detail: 'Logged for buyer',
      }),
    );
    expect(events.orderCreated).toHaveBeenCalled();
    expect(events.orderStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.Confirmed }),
    );
  });

  it('keeps mill own-catalog Order for buyer on mill–buyer 1:1 even when a Direct Link exists', async () => {
    const create = vi.fn(async () => ({ id: 'should-not' }));
    const orderCreate = vi.fn(async () => ({
      id: 'o-own',
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'mill',
      items: [{ id: 'i1' }],
      buyer: { name: 'Shop' },
      seller: { name: 'Loom' },
    }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'mill', city: 'Ahmedabad', name: 'Loom' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Linen',
            sku: 'L1',
            rate: 1100,
            unit: 'set',
            images: [],
            companyId: 'mill',
          },
        ]),
      },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: {
        findFirst: vi.fn(async () => ({
          traderCompanyId: 'trader',
          sellerCompanyId: 'mill',
          ticket: 'mill',
        })),
      },
      order: { create: orderCreate },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const svc = makeSvc(prisma, threads, events(), {
      create,
    } as unknown as OrderService);
    const result = await svc.create('mill', 'u1', {
      buyerCompanyId: 'buyer',
      items: [{ productId: 'p1', quantity: 5 }],
    });
    expect(result.order.id).toBe('o-own');
    expect(create).not.toHaveBeenCalled();
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.Confirmed,
          tradeMode: OrderTradeMode.Bilateral,
        }),
      }),
    );
  });

  it('splits mixed own + Direct mill into 1:1 and a trio mill ticket', async () => {
    const create = vi.fn(async () => ({ id: 'o-mill' }));
    const orderCreate = vi.fn(async () => ({
      id: 'o-own',
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      items: [{ id: 'i1' }],
      buyer: { name: 'Shop' },
      seller: { name: 'House' },
    }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Jaipur', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'own-1',
            name: 'Mine',
            sku: 'M1',
            rate: 90,
            unit: 'pc',
            images: [],
            companyId: 'trader',
          },
          {
            id: 'mill-1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: [],
            companyId: 'mill',
          },
        ]),
      },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: { findFirst: vi.fn(async () => ({ ticket: 'mill' })) },
      order: { create: orderCreate },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const svc = makeSvc(prisma, threads, events(), {
      create,
    } as unknown as OrderService);
    await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [
        { productId: 'own-1', quantity: 4 },
        { productId: 'mill-1', quantity: 8 },
      ],
    });
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.Confirmed,
          tradeMode: OrderTradeMode.Bilateral,
          sellerCompanyId: 'trader',
        }),
      }),
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'mill',
        facilitatorCompanyId: 'trader',
        items: [{ productId: 'mill-1', quantity: 8, rate: undefined }],
      }),
      expect.objectContaining({
        tradeMode: OrderTradeMode.Direct,
      }),
    );
  });

  it('folds mixed own + mill with no Direct Link into one I-handle parent', async () => {
    const create = vi.fn(async () => ({ id: 'o-handle' }));
    const orderCreate = vi.fn(async () => ({ id: 'should-not' }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Jaipur', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'own-1',
            name: 'Mine',
            sku: 'M1',
            rate: 90,
            unit: 'pc',
            images: [],
            companyId: 'trader',
          },
          {
            id: 'mill-1',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: [],
            companyId: 'mill',
          },
        ]),
      },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: { findFirst: vi.fn(async () => null) },
      order: { create: orderCreate },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma, {} as ThreadService, {} as DomainEvents, {
      create,
    } as unknown as OrderService);
    await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [
        { productId: 'own-1', quantity: 4 },
        { productId: 'mill-1', quantity: 8 },
      ],
    });
    expect(orderCreate).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'trader',
        orderPathPreference: 'handle',
        items: [
          { productId: 'own-1', quantity: 4, rate: undefined },
          { productId: 'mill-1', quantity: 8, rate: undefined },
        ],
      }),
      expect.objectContaining({
        tradeMode: OrderTradeMode.Manage,
      }),
    );
  });

  it('folds two I-handle mills with no own lines into one parent', async () => {
    const create = vi.fn(async () => ({ id: 'o-handle' }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Jaipur', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'mill-a',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: [],
            companyId: 'mill-a',
          },
          {
            id: 'mill-b',
            name: 'Cotton',
            sku: 'C1',
            rate: 80,
            unit: 'pc',
            images: [],
            companyId: 'mill-b',
          },
        ]),
      },
      ...connectedPrisma(),
    } as unknown as PrismaService;
    const svc = makeSvc(prisma, {} as ThreadService, {} as DomainEvents, {
      create,
    } as unknown as OrderService);
    await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [
        { productId: 'mill-a', quantity: 3 },
        { productId: 'mill-b', quantity: 5 },
      ],
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'trader',
        orderPathPreference: 'handle',
        items: [
          { productId: 'mill-a', quantity: 3, rate: undefined },
          { productId: 'mill-b', quantity: 5, rate: undefined },
        ],
      }),
      expect.objectContaining({
        tradeMode: OrderTradeMode.Manage,
      }),
    );
  });

  it('folds own + I-handle mills into one parent when a Direct mill is in the same request', async () => {
    const create = vi.fn(async () => ({ id: 'o-ticket' }));
    const orderCreate = vi.fn(async () => ({ id: 'should-not' }));
    const prisma = {
      company: { findUnique: vi.fn(async () => ({ id: 'trader', city: 'Jaipur', name: 'House' })) },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'own-1',
            name: 'Mine',
            sku: 'M1',
            rate: 90,
            unit: 'pc',
            images: [],
            companyId: 'trader',
          },
          {
            id: 'mill-handle',
            name: 'Silk',
            sku: 'S1',
            rate: 100,
            unit: 'pc',
            images: [],
            companyId: 'mill-handle',
          },
          {
            id: 'mill-direct',
            name: 'Cotton',
            sku: 'C1',
            rate: 80,
            unit: 'pc',
            images: [],
            companyId: 'mill-direct',
          },
        ]),
      },
      connection: {
        findUnique: vi.fn(async () => ({ status: ConnectionStatus.Active })),
      },
      tradeLane: {
        findFirst: vi.fn(
          async ({ where }: { where: { OR: Array<{ sellerCompanyId: string }> } }) =>
            where.OR.some((row) => row.sellerCompanyId === 'mill-direct')
              ? { ticket: 'mill' }
              : null,
        ),
      },
      order: { create: orderCreate },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma, {} as ThreadService, {} as DomainEvents, {
      create,
    } as unknown as OrderService);
    await svc.create('trader', 'u1', {
      buyerCompanyId: 'buyer',
      items: [
        { productId: 'own-1', quantity: 4 },
        { productId: 'mill-handle', quantity: 8 },
        { productId: 'mill-direct', quantity: 6 },
      ],
    });
    expect(orderCreate).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(
      1,
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'trader',
        orderPathPreference: 'handle',
        items: [
          { productId: 'own-1', quantity: 4, rate: undefined },
          { productId: 'mill-handle', quantity: 8, rate: undefined },
        ],
      }),
      expect.objectContaining({
        tradeMode: OrderTradeMode.Manage,
      }),
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      'trader',
      'u1',
      expect.objectContaining({
        sellerCompanyId: 'mill-direct',
        facilitatorCompanyId: 'trader',
        items: [{ productId: 'mill-direct', quantity: 6, rate: undefined }],
      }),
      expect.objectContaining({
        tradeMode: OrderTradeMode.Direct,
      }),
    );
  });

  it('creates a thin company and invite for a new phone', async () => {
    const prisma = {
      company: {
        findUnique: vi.fn(async () => ({ id: 'seller', city: 'Surat', name: 'Mill' })),
        create: vi.fn(async () => ({ id: 'thin-1' })),
      },
      product: {
        findMany: vi.fn(async () => [
          {
            id: 'p1',
            name: 'Silk',
            sku: 'S1',
            rate: null,
            unit: 'pc',
            images: [],
            companyId: 'seller',
          },
        ]),
      },
      collectionProduct: { findMany: vi.fn(async () => []) },
      user: { findMany: vi.fn(async () => []) },
      tradeLane: { findFirst: vi.fn(async () => null) },
      order: {
        create: vi.fn(async () => ({
          id: 'o2',
          status: OrderStatus.Confirmed,
          buyerCompanyId: 'thin-1',
          sellerCompanyId: 'seller',
          items: [{ id: 'i1' }],
          buyer: { name: 'Ramesh' },
          seller: { name: 'Mill' },
        })),
      },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
      orderAcceptInvite: { create: vi.fn(async () => ({ token: 'tok' })) },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const events = {
      orderCreated: vi.fn(),
      orderStatusChanged: vi.fn(),
    } as unknown as DomainEvents;
    const svc = makeSvc(prisma, threads, events);
    const result = await svc.create('seller', 'u1', {
      buyerName: 'Ramesh',
      buyerPhone: '9876543210',
      items: [{ productId: 'p1', quantity: 12 }],
    });
    expect(result.invitePath?.startsWith('/o/')).toBe(true);
    expect(prisma.company.create).toHaveBeenCalled();
  });

  it('rejects Accept-logged (retired)', async () => {
    const svc = makeSvc({} as unknown as PrismaService);
    await expect(svc.acceptLogged('buyer', 'u1', 'o1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('marks invite used only when usedAt is set', async () => {
    const prisma = {
      orderAcceptInvite: {
        findUnique: vi.fn(async () => ({
          token: 'tok',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          order: {
            status: OrderStatus.Confirmed,
            seller: { name: 'Mill' },
            buyer: { name: 'Shop' },
            items: [{ id: 'i1' }],
          },
        })),
      },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma);
    const view = await svc.getInvite('tok');
    expect(view.used).toBe(false);
    expect(view.status).toBe(OrderStatus.Confirmed);
  });

  it('acceptInvite opens only — does not re-confirm', async () => {
    const prisma = {
      orderAcceptInvite: {
        findUnique: vi.fn(async () => ({
          id: 'inv1',
          token: 'tok',
          phone: '9876543210',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          orderId: 'o1',
          order: {
            id: 'o1',
            status: OrderStatus.Confirmed,
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
          },
        })),
        update: vi.fn(async () => ({})),
      },
      user: {
        findUnique: vi.fn(async () => ({ phone: '9876543210' })),
      },
      order: {
        findUniqueOrThrow: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Confirmed,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [],
        })),
        update: vi.fn(),
      },
    } as unknown as PrismaService;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const svc = makeSvc(prisma, threads);
    const result = await svc.acceptInvite('buyer', 'u1', 'tok');
    expect(result.id).toBe('o1');
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.orderAcceptInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv1' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
  });

  it('acceptInvite confirms a leftover requested ticket before opening', async () => {
    const orderUpdate = vi.fn(async () => ({}));
    const prisma = {
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
      orderAcceptInvite: {
        findUnique: vi.fn(async () => ({
          id: 'inv1',
          token: 'tok',
          phone: '9876543210',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          orderId: 'o1',
          order: {
            id: 'o1',
            status: OrderStatus.Requested,
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
          },
        })),
        update: vi.fn(async () => ({})),
      },
      user: {
        findUnique: vi.fn(async () => ({ phone: '9876543210' })),
      },
      orderItem: {
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      order: {
        update: orderUpdate,
        findUniqueOrThrow: vi.fn(async () => ({
          id: 'o1',
          status: OrderStatus.Confirmed,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [],
        })),
      },
    } as unknown as PrismaService;
    const events = { orderStatusChanged: vi.fn() } as unknown as DomainEvents;
    const threads = { ensureTradeThread: vi.fn(async () => 'th-1') } as unknown as ThreadService;
    const svc = makeSvc(prisma, threads, events);
    const result = await svc.acceptInvite('buyer', 'u1', 'tok');
    expect(result.id).toBe('o1');
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'o1' },
        data: expect.objectContaining({
          status: OrderStatus.Confirmed,
          confirmedByCompanyId: 'buyer',
        }),
      }),
    );
    expect(events.orderStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'o1', status: OrderStatus.Confirmed }),
    );
    expect(prisma.orderAcceptInvite.update).toHaveBeenCalled();
  });

  it('acceptInvite does not open a closed ticket', async () => {
    const prisma = {
      orderAcceptInvite: {
        findUnique: vi.fn(async () => ({
          id: 'inv1',
          token: 'tok',
          phone: '9876543210',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          orderId: 'o1',
          order: {
            id: 'o1',
            status: OrderStatus.Cancelled,
            buyerCompanyId: 'buyer',
            sellerCompanyId: 'seller',
          },
        })),
      },
    } as unknown as PrismaService;
    const svc = makeSvc(prisma);
    await expect(svc.acceptInvite('buyer', 'u1', 'tok')).rejects.toBeInstanceOf(ConflictException);
  });
});
