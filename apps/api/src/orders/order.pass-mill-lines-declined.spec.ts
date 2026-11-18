import { describe, expect, it, vi } from 'vitest';
import { OrderLineStatus, OrderStatus, OrderTradeMode } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('passMillLinesToParent Declined clamp (#36)', () => {
  it('copies Declined + clamped qty onto parent (mirrors setLineSupply)', async () => {
    const mill = {
      id: 'hop-1',
      downstreamOrderId: 'parent-1',
      upstreamReleasedAt: new Date(),
      passHeldAt: null,
      status: OrderStatus.PartShipped,
      sellerCompanyId: 'mill',
      seller: { name: 'Mill Co' },
      items: [
        {
          id: 'h-1',
          productId: 'sku-1',
          sourceItemId: 'p-1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'set',
          quantity: { toNumber: () => 3 },
          rate: null,
          confirmedQuantity: null,
          confirmedRate: null,
          lineStatus: OrderLineStatus.Declined,
        },
      ],
    };
    const parent = {
      id: 'parent-1',
      tradeMode: OrderTradeMode.Manage,
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      seller: { name: 'Trader Co' },
      items: [
        {
          id: 'p-1',
          productId: 'sku-1',
          name: 'Cotton',
          sku: 'C1',
          unit: 'set',
          quantity: { toNumber: () => 10 },
          rate: null,
          confirmedQuantity: { toNumber: () => 10 },
          confirmedRate: null,
          lineStatus: OrderLineStatus.Confirmed,
        },
      ],
    };

    const orderItemUpdate = vi.fn(async () => ({}));
    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(mill)
          .mockResolvedValueOnce(parent)
          .mockResolvedValueOnce({
            ...parent,
            items: [
              {
                ...parent.items[0],
                quantity: { toNumber: () => 3 },
                lineStatus: OrderLineStatus.Declined,
              },
            ],
          }),
        update: vi.fn(async () => ({})),
      },
      orderItem: { update: orderItemUpdate },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderItem: { update: orderItemUpdate } }),
      ),
    };

    const appendQty = vi.fn(async () => undefined);
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      orderAudit: { appendQty },
      auditItem: (
        item: { id: string; name?: string; sku?: string | null; unit?: string | null },
        before: number,
        after: number,
      ) => ({
        orderItemId: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        qtyBefore: before,
        qtyAfter: after,
        rateBefore: null,
        rateAfter: null,
      }),
    });

    await (
      service as unknown as {
        passMillLinesToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillLinesToParent('hop-1', 'mill', 'u1');

    expect(orderItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p-1' },
        data: expect.objectContaining({
          lineStatus: OrderLineStatus.Declined,
          quantity: mill.items[0]!.quantity,
        }),
      }),
    );
    expect(appendQty).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'parent-1',
        kind: expect.anything(),
        rows: [expect.objectContaining({ orderItemId: 'p-1', qtyBefore: 10, qtyAfter: 3 })],
      }),
    );
  });
});

describe('passMillLinesToParent Hold (#36)', () => {
  it('does not pass Declined onto parent while Hold is on', async () => {
    const mill = {
      id: 'hop-held',
      downstreamOrderId: 'parent-1',
      upstreamReleasedAt: new Date(),
      passHeldAt: new Date(),
      status: OrderStatus.PartShipped,
      sellerCompanyId: 'mill',
      seller: { name: 'Mill Co' },
      items: [
        {
          id: 'h-1',
          productId: 'sku-1',
          sourceItemId: 'p-1',
          quantity: { toNumber: () => 3 },
          lineStatus: OrderLineStatus.Declined,
        },
      ],
    };
    const orderItemUpdate = vi.fn(async () => ({}));
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValueOnce(mill),
        update: vi.fn(async () => ({})),
      },
      orderItem: { update: orderItemUpdate },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderItem: { update: orderItemUpdate } }),
      ),
    };
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      orderAudit: { appendQty: vi.fn(async () => undefined) },
    });

    await (
      service as unknown as {
        passMillLinesToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillLinesToParent('hop-held', 'mill', 'u1');

    expect(orderItemUpdate).not.toHaveBeenCalled();
    expect(prisma.order.findUnique).toHaveBeenCalledTimes(1);
  });

  it('does not pass settle onto parent while Hold is on', async () => {
    const mill = {
      id: 'hop-held-settle',
      downstreamOrderId: 'parent-1',
      upstreamReleasedAt: new Date(),
      passHeldAt: new Date(),
      status: OrderStatus.Settled,
      sellerCompanyId: 'mill',
      seller: { name: 'Mill Co' },
      items: [],
    };
    const sync = vi.fn(async () => undefined);
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma: {
        order: { findUnique: vi.fn().mockResolvedValueOnce(mill) },
      },
      syncManageParentFromMillSettle: sync,
    });

    await (
      service as unknown as {
        passMillSettleToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillSettleToParent('hop-held-settle', 'mill', 'u1');

    expect(sync).not.toHaveBeenCalled();
  });
});

