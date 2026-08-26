import { BadRequestException, ForbiddenException } from '@nestjs/common';
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

function service(prisma: PrismaService, extras: { events?: DomainEvents; threads?: ThreadService } = {}) {
  return new OrderService(
    prisma,
    {} as OrderSerializer,
    { assertCanTrade: async () => undefined } as unknown as TradeAccess,
    extras.events ?? ({ orderCreated: vi.fn() } as unknown as DomainEvents),
    {} as ConfigService<Env, true>,
    {} as JobQueue,
    extras.threads ??
      ({
        ensureTradeThread: vi.fn(async () => 'thread-1'),
        findDirectThreadId: vi.fn(async () => 'thread-1'),
      } as unknown as ThreadService),
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
    };
    const events = { orderCreated: vi.fn() } as unknown as DomainEvents;
    const threads = {
      ensureTradeThread: vi.fn(async () => 'thread-mill'),
      findDirectThreadId: vi.fn(async () => 'thread-mill'),
    } as unknown as ThreadService;
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
            seller: { name: 'Kavita' },
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
    } as unknown as PrismaService;
    const svc = service(prisma, { events, threads });
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
    expect(threads.ensureTradeThread).toHaveBeenCalledWith('trader', 'mill');
    expect(events.orderCreated).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'up-1' }));
  });
});
