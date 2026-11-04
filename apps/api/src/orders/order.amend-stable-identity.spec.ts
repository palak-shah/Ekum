import { describe, expect, it, vi } from 'vitest';
import { OrderStatus, OrderTradeMode } from '@ekum/domain-types';
import { OrderService } from './order.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { TradeAccess } from './trade-access';
import type { DomainEvents } from '../events/events.module';
import type { JobQueue } from '../jobs/job-queue.service';
import type { Env } from '../core/config/config.schema';
import type { ConfigService } from '@nestjs/config';
import type { ThreadService } from '../conversation/thread.service';

function bareService(prisma: PrismaService) {
  const trail = {
    append: async () => undefined,
    listForViewer: async () => [],
    backfillFromOrder: async () => undefined,
  } as unknown as import('./order-trail.service').OrderTrailService;
  return new OrderService(
    prisma,
    { toOrderView: (o: unknown) => o } as unknown as OrderSerializer,
    { assertCanTrade: async () => undefined } as unknown as TradeAccess,
    {
      orderCreated: () => undefined,
      orderStatusChanged: () => undefined,
      messageSent: () => undefined,
    } as unknown as DomainEvents,
    { get: () => 7 } as unknown as ConfigService<Env, true>,
    { enqueue: async () => 'job-1' } as unknown as JobQueue,
    {
      ensureTradeThread: async () => 't1',
      findDirectThreadId: async () => 't1',
      ensureTradeLaneGroup: async () => 'g1',
      notifyUserIdsForMessage: async () => ({ companyIds: [], userIds: [] }),
    } as unknown as ThreadService,
    trail,
    { appendQty: async () => undefined } as never,
  );
}

