import { describe, expect, it, vi } from 'vitest';
import { OrderLineStatus, OrderStatus, OrderTradeMode } from '@ekum/domain-types';
import { OrderService } from './order.service';

type SyncFn = (
  parentId: string,
  settledId: string | null,
  userId: string | null,
) => Promise<void>;

function callSync(service: OrderService, ...args: Parameters<SyncFn>) {
  return (
    service as unknown as { syncManageParentFromMillSettle: SyncFn }
  ).syncManageParentFromMillSettle(...args);
}

/** Parent with mills done but fulfilment leftover — heal used to re-write part_shipped. */
function buildSyncHarness(parentStatus: OrderStatus) {
  const parentItems = [
    {
      id: 'p-1',
      productId: 'sku-1',
      quantity: { toNumber: () => 10 },
      lineStatus: OrderLineStatus.Confirmed,
    },
  ];
  const parentBase = {
    id: 'parent-1',
    tradeMode: OrderTradeMode.Manage,
    status: parentStatus,
    sellerCompanyId: 'trader',
    seller: { name: 'Trader Co' },
    items: parentItems,
    shipments: [
      {
        id: 'ship-1',
        items: [{ id: 'si-1', orderItemId: 'p-1', quantity: { toNumber: () => 4 } }],
      },
    ],
  };

  const orderItem = {
    update: vi.fn(async () => ({})),
  };
  const orderShipment = {
    findMany: vi.fn(async () => []),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };
  const orderShipmentItem = {
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  };
  const orderAudit = {
    appendQty: vi.fn(async () => undefined),
  };

  const prisma = {
    order: {
      findUnique: vi
        .fn()
        .mockResolvedValueOnce(parentBase)
        .mockResolvedValue({ ...parentBase }),
      findMany: vi.fn(async () => [
        {
          id: 'hop-1',
          status: OrderStatus.Settled,
          upstreamReleasedAt: new Date(),
          items: [],
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
    shippedTotals: vi.fn(() => new Map([['p-1', 4]])),
    withActor: vi.fn(() => ({})),
    config: { get: vi.fn(() => 0) },
    jobs: { enqueue: vi.fn(async () => undefined) },
    events: { orderStatusChanged: vi.fn() },
    auditItem: vi.fn((item: unknown, before: number, after: number) => ({
      item,
      before,
      after,
    })),
  });

  return { service, prisma };
}

describe('syncManageParentFromMillSettle — no sticky just now', () => {
  it('does not re-write already PartShipped (would bump @updatedAt on every heal)', async () => {
    const { service, prisma } = buildSyncHarness(OrderStatus.PartShipped);
    await callSync(service, 'parent-1', null, null);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('promotes Confirmed → PartShipped once when mills done and fulfilment remains', async () => {
    const { service, prisma } = buildSyncHarness(OrderStatus.Confirmed);
    await callSync(service, 'parent-1', null, null);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'parent-1' },
        data: expect.objectContaining({ status: OrderStatus.PartShipped }),
      }),
    );
  });
});
