import { describe, expect, it, vi } from 'vitest';
import { OrderLineStatus, OrderStatus, OrderTradeMode } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('passMillLinesToParent rate non-clobber (Batch 3)', () => {
  it('does not overwrite distinct parent buyer-facing rate with mill rate', async () => {
    const mill = {
      id: 'hop-1',
      downstreamOrderId: 'parent-1',
      upstreamReleasedAt: new Date(),
      passHeldAt: null,
      status: OrderStatus.Confirmed,
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
          quantity: { toNumber: () => 10 },
          rate: { toNumber: () => 100 },
          confirmedQuantity: { toNumber: () => 10 },
          confirmedRate: { toNumber: () => 100 },
          lineStatus: OrderLineStatus.Confirmed,
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
          rate: { toNumber: () => 150 },
          confirmedQuantity: { toNumber: () => 10 },
          confirmedRate: null,
          lineStatus: OrderLineStatus.Open,
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
                lineStatus: OrderLineStatus.Confirmed,
                confirmedRate: { toNumber: () => 100 },
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

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail: { append: vi.fn(async () => undefined) },
      postOrderCard: vi.fn(async () => undefined),
      orderAudit: { appendQty: vi.fn(async () => undefined) },
      auditItem: () => ({
        orderItemId: 'p-1',
        name: 'Cotton',
        sku: 'C1',
        unit: 'set',
        qtyBefore: 10,
        qtyAfter: 10,
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
        data: expect.not.objectContaining({
          rate: mill.items[0]!.rate,
        }),
      }),
    );
    const data = orderItemUpdate.mock.calls[0]![0].data as Record<string, unknown>;
    expect(data.rate).toBeUndefined();
    expect(data.confirmedRate).toEqual(mill.items[0]!.confirmedRate);
  });

  it('copies mill rate when parent rate is still null', async () => {
    const mill = {
      id: 'hop-2',
      downstreamOrderId: 'parent-2',
      upstreamReleasedAt: new Date(),
      passHeldAt: null,
      status: OrderStatus.Confirmed,
      sellerCompanyId: 'mill',
      seller: { name: 'Mill Co' },
      items: [
        {
          id: 'h-2',
          productId: 'sku-1',
          sourceItemId: 'p-2',
          name: 'Cotton',
          quantity: { toNumber: () => 5 },
          rate: { toNumber: () => 90 },
          confirmedQuantity: { toNumber: () => 5 },
          confirmedRate: { toNumber: () => 90 },
          lineStatus: OrderLineStatus.Confirmed,
        },
      ],
    };
    const parent = {
      id: 'parent-2',
      tradeMode: OrderTradeMode.Manage,
      status: OrderStatus.Requested,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'trader',
      seller: { name: 'Trader Co' },
      items: [
        {
          id: 'p-2',
          productId: 'sku-1',
          name: 'Cotton',
          quantity: { toNumber: () => 5 },
          rate: null,
          confirmedQuantity: null,
          confirmedRate: null,
          lineStatus: OrderLineStatus.Open,
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
            items: [{ ...parent.items[0], lineStatus: OrderLineStatus.Confirmed }],
          }),
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
      auditItem: () => ({}),
    });

    await (
      service as unknown as {
        passMillLinesToParent: (
          id: string,
          actor: string,
          userId: string,
        ) => Promise<void>;
      }
    ).passMillLinesToParent('hop-2', 'mill', 'u1');

    expect(orderItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p-2' },
        data: expect.objectContaining({
          rate: mill.items[0]!.rate,
        }),
      }),
    );
  });
});
