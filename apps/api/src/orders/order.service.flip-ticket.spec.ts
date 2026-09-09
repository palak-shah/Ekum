import { describe, expect, it, vi } from 'vitest';
import {
  OrderIntent,
  OrderKind,
  OrderLineStatus,
  OrderStatus,
  OrderTradeMode,
  TradeLaneTicket,
} from '@ekum/domain-types';
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

function Decimal(n: number) {
  return { toNumber: () => n };
}

describe('OrderService.flipTicket', () => {
  it('D12: Mills → stay on main; stamp ticket mill on every hop (no Direct split)', async () => {
    const parent = {
      id: 'main-1',
      status: OrderStatus.Requested,
      tradeMode: OrderTradeMode.Manage,
      sellerCompanyId: 'trader',
      buyerCompanyId: 'buyer',
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      note: null,
      items: [
        {
          id: 'oi-1',
          productId: 'p1',
          quantity: Decimal(10),
          images: [],
          note: null,
          unit: 'pc',
          name: 'Design A',
          lineStatus: OrderLineStatus.Open,
        },
        {
          id: 'oi-2',
          productId: 'p2',
          quantity: Decimal(5),
          images: [],
          note: null,
          unit: 'pc',
          name: 'Design B',
          lineStatus: OrderLineStatus.Open,
        },
      ],
    };

    const ups = [
      {
        id: 'up-s1',
        sellerCompanyId: 's1',
        seller: { name: 'Surat Silk House' },
        items: [{ productId: 'p1', quantity: Decimal(10), images: [], note: null, unit: 'pc', name: 'A' }],
      },
      {
        id: 'up-s2',
        sellerCompanyId: 's2',
        seller: { name: 'Ahmedabad Loom Co' },
        items: [{ productId: 'p2', quantity: Decimal(5), images: [], note: null, unit: 'pc', name: 'B' }],
      },
    ];

    const prisma = {
      order: {
        findMany: vi.fn(async () => ups),
        update: vi.fn(async () => ({})),
      },
      tradeLane: { upsert: vi.fn(async () => ({})) },
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

    vi.spyOn(service as never, 'loadForParty').mockResolvedValue(parent as never);
    vi.spyOn(service as never, 'hasSellerQuote').mockResolvedValue(false);
    const create = vi.spyOn(service, 'create');
    const upsertLane = vi
      .spyOn(service as never, 'upsertTradeLane')
      .mockResolvedValue(undefined as never);
    vi.spyOn(service, 'get').mockResolvedValue({
      id: 'main-1',
      tradeMode: OrderTradeMode.Manage,
      laneTicket: 'mill',
      millDesks: [{ sellerName: 'Surat' }, { sellerName: 'Ahmedabad' }],
    } as never);

    const result = await service.flipTicket('trader', 'user-1', 'main-1', {
      ticket: TradeLaneTicket.Mill,
    });

    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(upsertLane).toHaveBeenCalledTimes(2);
    expect(upsertLane).toHaveBeenCalledWith('trader', 's1', 'buyer', {
      ticket: TradeLaneTicket.Mill,
    });
    expect(upsertLane).toHaveBeenCalledWith('trader', 's2', 'buyer', {
      ticket: TradeLaneTicket.Mill,
    });
    expect(result.id).toBe('main-1');
    expect(result.tradeMode).toBe(OrderTradeMode.Manage);
  });

  it('D12: one mill Mills flip also stays on main (uniform)', async () => {
    const parent = {
      id: 'main-1',
      status: OrderStatus.Requested,
      tradeMode: OrderTradeMode.Manage,
      sellerCompanyId: 'trader',
      buyerCompanyId: 'buyer',
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      note: null,
      items: [
        {
          id: 'oi-1',
          productId: 'p1',
          quantity: Decimal(10),
          images: [],
          note: null,
          unit: 'pc',
          name: 'Design A',
          lineStatus: OrderLineStatus.Open,
        },
      ],
    };
    const ups = [
      {
        id: 'up-s1',
        sellerCompanyId: 's1',
        seller: { name: 'Surat Silk House' },
        items: [{ productId: 'p1', quantity: Decimal(10), images: [], note: null, unit: 'pc', name: 'A' }],
      },
    ];
    const prisma = {
      order: { findMany: vi.fn(async () => ups), update: vi.fn(async () => ({})) },
      tradeLane: { upsert: vi.fn(async () => ({})) },
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
    vi.spyOn(service as never, 'loadForParty').mockResolvedValue(parent as never);
    vi.spyOn(service as never, 'hasSellerQuote').mockResolvedValue(false);
    const create = vi.spyOn(service, 'create');
    vi.spyOn(service as never, 'upsertTradeLane').mockResolvedValue(undefined as never);
    vi.spyOn(service, 'get').mockResolvedValue({
      id: 'main-1',
      tradeMode: OrderTradeMode.Manage,
    } as never);

    const result = await service.flipTicket('trader', 'user-1', 'main-1', {
      ticket: TradeLaneTicket.Mill,
    });

    expect(create).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(result.id).toBe('main-1');
  });
});