describe('G-008 syncHopsAfterBuyerAmend', () => {
  it('prefers sourceItemId and never swaps duplicate SKUs', async () => {
    const updates: Array<{ id: string; sourceItemId?: string | null; quantity?: unknown }> = [];
    const parent = {
      id: 'down-1',
      tradeMode: OrderTradeMode.Manage,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      buyer: { name: 'Buyer' },
      items: [
        {
          id: 'pi-a',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 11 },
          rate: null,
          image: null,
          images: [] as string[],
          note: null,
        },
        {
          id: 'pi-b',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 20 },
          rate: null,
          image: null,
          images: [] as string[],
          note: null,
        },
      ],
    };
    const hop = {
      id: 'up-1',
      status: OrderStatus.Requested,
      passHeldAt: null,
      buyerCompanyId: 'trader',
      sellerCompanyId: 'mill',
      downstreamOrderId: 'down-1',
      seller: { name: 'Mill' },
      items: [
        {
          id: 'ui-a',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 10 },
          sourceItemId: 'pi-a',
        },
        {
          id: 'ui-b',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 20 },
          sourceItemId: 'pi-b',
        },
      ],
    };
    const prisma = {
      order: {
        findMany: vi.fn(async () => [hop]),
        create: vi.fn(),
      },
      orderItem: {
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          updates.push({ id: where.id, ...data });
          return {};
        }),
        delete: vi.fn(),
        create: vi.fn(),
      },
      product: {
        findMany: vi.fn(async () => [{ id: 'p1', companyId: 'mill' }]),
      },
      tradeLane: { upsert: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const svc = bareService(prisma);
    await (
      svc as unknown as {
        syncHopsAfterBuyerAmend: (
          tx: unknown,
          input: {
            parent: typeof parent;
            deletedParentIds: Set<string>;
            newlyCreatedParentIds: Set<string>;
            actorCompanyId: string;
          },
        ) => Promise<void>;
      }
    ).syncHopsAfterBuyerAmend(prisma, {
      parent,
      deletedParentIds: new Set(),
      newlyCreatedParentIds: new Set(),
      actorCompanyId: 'buyer',
    });

    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ui-a', sourceItemId: 'pi-a', quantity: parent.items[0]!.quantity }),
        expect.objectContaining({ id: 'ui-b', sourceItemId: 'pi-b', quantity: parent.items[1]!.quantity }),
      ]),
    );
    expect(prisma.orderItem.create).not.toHaveBeenCalled();
    expect(prisma.orderItem.delete).not.toHaveBeenCalled();
  });

  it('deletes mapped held-hop lines when parent lines are removed without releasing', async () => {
    const deleted: string[] = [];
    const parent = {
      id: 'down-1',
      tradeMode: OrderTradeMode.Manage,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      buyer: { name: 'Buyer' },
      items: [
        {
          id: 'pi-keep',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 10 },
          rate: null,
          image: null,
          images: [] as string[],
          note: null,
        },
      ],
    };
    const hop = {
      id: 'up-held',
      status: OrderStatus.Requested,
      passHeldAt: new Date('2026-11-01T00:00:00Z'),
      buyerCompanyId: 'trader',
      sellerCompanyId: 'mill',
      downstreamOrderId: 'down-1',
      seller: { name: 'Mill' },
      items: [
        {
          id: 'ui-keep',
          productId: 'p1',
          name: 'Cotton',
          quantity: { toNumber: () => 10 },
          sourceItemId: 'pi-keep',
        },
        {
          id: 'ui-drop',
          productId: 'p2',
          name: 'Lawn',
          quantity: { toNumber: () => 5 },
          sourceItemId: 'pi-gone',
        },
      ],
    };
    const prisma = {
      order: {
        findMany: vi.fn(async () => [hop]),
        create: vi.fn(),
        update: vi.fn(),
      },
      orderItem: {
        update: vi.fn(async () => ({})),
        delete: vi.fn(async ({ where }: { where: { id: string } }) => {
          deleted.push(where.id);
          return {};
        }),
        create: vi.fn(),
      },
      product: {
        findMany: vi.fn(async () => [{ id: 'p1', companyId: 'mill' }]),
      },
      tradeLane: { upsert: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const svc = bareService(prisma);
    await (
      svc as unknown as {
        syncHopsAfterBuyerAmend: (
          tx: unknown,
          input: {
            parent: typeof parent;
            deletedParentIds: Set<string>;
            newlyCreatedParentIds: Set<string>;
            actorCompanyId: string;
          },
        ) => Promise<void>;
      }
    ).syncHopsAfterBuyerAmend(prisma, {
      parent,
      deletedParentIds: new Set(['pi-gone']),
      newlyCreatedParentIds: new Set(),
      actorCompanyId: 'buyer',
    });

    expect(deleted).toEqual(['ui-drop']);
    expect(prisma.orderItem.create).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('creates new hop lines only for the fulfilment owner and never rematches onto existing lines', async () => {
    const created: Array<Record<string, unknown>> = [];
    const parent = {
      id: 'down-1',
      tradeMode: OrderTradeMode.Manage,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      buyer: { name: 'Buyer' },
      items: [
        {
          id: 'pi-old',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 10 },
          rate: null,
          image: null,
          images: [] as string[],
          note: null,
        },
        {
          id: 'pi-new',
          productId: 'p1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'pc',
          quantity: { toNumber: () => 4 },
          rate: null,
          image: null,
          images: [] as string[],
          note: null,
        },
        {
          id: 'pi-you',
          productId: 'p-you',
          name: 'Leftover',
          sku: 'Y1',
          unit: 'pc',
          quantity: { toNumber: () => 3 },
          rate: null,
          image: null,
          images: [] as string[],
          note: null,
        },
      ],
    };
    const millHop = {
      id: 'up-mill',
      status: OrderStatus.Requested,
      passHeldAt: null,
      buyerCompanyId: 'trader',
      sellerCompanyId: 'mill',
      downstreamOrderId: 'down-1',
      seller: { name: 'Mill' },
      items: [
        {
          id: 'ui-old',
          productId: 'p1',
          name: 'Cotton',
          quantity: { toNumber: () => 10 },
          sourceItemId: 'pi-old',
        },
      ],
    };
    const youHop = {
      id: 'up-you',
      status: OrderStatus.Requested,
      passHeldAt: null,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      downstreamOrderId: 'down-1',
      seller: { name: 'Trader' },
      items: [] as Array<{
        id: string;
        productId: string;
        name: string;
        quantity: { toNumber: () => number };
        sourceItemId: string | null;
      }>,
    };
    const prisma = {
      order: {
        findMany: vi.fn(async () => [millHop, youHop]),
        create: vi.fn(),
      },
      orderItem: {
        update: vi.fn(async () => ({})),
        delete: vi.fn(),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          created.push(data);
          return { id: `new-${created.length}` };
        }),
      },
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 'mill' },
          { id: 'p-you', companyId: 'trader' },
        ]),
      },
      tradeLane: { upsert: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const svc = bareService(prisma);
    await (
      svc as unknown as {
        syncHopsAfterBuyerAmend: (
          tx: unknown,
          input: {
            parent: typeof parent;
            deletedParentIds: Set<string>;
            newlyCreatedParentIds: Set<string>;
            actorCompanyId: string;
          },
        ) => Promise<void>;
      }
    ).syncHopsAfterBuyerAmend(prisma, {
      parent,
      deletedParentIds: new Set(),
      newlyCreatedParentIds: new Set(['pi-new', 'pi-you']),
      actorCompanyId: 'buyer',
    });

    expect(created).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: 'up-mill', sourceItemId: 'pi-new', productId: 'p1' }),
        expect.objectContaining({ orderId: 'up-you', sourceItemId: 'pi-you', productId: 'p-you' }),
      ]),
    );
    expect(created).toHaveLength(2);
    expect(prisma.orderItem.delete).not.toHaveBeenCalled();
  });
});
