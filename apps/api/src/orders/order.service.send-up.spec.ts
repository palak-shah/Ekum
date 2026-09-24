import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrderTradeMode } from '@ekum/domain-types';
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

/** TradeLane mocks for sendUp / get mill desks (product added after Manage desk). */
function tradeLaneMocks() {
  return {
    upsert: vi.fn(async () => ({
      id: 'lane-1',
      reveal: false,
      ticket: 'me',
      groupThreadId: null,
      traderCompanyId: 'trader',
      sellerCompanyId: 'mill',
      buyerCompanyId: 'buyer',
    })),
    findMany: vi.fn(async () => []),
    update: vi.fn(async () => ({})),
  };
}

function service(
  prisma: PrismaService,
  extras: { events?: DomainEvents; threads?: ThreadService; serializer?: OrderSerializer } = {},
) {
  return new OrderService(
    prisma,
    extras.serializer ?? ({} as OrderSerializer),
    { assertCanTrade: async () => undefined } as unknown as TradeAccess,
    extras.events ?? ({ orderCreated: vi.fn() } as unknown as DomainEvents),
    {} as ConfigService<Env, true>,
    {} as JobQueue,
    extras.threads ??
      ({
        ensureTradeThread: vi.fn(async () => 'thread-1'),
        findDirectThreadId: vi.fn(async () => 'thread-1'),
        notifyUserIdsForMessage: vi.fn(async () => ({
          companyIds: [] as string[],
          userIds: [] as string[],
        })),
      } as unknown as ThreadService),
    stubTrail,
  );
}

