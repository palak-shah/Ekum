import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { OrderLineStatus, OrderStatus } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('OrderService.editShipment', () => {
  it('rejects when actor is not the seller', async () => {
    const service = Object.create(OrderService.prototype) as OrderService;
    (service as unknown as { loadForParty: (id: string) => Promise<unknown> }).loadForParty =
      vi.fn(async () => ({
        id: 'ord-1',
        sellerCompanyId: 'seller',
        buyerCompanyId: 'buyer',
        status: OrderStatus.PartShipped,
        seller: { name: 'Seller' },
        items: [],
        shipments: [],
      }));

    await expect(
      service.editShipment('buyer', 'u1', 'ord-1', 'ship-1', {
        items: [{ orderItemId: 'oi1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects after settle', async () => {
    const service = Object.create(OrderService.prototype) as OrderService;
    (service as unknown as { loadForParty: (id: string) => Promise<unknown> }).loadForParty =
      vi.fn(async () => ({
        id: 'ord-1',
        sellerCompanyId: 'seller',
        buyerCompanyId: 'buyer',
        status: OrderStatus.Settled,
        seller: { name: 'Seller' },
        items: [],
        shipments: [],
      }));

    await expect(
      service.editShipment('seller', 'u1', 'ord-1', 'ship-1', {
        items: [{ orderItemId: 'oi1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates items and pulses dispatch edited', async () => {
    const item = {
      id: 'oi1',
      lineStatus: OrderLineStatus.Dispatched,
      quantity: { toNumber: () => 10 },
    };
    const shipment = {
      id: 'ship-1',
      orderId: 'ord-1',
      transporter: 'X',
      lrNumber: 'LR1',
      parcelCount: 1,
      items: [{ orderItemId: 'oi1', quantity: { toNumber: () => 5 } }],
    };
    const orderRow = {
      id: 'ord-1',
      sellerCompanyId: 'seller',
      buyerCompanyId: 'buyer',
      status: OrderStatus.PartShipped,
      seller: { name: 'Seller Co' },
      items: [item],
      shipments: [shipment],
      dispatchedAt: null,
      closedAt: null,
    };

    const orderShipmentItem = { deleteMany: vi.fn(async () => ({})) };
    const orderShipment = {
      findFirst: vi.fn(async () => shipment),
      update: vi.fn(async () => shipment),
    };
    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})) };
    const prisma = {
      orderShipment,
      orderShipmentItem,
      orderItem,
      order,
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ orderShipmentItem, orderShipment }),
      ),
    };

    const trail = { append: vi.fn(async () => undefined) };
    const postOrderCard = vi.fn(async () => undefined);
    const emitAndGet = vi.fn(async () => ({ id: 'ord-1' }));
    const shippedTotals = vi.fn(() => new Map([['oi1', 4]]));
    const withActor = vi.fn(() => ({ updatedByUserId: 'u1' }));

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      prisma,
      trail,
      postOrderCard,
      emitAndGet,
      shippedTotals,
      withActor,
      loadForParty: vi.fn(async () => orderRow),
    });

    await service.editShipment('seller', 'u1', 'ord-1', 'ship-1', {
      lrNumber: 'LR2',
      items: [{ orderItemId: 'oi1', quantity: 4 }],
    });

    expect(orderShipment.update).toHaveBeenCalled();
    expect(trail.append).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'dispatch_edited' }),
    );
    expect(postOrderCard).toHaveBeenCalledWith(
      'buyer',
      'seller',
      'seller',
      expect.stringContaining('edited dispatch'),
      'ord-1',
      expect.objectContaining({ event: 'order_dispatch_edited' }),
    );
  });
});
