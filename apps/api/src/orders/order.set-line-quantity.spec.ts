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
    const prisma = {
      orderItem: { update: vi.fn() },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
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
      prisma,
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
    const prisma = { orderItem, order, $transaction: vi.fn() };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
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
      prisma,
      trail: { append: vi.fn(async () => ({})) },
      writeQtyAudit: vi.fn(async () => undefined),
      postOrderCard: vi.fn(async () => undefined),
      emitAndGet: vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.PartShipped })),
      shippedTotals: vi.fn(() => new Map([['oi1', 10]])),
      passMillLinesToParent: vi.fn(async () => undefined),
      withActor: () => ({}),
    });

    await service.setLineQuantity('seller', 'u1', 'ord-1', {
      items: [{ orderItemId: 'oi1', quantity: 14 }],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

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
    expect(service['trail'].append).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'Updated qty · 10 → 14',
        payload: {
          items: [{ orderItemId: 'oi1', field: 'quantity', before: 10, after: 14 }],
        },
      }),
    );
    expect(service['writeQtyAudit']).toHaveBeenCalledWith(
      expect.anything(),
      'seller',
      'u1',
      'seller_edit',
      [expect.objectContaining({ orderItemId: 'oi1', qtyBefore: 10, qtyAfter: 14 })],
      expect.objectContaining({ statusAt: OrderStatus.Dispatched, tx: prisma }),
    );
  });

  it('edits live qty 50→45 on part_shipped without touching requestedQuantity', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton Lawn',
      sku: 'CL-1',
      unit: 'pc',
      lineStatus: OrderLineStatus.Confirmed,
      quantity: { toNumber: () => 50 },
      requestedQuantity: { toNumber: () => 50 },
    };
    const orderRow = {
      id: 'ord-1',
      sellerCompanyId: 'seller',
      buyerCompanyId: 'buyer',
      status: OrderStatus.PartShipped,
      seller: { name: 'Seller Co' },
      items: [item],
      shipments: [],
    };
    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})), create: vi.fn() };
    const prisma = { orderItem, order, $transaction: vi.fn() };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    const edited = {
      ...orderRow,
      items: [{ ...item, quantity: { toNumber: () => 45 } }],
    };
    let loads = 0;
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi.fn(async () => {
        loads += 1;
        return loads === 1 ? orderRow : edited;
      }),
      prisma,
      trail: { append: vi.fn(async () => ({})) },
      writeQtyAudit: vi.fn(async () => undefined),
      postOrderCard: vi.fn(async () => undefined),
      emitAndGet: vi.fn(async () => ({ id: 'ord-1', status: OrderStatus.PartShipped })),
      shippedTotals: vi.fn(() => new Map([['oi1', 30]])),
      passMillLinesToParent: vi.fn(async () => undefined),
      withActor: () => ({}),
    });

    await service.setLineQuantity('seller', 'u1', 'ord-1', {
      items: [{ orderItemId: 'oi1', quantity: 45 }],
    });

    expect(orderItem.update).toHaveBeenCalledWith({
      where: { id: 'oi1' },
      data: { quantity: 45, lineStatus: OrderLineStatus.Confirmed },
    });
    expect(orderItem.update.mock.calls[0]?.[0]?.data?.requestedQuantity).toBeUndefined();
    expect(order.create).not.toHaveBeenCalled();
    expect(service['writeQtyAudit']).toHaveBeenCalledWith(
      expect.anything(),
      'seller',
      'u1',
      'seller_edit',
      [
        expect.objectContaining({
          orderItemId: 'oi1',
          itemName: 'Cotton Lawn',
          qtyBefore: 50,
          qtyAfter: 45,
        }),
      ],
      expect.objectContaining({ statusAt: OrderStatus.PartShipped, tx: prisma }),
    );
  });

  it('shares one $transaction for the qty write and audit, and rejects if audit throws', async () => {
    const item = {
      id: 'oi1',
      name: 'Cotton',
      lineStatus: OrderLineStatus.Confirmed,
      quantity: { toNumber: () => 50 },
      requestedQuantity: { toNumber: () => 50 },
    };
    const orderItem = { update: vi.fn(async () => ({})) };
    const order = { update: vi.fn(async () => ({})) };
    const prisma = { orderItem, order, $transaction: vi.fn() };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    const writeQtyAudit = vi.fn(async () => {
      throw new Error('audit failed');
    });
    const service = Object.create(OrderService.prototype) as OrderService;
    Object.assign(service, {
      loadForParty: vi.fn(async () => ({
        id: 'ord-1',
        sellerCompanyId: 'seller',
        buyerCompanyId: 'buyer',
        status: OrderStatus.Confirmed,
        seller: { name: 'Seller Co' },
        items: [item],
        shipments: [],
      })),
      prisma,
      trail: { append: vi.fn(async () => ({})) },
      writeQtyAudit,
      postOrderCard: vi.fn(async () => undefined),
      emitAndGet: vi.fn(),
      shippedTotals: vi.fn(() => new Map()),
      passMillLinesToParent: vi.fn(async () => undefined),
      withActor: () => ({}),
    });

    await expect(
      service.setLineQuantity('seller', 'u1', 'ord-1', {
        items: [{ orderItemId: 'oi1', quantity: 45 }],
      }),
    ).rejects.toThrow('audit failed');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(orderItem.update).toHaveBeenCalled();
    expect(writeQtyAudit).toHaveBeenCalledWith(
      expect.anything(),
      'seller',
      'u1',
      'seller_edit',
      [expect.objectContaining({ orderItemId: 'oi1', qtyBefore: 50, qtyAfter: 45 })],
      expect.objectContaining({ tx: prisma }),
    );
    expect(order.update).not.toHaveBeenCalled();
  });
});
