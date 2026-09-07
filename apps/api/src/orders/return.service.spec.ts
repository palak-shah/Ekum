import { describe, expect, it, vi } from 'vitest';
import {
  OrderChatEvent,
  OrderStatus,
  ReturnStatus,
  type ApproveReturnDto,
} from '@ekum/domain-types';
import { ReturnService } from './return.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { AuditService } from '../audit/audit.service';
import type { DomainEvents } from '../events/events.module';
import type { OrderService } from './order.service';

const audit = { record: async () => undefined } as unknown as AuditService;
const serializer = {
  toReturnView: (entity: unknown) => entity,
} as unknown as OrderSerializer;
const events = {
  returnRequested: () => undefined,
  returnDecided: () => undefined,
} as unknown as DomainEvents;

const trail = {
  append: async () => undefined,
  listForViewer: async () => [],
  backfillFromOrder: async () => undefined,
} as unknown as import('./order-trail.service').OrderTrailService;

function decimal(value: number) {
  return { toNumber: () => value };
}

function makeOrders() {
  const postLifecycleCard = vi.fn(async () => 'msg-1');
  return {
    orders: { postLifecycleCard } as unknown as OrderService,
    postLifecycleCard,
  };
}

describe('ReturnService.create', () => {
  it('rejects a return against an order that is not delivered', async () => {
    const { orders } = makeOrders();
    const prisma = {
      order: {
        findUnique: async () => ({
          id: 'o1',
          status: OrderStatus.Confirmed,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [{ id: 'oi1', name: 'Silk', quantity: decimal(10) }],
        }),
      },
    } as unknown as PrismaService;
    const service = new ReturnService(prisma, serializer, audit, events, trail, orders);
    await expect(
      service.create('buyer', { orderId: 'o1', items: [{ orderItemId: 'oi1', quantity: 2 }] }),
    ).rejects.toThrow();
  });

  it('rejects a return quantity greater than the ordered quantity', async () => {
    const { orders } = makeOrders();
    const prisma = {
      order: {
        findUnique: async () => ({
          id: 'o1',
          status: OrderStatus.Delivered,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [{ id: 'oi1', name: 'Silk', quantity: decimal(3) }],
        }),
      },
    } as unknown as PrismaService;
    const service = new ReturnService(prisma, serializer, audit, events, trail, orders);
    await expect(
      service.create('buyer', { orderId: 'o1', items: [{ orderItemId: 'oi1', quantity: 5 }] }),
    ).rejects.toThrow();
  });

  it('posts a living return_raised chat card for the seller thread', async () => {
    const { orders, postLifecycleCard } = makeOrders();
    const prisma = {
      order: {
        findUnique: async () => ({
          id: 'o1',
          status: OrderStatus.Settled,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          returnWindowClosesAt: new Date(Date.now() + 86_400_000),
          items: [{ id: 'oi1', name: 'Silk', quantity: decimal(10) }],
        }),
      },
      return: {
        create: async () => ({
          id: 'r1',
          orderId: 'o1',
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          status: ReturnStatus.Requested,
          reason: 'Wrong shade',
          items: [{ id: 'ri1' }],
          order: {
            status: OrderStatus.Settled,
            buyer: { name: 'Ahmedabad Loom Co' },
            seller: { name: 'Surat Silk House' },
          },
        }),
      },
    } as unknown as PrismaService;
    const service = new ReturnService(prisma, serializer, audit, events, trail, orders);
    await service.create('buyer', {
      orderId: 'o1',
      reason: 'Wrong shade',
      items: [{ orderItemId: 'oi1', quantity: 2 }],
    });
    expect(postLifecycleCard).toHaveBeenCalledWith(
      'buyer',
      'seller',
      'buyer',
      'Wrong shade',
      'o1',
      expect.objectContaining({
        event: OrderChatEvent.ReturnRaised,
        actorRole: 'buyer',
        itemCount: 1,
        returnId: 'r1',
      }),
    );
  });
});

describe('ReturnService.approve', () => {
  function makeService(overrides: { itemUpdate?: unknown[] } = {}) {
    const capturedReturnUpdate: { status?: string } = {};
    const { orders, postLifecycleCard } = makeOrders();
    const prisma = {
      return: {
        findUnique: async () => ({
          id: 'r1',
          orderId: 'o1',
          status: ReturnStatus.Requested,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [{ id: 'ri1', requestedQuantity: decimal(5), approvedQuantity: null }],
          order: {
            status: OrderStatus.Settled,
            buyer: { name: 'Ahmedabad Loom Co' },
            seller: { name: 'Surat Silk House' },
          },
        }),
        update: (args: { data: { status?: string } }) => {
          capturedReturnUpdate.status = args.data.status;
          return Promise.resolve({});
        },
      },
      returnItem: { update: () => Promise.resolve({}) },
      $transaction: async (operations: Promise<unknown>[]) => {
        overrides.itemUpdate?.push(...operations);
        return Promise.all(operations);
      },
    } as unknown as PrismaService;
    return {
      service: new ReturnService(prisma, serializer, audit, events, trail, orders),
      capturedReturnUpdate,
      postLifecycleCard,
    };
  }

  it('approves in full when no per-item quantities are given', async () => {
    const { service, capturedReturnUpdate, postLifecycleCard } = makeService();
    await service.approve('seller', 'r1', {} as ApproveReturnDto);
    expect(capturedReturnUpdate.status).toBe(ReturnStatus.Approved);
    expect(postLifecycleCard).not.toHaveBeenCalled();
  });

  it('marks partially_approved when a line is approved below requested', async () => {
    const { service, capturedReturnUpdate, postLifecycleCard } = makeService();
    await service.approve('seller', 'r1', {
      items: [{ returnItemId: 'ri1', approvedQuantity: 2 }],
    });
    expect(capturedReturnUpdate.status).toBe(ReturnStatus.PartiallyApproved);
    expect(postLifecycleCard).not.toHaveBeenCalled();
  });

  it('forbids the buyer from approving their own return', async () => {
    const { service } = makeService();
    await expect(service.approve('buyer', 'r1', {} as ApproveReturnDto)).rejects.toThrow();
  });
});