describe('OrderService.sendUp', () => {
  it('rejects when the actor is not the handler', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'down-1',
          sellerCompanyId: 'trader',
          buyerCompanyId: 'buyer',
          facilitatorCompanyId: null,
          tradeMode: OrderTradeMode.Manage,
          downstreamOrderId: null,
          upstreamReleasedAt: null,
        })),
      },
    } as unknown as PrismaService;
    const svc = service(prisma);
    await expect(svc.sendUp('buyer', 'u1', 'down-1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when nothing is waiting', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'down-1',
          sellerCompanyId: 'trader',
          buyerCompanyId: 'buyer',
          facilitatorCompanyId: null,
          tradeMode: OrderTradeMode.Manage,
          downstreamOrderId: null,
          upstreamReleasedAt: null,
        })),
        findMany: vi.fn(async () => []),
      },
      companySettings: {
        findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
      },
    } as unknown as PrismaService;
    const svc = service(prisma);
    await expect(svc.sendUp('trader', 'u1', 'down-1', {})).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'requested',
          upstreamReleasedAt: null,
        }),
      }),
    );
  });

  it('patches qty, releases, and notifies the mill', async () => {
    const held = {
      id: 'up-1',
      buyerCompanyId: 'trader',
      sellerCompanyId: 'mill',
      facilitatorCompanyId: null,
      intent: 'order',
      status: 'requested',
      note: 'For order #DOWN01',
      items: [{ id: 'ui-1', productId: 'p1', quantity: 10 }],
      seller: { name: 'Ahmedabad Loom Co' },
    };
    const events = { orderCreated: vi.fn() } as unknown as DomainEvents;
    const threads = {
      ensureTradeThread: vi.fn(async () => 'thread-mill'),
      findDirectThreadId: vi.fn(async () => 'thread-mill'),
      notifyUserIdsForMessage: vi.fn(async () => ({
        companyIds: [] as string[],
        userIds: [] as string[],
      })),
    } as unknown as ThreadService;
    const trailAppend = vi.fn(async () => undefined);
    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: 'down-1',
            sellerCompanyId: 'trader',
            buyerCompanyId: 'buyer',
            facilitatorCompanyId: null,
            tradeMode: OrderTradeMode.Manage,
            downstreamOrderId: null,
            upstreamReleasedAt: null,
            items: [],
          })
          .mockResolvedValueOnce({
            ...held,
            buyer: { name: 'Ravi' },
            seller: { name: 'Ahmedabad Loom Co' },
            items: held.items,
          }),
        findMany: vi.fn(async () => [held]),
        update: vi.fn(async () => held),
      },
      orderItem: { update: vi.fn(async () => ({})) },
      companySettings: {
        findUnique: vi.fn(async () => ({ tradeDefaults: { tradingEnabled: true } })),
      },
      message: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({ id: 'm1' })),
      },
      thread: { update: vi.fn(async () => ({})) },
      tradeLane: tradeLaneMocks(),
    } as unknown as PrismaService;
    const svc = new OrderService(
      prisma,
      {} as OrderSerializer,
      { assertCanTrade: async () => undefined } as unknown as TradeAccess,
      events,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      threads,
      { append: trailAppend, listForViewer: async () => [], backfillFromOrder: async () => undefined } as unknown as OrderTrailService,
    );
    vi.spyOn(svc, 'get').mockResolvedValue({ id: 'down-1', canSendUp: false } as never);

    await svc.sendUp('trader', 'u1', 'down-1', {
      items: [{ productId: 'p1', quantity: 8, rate: 120 }],
    });

    expect(prisma.orderItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ui-1' },
        data: expect.objectContaining({ quantity: 8, rate: 120 }),
      }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'up-1' },
        data: expect.objectContaining({ upstreamReleasedAt: expect.any(Date) }),
      }),
    );
    expect(trailAppend).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'down-1',
        summary: 'You sent to Ahmedabad Loom Co',
      }),
    );
    expect(threads.ensureTradeThread).toHaveBeenCalledWith('trader', 'mill');
    expect(events.orderCreated).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'up-1' }));
  });

  it('hides held mill hops from the supplier list', async () => {
    const findMany = vi.fn(async () => []);
    const prisma = {
      order: { findMany },
      message: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    const serializer = { toOrderView: vi.fn() } as unknown as OrderSerializer;
    const svc = service(prisma, { serializer });
    await svc.list('mill', { limit: 20, sort: 'newest' });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([
            {
              NOT: {
                sellerCompanyId: 'mill',
                downstreamOrderId: { not: null },
                upstreamReleasedAt: null,
              },
            },
            {
              NOT: {
                buyerCompanyId: 'mill',
                downstreamOrderId: { not: null },
              },
            },
          ]),
        },
      }),
    );
  });

  it('lets the handler Send when a mill hop is still waiting', async () => {
    const down = {
      id: 'seed-order-handle-down',
      sellerCompanyId: 'trader',
      buyerCompanyId: 'buyer',
      facilitatorCompanyId: null,
      tradeMode: OrderTradeMode.Manage,
      downstreamOrderId: null,
      upstreamReleasedAt: null,
      items: [],
      buyer: { name: 'Jaipur Emporium' },
      seller: { name: 'Surat Silk House' },
    };
    const prisma = {
      order: {
        findUnique: vi.fn(async () => down),
        findMany: vi.fn(async () => [
          {
            id: 'seed-order-handle-up',
            sellerCompanyId: 'mill',
            status: 'requested',
            upstreamReleasedAt: null,
            passHeldAt: null,
            items: [],
            seller: { name: 'Ahmedabad Loom Co' },
            buyer: { name: 'Surat Silk House' },
          },
        ]),
      },
      message: { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []) },
      paymentRequest: { findMany: vi.fn(async () => []) },
      tradeLane: tradeLaneMocks(),
    } as unknown as PrismaService;
    const serializer = {
      toOrderView: vi.fn(() => ({ id: down.id })),
    } as unknown as OrderSerializer;
    const svc = service(prisma, { serializer });
    const view = await svc.get('trader', down.id);
    expect(view.canSendUp).toBe(true);
    expect(view.relatedOrders).toEqual([
      expect.objectContaining({
        id: 'seed-order-handle-up',
        role: 'upstream',
        held: true,
        sellerName: 'Ahmedabad Loom Co',
      }),
    ]);
  });

  it('does not let the mill open a held hop', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'seed-order-handle-up',
          sellerCompanyId: 'mill',
          buyerCompanyId: 'trader',
          facilitatorCompanyId: null,
          downstreamOrderId: 'seed-order-handle-down',
          upstreamReleasedAt: null,
        })),
      },
    } as unknown as PrismaService;
    const svc = service(prisma);
    await expect(svc.get('mill', 'seed-order-handle-up')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not show the buyer ticket as Related on the mill hop', async () => {
    const up = {
      id: 'seed-order-handle-up',
      sellerCompanyId: 'mill',
      buyerCompanyId: 'trader',
      facilitatorCompanyId: null,
      tradeMode: OrderTradeMode.Bilateral,
      downstreamOrderId: 'seed-order-handle-down',
      upstreamReleasedAt: new Date(),
      passHeldAt: null,
      status: 'requested',
      intent: 'order',
      kind: 'standard',
      items: [],
      shipments: [],
      buyer: { id: 'trader', name: 'Surat Silk House' },
      seller: { id: 'mill', name: 'Ahmedabad Loom Co' },
      createdByUser: null,
      quotedByUser: null,
      confirmedByUser: null,
      deliveredByUser: null,
      settledByUser: null,
      updatedByUser: null,
    };
    const prisma = {
      order: {
        findUnique: vi.fn(async (args: { where: { id: string } }) => {
          if (args.where.id === up.id) return up;
          return {
            id: 'seed-order-handle-down',
            status: 'requested',
            buyer: { name: 'Jaipur Emporium' },
            seller: { name: 'Surat Silk House' },
          };
        }),
        findMany: vi.fn(async () => []),
      },
      message: { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []) },
      paymentRequest: { findMany: vi.fn(async () => []) },
      tradeLane: tradeLaneMocks(),
    } as unknown as PrismaService;
    const serializer = {
      toOrderView: vi.fn((order: { id: string }) => ({ id: order.id, direction: 'selling' })),
    } as unknown as OrderSerializer;
    const svc = service(prisma, { serializer });
    const view = await svc.get('mill', up.id);
    expect(view.relatedOrders).toEqual([]);
  });

  it('does not show Related / Linked on the Manage parent for the end buyer', async () => {
    const down = {
      id: 'seed-order-handle-down',
      sellerCompanyId: 'trader',
      buyerCompanyId: 'buyer',
      facilitatorCompanyId: null,
      tradeMode: OrderTradeMode.Manage,
      downstreamOrderId: null,
      upstreamReleasedAt: null,
      passHeldAt: null,
      status: 'settled',
      intent: 'order',
      kind: 'standard',
      items: [],
      shipments: [],
      buyer: { id: 'buyer', name: 'Jaipur Emporium' },
      seller: { id: 'trader', name: 'Surat Silk House' },
      createdByUser: null,
      quotedByUser: null,
      confirmedByUser: null,
      deliveredByUser: null,
      settledByUser: null,
      updatedByUser: null,
    };
    const prisma = {
      order: {
        findUnique: vi.fn(async () => down),
        findMany: vi.fn(async () => []),
      },
      message: { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []) },
      paymentRequest: { findMany: vi.fn(async () => []) },
      tradeLane: tradeLaneMocks(),
    } as unknown as PrismaService;
    const serializer = {
      toOrderView: vi.fn((order: { id: string }) => ({
        id: order.id,
        direction: 'buying',
        partiallyShipped: false,
      })),
    } as unknown as OrderSerializer;
    const svc = service(prisma, { serializer });
    const view = await svc.get('buyer', down.id);
    expect(view.relatedOrders).toEqual([]);
  });
});

