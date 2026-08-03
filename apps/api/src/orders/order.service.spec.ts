import { describe, expect, it } from 'vitest';
import { OrderKind, OrderStatus, type CreateOrderDto } from '@ekum/domain-types';
import { OrderService } from './order.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { TradeAccess } from './trade-access';
import type { DomainEvents } from '../events/events.module';
import type { JobQueue } from '../jobs/job-queue.service';
import type { Env } from '../core/config/config.schema';
import type { ConfigService } from '@nestjs/config';
import type { ThreadService } from '../conversation/thread.service';

const events = {
  orderCreated: () => undefined,
  orderStatusChanged: () => undefined,
} as unknown as DomainEvents;

const config = {
  get: () => 7,
} as unknown as ConfigService<Env, true>;

const jobs = { enqueue: async () => 'job-1' } as unknown as JobQueue;

const threads = {
  ensureTradeThread: async () => 'thread-1',
  findDirectThreadId: async () => 'thread-1',
} as unknown as ThreadService;

interface Captured {
  createData: { items: { create: Record<string, unknown>[] } } | null;
  updateData: Record<string, unknown> | null;
  messageCreate: Record<string, unknown> | null;
}

interface Options {
  products?: { id: string; name: string; sku: string | null; rate: unknown; unit: string | null; images: string[] }[];
  order?: {
    id: string;
    status: string;
    buyerCompanyId: string;
    sellerCompanyId: string;
    items?: { id: string; quantity: { toNumber: () => number } }[];
  } | null;
}

function makeService(options: Options) {
  const captured: Captured = { createData: null, updateData: null, messageCreate: null };
  const prisma = {
    product: { findMany: async () => options.products ?? [] },
    order: {
      create: async (args: { data: Captured['createData'] }) => {
        captured.createData = args.data;
        return {
          id: 'o1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: OrderStatus.Requested,
          buyer: { id: 'buyer' },
          seller: { id: 'seller' },
          items: [{ id: 'oi1' }],
        };
      },
      findUnique: async () =>
        options.order
          ? {
              ...options.order,
              buyer: { id: options.order.buyerCompanyId },
              seller: { id: options.order.sellerCompanyId },
              items: options.order.items ?? [],
            }
          : null,
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        captured.updateData = args.data;
        return {
          id: args.where.id,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          buyer: { id: 'buyer' },
          seller: { id: 'seller' },
          items: [],
        };
      },
    },
    orderItem: {
      update: async () => ({}),
    },
    message: {
      create: async (args: { data: Record<string, unknown> }) => {
        captured.messageCreate = args.data;
        return args.data;
      },
    },
    thread: {
      update: async () => ({}),
    },
  } as unknown as PrismaService;
  const serializer = {
    toOrderView: (order: unknown, _actor?: string, threadId?: string | null) => ({
      ...(order as object),
      threadId: threadId ?? null,
    }),
  } as unknown as OrderSerializer;
  const tradeAccess = { assertCanTrade: async () => undefined } as unknown as TradeAccess;
  return {
    service: new OrderService(prisma, serializer, tradeAccess, events, config, jobs, threads),
    captured,
  };
}

describe('OrderService.create snapshots', () => {
  it('captures an immutable product snapshot on the order line', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: ['img1'] },
      ],
    });
    const dto = {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      items: [{ productId: 'p1', quantity: 5, images: [] }],
    } as CreateOrderDto;
    await service.create('buyer', dto);
    expect(captured.createData?.items.create[0]).toMatchObject({
      productId: 'p1',
      name: 'Silk Saree',
      sku: 'S1',
      unit: 'mtr',
      image: 'img1',
      quantity: 5,
    });
  });

  it('posts an order card into the trade thread on create', async () => {
    const { service, captured } = makeService({
      products: [
        { id: 'p1', name: 'Silk Saree', sku: 'S1', rate: { toNumber: () => 100 }, unit: 'mtr', images: [] },
      ],
    });
    await service.create('buyer', {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      items: [{ productId: 'p1', quantity: 1, images: [] }],
    } as CreateOrderDto);
    expect(captured.messageCreate).toMatchObject({
      threadId: 'thread-1',
      type: 'order_card',
      referenceId: 'o1',
    });
  });

  it('rejects a line referencing a product not sold by the seller', async () => {
    const { service } = makeService({ products: [] });
    const dto = {
      sellerCompanyId: 'seller',
      kind: OrderKind.Standard,
      items: [{ productId: 'ghost', quantity: 1, images: [] }],
    } as CreateOrderDto;
    await expect(service.create('buyer', dto)).rejects.toThrow();
  });
});

describe('OrderService quote + accept', () => {
  const requested = {
    id: 'o1',
    status: OrderStatus.Requested,
    buyerCompanyId: 'buyer',
    sellerCompanyId: 'seller',
    items: [{ id: 'oi1', quantity: { toNumber: () => 2 } }],
  };

  it('lets the seller quote a requested order and posts a rate card', async () => {
    const { service, captured } = makeService({ order: requested });
    await service.quote('seller', 'o1', {
      items: [{ orderItemId: 'oi1', rate: 150 }],
      note: 'Festive rate',
    });
    expect(captured.messageCreate).toMatchObject({
      type: 'rate',
      referenceId: 'o1',
      body: 'Festive rate',
    });
  });

  it('lets the buyer accept a quote (requested → confirmed)', async () => {
    const { service, captured } = makeService({ order: requested });
    await service.acceptQuote('buyer', 'o1');
    expect(captured.updateData?.status).toBe(OrderStatus.Confirmed);
  });

  it('forbids the buyer from quoting', async () => {
    const { service } = makeService({ order: requested });
    await expect(
      service.quote('buyer', 'o1', { items: [{ orderItemId: 'oi1', rate: 10 }] }),
    ).rejects.toThrow();
  });
});

describe('OrderService state machine', () => {
  const requested = { id: 'o1', status: OrderStatus.Requested, buyerCompanyId: 'buyer', sellerCompanyId: 'seller' };

  it('lets the seller confirm a requested order', async () => {
    const { service, captured } = makeService({ order: requested });
    await service.confirm('seller', 'o1');
    expect(captured.updateData?.status).toBe(OrderStatus.Confirmed);
  });

  it('forbids the buyer from confirming', async () => {
    const { service, captured } = makeService({ order: requested });
    await expect(service.confirm('buyer', 'o1')).rejects.toThrow();
    expect(captured.updateData).toBeNull();
  });

  it('rejects dispatching an order that is not yet confirmed', async () => {
    const { service } = makeService({ order: requested });
    await expect(service.dispatch('seller', 'o1', {})).rejects.toThrow();
  });

  it('404s an order the caller is not a party to', async () => {
    const { service } = makeService({ order: requested });
    await expect(service.confirm('stranger', 'o1')).rejects.toThrow();
  });
});
