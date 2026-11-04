import { describe, expect, it, vi } from 'vitest';
import { OrderLineStatus, OrderStatus, OrderTradeMode } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('passMillEditShipmentToParent / settle trim', () => {
  it('rebuilds hop-attributable parent shipments and leaves You LRs alone', async () => {
    const hopItems = [
      {
        id: 'h-1',
        productId: 'sku-mill',
        sourceItemId: 'p-mill',
        quantity: { toNumber: () => 6 },
        lineStatus: OrderLineStatus.Dispatched,
      },
    ];
    const hop = {
      id: 'hop-1',
      downstreamOrderId: 'parent-1',
      upstreamReleasedAt: new Date(),
      passHeldAt: null,
      sellerCompanyId: 'mill',
      seller: { name: 'Mill Co' },
      items: hopItems,
      shipments: [
        {
          id: 'hop-ship',
          dispatchedAt: new Date('2026-01-02T00:00:00Z'),
          items: [{ orderItemId: 'h-1', quantity: { toNumber: () => 6 } }],
        },
      ],
    };
    const parentItems = [
      { id: 'p-mill', productId: 'sku-mill', quantity: { toNumber: () => 10 }, lineStatus: OrderLineStatus.Confirmed },
      { id: 'p-you', productId: 'sku-you', quantity: { toNumber: () => 8 }, lineStatus: OrderLineStatus.Dispatched },
    ];
    const parentShipments = [
      {
        id: 'parent-mill-old',
        dispatchedAt: new Date('2026-01-01T00:00:00Z'),
        items: [{ id: 'psi-old', orderItemId: 'p-mill', quantity: { toNumber: () => 10 } }],
      },
      {
        id: 'parent-you',
        dispatchedAt: new Date('2026-01-01T12:00:00Z'),
        items: [{ id: 'psi-you', orderItemId: 'p-you', quantity: { toNumber: () => 8 } }],
      },
    ];
    const parent = {
      id: 'parent-1',
      tradeMode: OrderTradeMode.Manage,
      status: OrderStatus.PartShipped,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      seller: { name: 'Trader Co' },
      items: parentItems,
      shipments: parentShipments,
      dispatchedAt: null,
      closedAt: null,
    };

    const deletedShipmentIds: string[] = [];
    const createdShipments: unknown[] = [];
    const orderShipmentItem = {
      deleteMany: vi.fn(async () => ({})),
    };
    const orderShipment = {
      deleteMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        deletedShipmentIds.push(...where.id.in);
        return {};
      }),
      create: vi.fn(async ({ data }: { data: unknown }) => {
        createdShipments.push(data);
        return data;
      }),
    };
    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(hop)
          .mockResolvedValueOnce(parent)
          .mockResolvedValueOnce({
            ...parent,
            shipments: [
              parentShipments[1],
              {
                id: 'parent-mill-new',
                dispatchedAt: hop.shipments[0]!.dispatchedAt,
                items: [{ orderItemId: 'p-mill', quantity: { toNumber: () => 6 } }],
              },
            ],
            items: [
              { ...parentItems[0], lineStatus: OrderLineStatus.Dispatched, quantity: { toNumber: () => 10 } },
              parentItems[1],
            ],
          }),
        update: vi.fn(async () => ({})),
      },
      orderShipment,
      orderShipmentItem,
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderShipment, orderShipmentItem }),
      ),
    };

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      passMillLinesToParent: vi.fn(async () => undefined),
      shippedTotals: vi.fn(
        () =>
          new Map([
            ['p-mill', 6],
            ['p-you', 8],
          ]),
      ),
      withActor: vi.fn(() => ({ updatedByUserId: 'u1' })),
      config: { get: vi.fn(() => 0) },
    });

    await (
      service as unknown as {
        passMillEditShipmentToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillEditShipmentToParent('hop-1', 'mill', 'u1');

    expect(deletedShipmentIds).toEqual(['parent-mill-old']);
    expect(createdShipments).toHaveLength(1);
    expect(createdShipments[0]).toEqual(
      expect.objectContaining({
        orderId: 'parent-1',
        items: {
          create: [{ orderItemId: 'p-mill', quantity: 6 }],
        },
      }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.PartShipped }),
      }),
    );
  });

  it('trims parent shipment qty on settle when Final is below copied shipped', async () => {
    const millItems = [
      {
        id: 'h-1',
        productId: 'sku-1',
        sourceItemId: 'p-1',
        quantity: { toNumber: () => 7 },
        lineStatus: OrderLineStatus.Dispatched,
      },
    ];
    const parentItems = [
      {
        id: 'p-1',
        productId: 'sku-1',
        quantity: { toNumber: () => 10 },
        lineStatus: OrderLineStatus.Dispatched,
      },
      {
        id: 'p-you',
        productId: 'sku-you',
        quantity: { toNumber: () => 5 },
        lineStatus: OrderLineStatus.Dispatched,
      },
    ];
    const parent = {
      id: 'parent-1',
      tradeMode: OrderTradeMode.Manage,
      status: OrderStatus.PartShipped,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      seller: { name: 'Trader Co' },
      items: parentItems,
      shipments: [
        {
          id: 's-mill',
          dispatchedAt: new Date('2026-01-02T00:00:00Z'),
          items: [{ id: 'si-mill', orderItemId: 'p-1', quantity: { toNumber: () => 10 } }],
        },
        {
          id: 's-you',
          dispatchedAt: new Date('2026-01-03T00:00:00Z'),
          items: [{ id: 'si-you', orderItemId: 'p-you', quantity: { toNumber: () => 5 } }],
        },
      ],
      facilitatorCompanyId: null,
    };

    const orderShipmentItem = {
      delete: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
    };
    const orderShipment = {
      findMany: vi.fn(async () => parent.shipments),
      deleteMany: vi.fn(async () => ({})),
    };
    const orderItem = { update: vi.fn(async () => ({})) };
    const orderAudit = { appendQty: vi.fn(async () => undefined) };
    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(parent)
          .mockResolvedValueOnce({
            ...parent,
            items: [
              { ...parentItems[0], quantity: { toNumber: () => 7 } },
              parentItems[1],
            ],
            shipments: [
              {
                id: 's-mill',
                items: [{ orderItemId: 'p-1', quantity: { toNumber: () => 7 } }],
              },
              parent.shipments[1],
            ],
          }),
        findMany: vi.fn(async () => [
          {
            id: 'hop-1',
            status: OrderStatus.Settled,
            upstreamReleasedAt: new Date(),
            items: millItems,
          },
          {
            id: 'you-1',
            status: OrderStatus.Dispatched,
            upstreamReleasedAt: new Date(),
            items: [{ id: 'yh-1', sourceItemId: 'p-you', quantity: { toNumber: () => 5 } }],
          },
        ]),
        update: vi.fn(async () => ({})),
      },
      orderShipment,
      orderShipmentItem,
      orderItem,
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderItem, orderShipment, orderShipmentItem, orderAudit }),
      ),
    };

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      orderAudit,
      shippedTotals: vi.fn(
        () =>
          new Map([
            ['p-1', 7],
            ['p-you', 5],
          ]),
      ),
      withActor: vi.fn(() => ({})),
      config: { get: vi.fn(() => 0) },
      jobs: { enqueue: vi.fn(async () => undefined) },
      events: { orderStatusChanged: vi.fn() },
    });

    await (
      service as unknown as {
        syncManageParentFromMillSettle: (
          parentId: string,
          settledId: string | null,
          userId: string | null,
        ) => Promise<void>;
      }
    ).syncManageParentFromMillSettle('parent-1', 'hop-1', 'u1');

    expect(orderShipmentItem.update).toHaveBeenCalledWith({
      where: { id: 'si-mill' },
      data: { quantity: 7 },
    });
    expect(orderShipmentItem.delete).not.toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.Settled }),
      }),
    );
  });
});
