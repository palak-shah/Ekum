import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { OrderLineStatus, OrderStatus } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('OrderService.setLineQuantity', () => {
  it('rejects when actor is not the seller', async () => {
    const service = Object.create(OrderService.prototype) as OrderService;
    (service as unknown as { loadForParty: (id: string) => Promise<unknown> }).loadForParty =
      vi.fn(async () => ({
        id: 'ord-1',
        sellerCompanyId: 'seller',
        buyerCompanyId: 'buyer',
        status: OrderStatus.Confirmed,
        seller: { name: 'Seller' },
        items: [],
      }));

    await expect(
      service.setLineQuantity('buyer', 'u1', 'ord-1', {
        items: [{ orderItemId: 'oi1', quantity: 8 }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects qty below shipped', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton',
      lineStatus: OrderLineStatus.Confirmed,
      quantity: { toNumber: () => 20 },
      requestedQuantity: { toNumber: () => 20 },
    };
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi.fn(async () => ({
        id: 'ord-1',
        sellerCompanyId: 'seller',
        buyerCompanyId: 'buyer',
        status: OrderStatus.PartShipped,
        seller: { name: 'Seller' },
        items: [item],
        shipments: [],
      })),
      shippedTotals: vi.fn(() => new Map([['oi1', 12]])),
    });

    await expect(
      service.setLineQuantity('seller', 'u1', 'ord-1', {
        items: [{ orderItemId: 'oi1', quantity: 10 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'BELOW_SHIPPED' } });
  });

  it('raises qty on a dispatched ticket and reopens part_shipped', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton',
      lineStatus: OrderLineStatus.Dispatched,
      quantity: { toNumber: () => 10 },
      requestedQuantity: { toNumber: () => 10 },
    };
    const orderRow = {
      id: 'ord-1',
      sellerCompanyId: 'seller',
      buyerCompanyId: 'buyer',
      status: OrderStatus.Dispatched,
      seller: { name: 'Seller Co' },
      items: [item],
      shipments: [],
      dispatchedAt: new Date('2026-10-01'),
      closedAt: new Date('2026-10-01'),
    };
    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})) };
    const raised = {
      ...orderRow,
      items: [
        {
          ...item,
          quantity: { toNumber: () => 14 },
          lineStatus: OrderLineStatus.Confirmed,
        },
      ],
    };
    let loads = 0;
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi.fn(async () => {
        loads += 1;
        return loads === 1 ? orderRow : raised;
      }),
      prisma: { orderItem, order },
      trail: { append: vi.fn(async () => ({})) },
      postOrderCard: vi.fn(async () => undefined),
      emitAndGet: vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.PartShipped })),
      shippedTotals: vi.fn(() => new Map([['oi1', 10]])),
      withActor: () => ({}),
    });

    await service.setLineQuantity('seller', 'u1', 'ord-1', {
      items: [{ orderItemId: 'oi1', quantity: 14 }],
    });

    expect(orderItem.update).toHaveBeenCalledWith({
      where: { id: 'oi1' },
      data: { quantity: 14, lineStatus: OrderLineStatus.Confirmed },
    });
    expect(order.update).toHaveBeenCalledWith({
      where: { id: 'ord-1' },
      data: expect.objectContaining({
        status: OrderStatus.PartShipped,
        dispatchedAt: null,
        closedAt: null,
      }),
    });
  });
});
