import { describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { OrderLineStatus, OrderStatus } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('OrderService.setLineSupply', () => {
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
      service.setLineSupply('buyer', 'u1', 'ord-1', {
        items: [{ orderItemId: 'oi1', cantSupply: true }],
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
      }));

    await expect(
      service.setLineSupply('seller', 'u1', 'ord-1', {
        items: [{ orderItemId: 'oi1', cantSupply: true }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('marks unshipped line Can’t supply and pulses chat', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton',
      lineStatus: OrderLineStatus.Confirmed,
      quantity: { toNumber: () => 20 },
      requestedQuantity: { toNumber: () => 20 },
    };
    const orderRow = {
      id: 'ord-1',
      sellerCompanyId: 'seller',
      buyerCompanyId: 'buyer',
      status: OrderStatus.Confirmed,
      seller: { name: 'Seller Co' },
      items: [item],
      shipments: [],
      dispatchedAt: null,
      closedAt: null,
    };

    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})) };
    const prisma = { orderItem, order };
    const trail = { append: vi.fn(async () => ({})) };
    const get = vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.Declined }));
    const postOrderCard = vi.fn(async () => undefined);
    const emitAndGet = vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.Declined }));
    const shippedTotals = vi.fn(() => new Map());

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi.fn(async () => orderRow),
      prisma,
      trail,
      get,
      postOrderCard,
      emitAndGet,
      shippedTotals,
      withActor: () => ({}),
    });

    await service.setLineSupply('seller', 'u1', 'ord-1', {
      items: [{ orderItemId: 'oi1', cantSupply: true }],
    });

    expect(orderItem.update).toHaveBeenCalledWith({
      where: { id: 'oi1' },
      data: { lineStatus: OrderLineStatus.Declined },
    });
    expect(postOrderCard).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      'Can’t supply',
      expect.anything(),
      expect.anything(),
    );
    expect(trail.append).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Can’t supply', detail: 'Cotton' }),
    );
  });

  it('marks partially shipped line Can’t supply as Declined (not silent Dispatched)', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton Grey Fabric',
      lineStatus: OrderLineStatus.Dispatched,
      quantity: { toNumber: () => 20 },
      requestedQuantity: { toNumber: () => 20 },
    };
    const orderRow = {
      id: 'ord-1',
      sellerCompanyId: 'seller',
      buyerCompanyId: 'buyer',
      status: OrderStatus.Dispatched,
      seller: { name: 'Seller Co' },
      items: [item],
      shipments: [{ id: 'sh1' }],
      dispatchedAt: new Date('2026-01-01'),
      closedAt: new Date('2026-01-01'),
    };

    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})) };
    const prisma = { orderItem, order };
    const trail = { append: vi.fn(async () => ({})) };
    const postOrderCard = vi.fn(async () => undefined);
    const emitAndGet = vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.Dispatched }));
    const shippedTotals = vi.fn(() => new Map([['oi1', 20]]));

    const declinedItem = {
      ...item,
      lineStatus: OrderLineStatus.Declined,
      quantity: { toNumber: () => 20 },
    };
    const after = { ...orderRow, items: [declinedItem] };

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi
        .fn()
        .mockResolvedValueOnce(orderRow)
        .mockResolvedValueOnce(after),
      prisma,
      trail,
      postOrderCard,
      emitAndGet,
      shippedTotals,
      withActor: () => ({}),
    });

    await service.setLineSupply('seller', 'u1', 'ord-1', {
      items: [{ orderItemId: 'oi1', cantSupply: true }],
    });

    expect(orderItem.update).toHaveBeenCalledWith({
      where: { id: 'oi1' },
      data: { quantity: 20, lineStatus: OrderLineStatus.Declined },
    });
    expect(order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.Dispatched }),
      }),
    );
  });

  it('restores a declined line to confirmed', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton',
      lineStatus: OrderLineStatus.Declined,
      quantity: { toNumber: () => 20 },
      requestedQuantity: { toNumber: () => 50 },
    };
    const orderRow = {
      id: 'ord-1',
      sellerCompanyId: 'seller',
      buyerCompanyId: 'buyer',
      status: OrderStatus.Confirmed,
      seller: { name: 'Seller Co' },
      items: [item],
      shipments: [],
      dispatchedAt: null,
      closedAt: null,
    };

    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})) };
    const prisma = { orderItem, order };
    const trail = { append: vi.fn(async () => ({})) };
    const postOrderCard = vi.fn(async () => undefined);
    const emitAndGet = vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.Confirmed }));

    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi.fn(async () => orderRow),
      prisma,
      trail,
      postOrderCard,
      emitAndGet,
      shippedTotals: vi.fn(() => new Map()),
      withActor: () => ({}),
    });

    await service.setLineSupply('seller', 'u1', 'ord-1', {
      items: [{ orderItemId: 'oi1', cantSupply: false }],
    });

    expect(orderItem.update).toHaveBeenCalledWith({
      where: { id: 'oi1' },
      data: {
        quantity: 50,
        lineStatus: OrderLineStatus.Confirmed,
      },
    });
    expect(trail.append).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Back on order', detail: 'Cotton' }),
    );
    expect(String(postOrderCard.mock.calls[0]?.[3] ?? '')).toBe('Back on order');
  });
});