describe('passMillDispatchToParent LR copy on create (#40)', () => {
  it('copies transporter / LR / legs onto parent shipment', async () => {
    const mill = {
      id: 'hop-1',
      downstreamOrderId: 'parent-1',
      upstreamReleasedAt: new Date(),
      passHeldAt: null,
      sellerCompanyId: 'mill',
      seller: { name: 'Mill Co' },
      items: [
        {
          id: 'h-1',
          productId: 'sku-1',
          sourceItemId: 'p-1',
          quantity: { toNumber: () => 5 },
          lineStatus: OrderLineStatus.Dispatched,
        },
      ],
      shipments: [
        {
          id: 'hop-ship',
          transporter: 'ABC Logistics',
          lrNumber: 'LR-440',
          parcelCount: 1,
          legs: [
            {
              lrNumber: 'LR-440',
              billNumber: null,
              imageUrls: ['https://img/lr'],
              sortOrder: 0,
            },
          ],
        },
      ],
    };
    const parent = {
      id: 'parent-1',
      tradeMode: OrderTradeMode.Manage,
      status: OrderStatus.Confirmed,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      seller: { name: 'Trader Co' },
      items: [
        {
          id: 'p-1',
          productId: 'sku-1',
          quantity: { toNumber: () => 5 },
          lineStatus: OrderLineStatus.Confirmed,
        },
      ],
    };

    const created: unknown[] = [];
    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(mill)
          .mockResolvedValueOnce(parent)
          .mockResolvedValueOnce({
            ...parent,
            items: parent.items,
            shipments: [
              {
                items: [{ orderItemId: 'p-1', quantity: { toNumber: () => 5 } }],
              },
            ],
          }),
        update: vi.fn(async () => ({})),
      },
      orderShipment: {
        create: vi.fn(async ({ data }: { data: unknown }) => {
          created.push(data);
          return data;
        }),
      },
    };

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      passMillLinesToParent: vi.fn(async () => undefined),
      shippedTotals: vi.fn(() => new Map([['p-1', 5]])),
      withActor: vi.fn(() => ({ updatedByUserId: 'u1' })),
      config: { get: vi.fn(() => 0) },
    });

    await (
      service as unknown as {
        passMillDispatchToParent: (
          id: string,
          actor: string,
          userId: string,
          candidates: Array<{ orderItemId: string; quantity: number }>,
        ) => Promise<void>;
      }
    ).passMillDispatchToParent('hop-1', 'mill', 'u1', [
      { orderItemId: 'h-1', quantity: 5 },
    ]);

    expect(created[0]).toEqual(
      expect.objectContaining({
        orderId: 'parent-1',
        transporter: 'ABC Logistics',
        lrNumber: 'LR-440',
        parcelCount: 1,
        items: {
          create: [{ orderItemId: 'p-1', quantity: 5 }],
        },
        legs: {
          create: [
            expect.objectContaining({
              lrNumber: 'LR-440',
              imageUrls: ['https://img/lr'],
              sortOrder: 0,
            }),
          ],
        },
      }),
    );
  });
});