describe('OrderService.millDecline', () => {
  it('declines a held mill hop and those parent lines', async () => {
    const trailAppend = vi.fn(async () => undefined);
    const parent = {
      id: 'down-1',
      sellerCompanyId: 'trader',
      buyerCompanyId: 'buyer',
      facilitatorCompanyId: null,
      tradeMode: OrderTradeMode.Manage,
      seller: { name: 'Meena Trading' },
      items: [{ id: 'pi-1', productId: 'p1' }],
    };
    const up = {
      id: 'up-1',
      downstreamOrderId: 'down-1',
      upstreamReleasedAt: null,
      status: 'requested',
      seller: { name: 'Ahmedabad Loom Co' },
      items: [{ id: 'ui-1', productId: 'p1' }],
    };
    const prisma = {
      order: {
        findUnique: vi.fn(async () => parent),
        findMany: vi.fn(async () => [up]),
        update: vi.fn(async () => ({})),
      },
      orderItem: {
        updateMany: vi.fn(async () => ({ count: 1 })),
        count: vi.fn(async () => 1),
      },
    } as unknown as PrismaService;
    const svc = new OrderService(
      prisma,
      {} as OrderSerializer,
      { assertCanTrade: async () => undefined } as unknown as TradeAccess,
      { orderCreated: vi.fn() } as unknown as DomainEvents,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      {
        ensureTradeThread: vi.fn(async () => 'thread-1'),
        findDirectThreadId: vi.fn(async () => 'thread-1'),
        notifyUserIdsForMessage: vi.fn(async () => ({ companyIds: [], userIds: [] })),
      } as unknown as ThreadService,
      { append: trailAppend, listForViewer: async () => [], backfillFromOrder: async () => undefined } as unknown as OrderTrailService,
    );
    vi.spyOn(svc, 'get').mockResolvedValue({ id: 'down-1' } as never);

    await svc.millDecline('trader', 'u1', 'down-1', { upstreamOrderId: 'up-1' });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'up-1' },
        data: expect.objectContaining({ status: 'declined' }),
      }),
    );
    expect(prisma.orderItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orderId: 'down-1', productId: { in: ['p1'] } }),
      }),
    );
    expect(trailAppend).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'You declined Ahmedabad Loom Co' }),
    );
    expect(prisma.order.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'down-1' } }),
    );
  });

  it('rejects after the mill was already sent', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn(async () => ({
          id: 'down-1',
          sellerCompanyId: 'trader',
          tradeMode: OrderTradeMode.Manage,
        })),
        findMany: vi.fn(async () => []),
      },
    } as unknown as PrismaService;
    const svc = service(prisma);
    await expect(
      svc.millDecline('trader', 'u1', 'down-1', { upstreamOrderId: 'up-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('omitting upstreamOrderId declines every held mill', async () => {
    const trailAppend = vi.fn(async () => undefined);
    const parent = {
      id: 'down-1',
      sellerCompanyId: 'trader',
      buyerCompanyId: 'buyer',
      facilitatorCompanyId: null,
      tradeMode: OrderTradeMode.Manage,
      seller: { name: 'Meena Trading' },
      items: [
        { id: 'pi-1', productId: 'p1' },
        { id: 'pi-2', productId: 'p2' },
      ],
    };
    const ups = [
      {
        id: 'up-1',
        seller: { name: 'Surat Silk House' },
        items: [{ id: 'ui-1', productId: 'p1' }],
      },
      {
        id: 'up-2',
        seller: { name: 'Ahmedabad Loom Co' },
        items: [{ id: 'ui-2', productId: 'p2' }],
      },
    ];
    const prisma = {
      order: {
        findUnique: vi.fn(async () => parent),
        findMany: vi.fn(async () => ups),
        update: vi.fn(async () => ({})),
      },
      orderItem: {
        updateMany: vi.fn(async () => ({ count: 1 })),
        count: vi.fn(async () => 1),
      },
    } as unknown as PrismaService;
    const svc = new OrderService(
      prisma,
      {} as OrderSerializer,
      { assertCanTrade: async () => undefined } as unknown as TradeAccess,
      { orderCreated: vi.fn() } as unknown as DomainEvents,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      {
        ensureTradeThread: vi.fn(async () => 'thread-1'),
        findDirectThreadId: vi.fn(async () => 'thread-1'),
        notifyUserIdsForMessage: vi.fn(async () => ({ companyIds: [], userIds: [] })),
      } as unknown as ThreadService,
      {
        append: trailAppend,
        listForViewer: async () => [],
        backfillFromOrder: async () => undefined,
      } as unknown as OrderTrailService,
    );
    vi.spyOn(svc, 'get').mockResolvedValue({ id: 'down-1' } as never);

    await svc.millDecline('trader', 'u1', 'down-1', {});

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'up-1' } }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'up-2' } }),
    );
    expect(prisma.order.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'down-1' } }),
    );
    expect(trailAppend).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'You declined Surat Silk House' }),
    );
    expect(trailAppend).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'You declined Ahmedabad Loom Co' }),
    );
  });
});
