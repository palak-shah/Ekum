import { describe, expect, it } from 'vitest';
import { OrderStatus, ReturnStatus, type ApproveReturnDto } from '@ekum/domain-types';
import { ReturnService } from './return.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { AuditService } from '../audit/audit.service';
import type { DomainEvents } from '../events/events.module';

const audit = { record: async () => undefined } as unknown as AuditService;
const serializer = { toReturnView: (entity: unknown) => entity } as unknown as OrderSerializer;
const events = {
  returnRequested: () => undefined,
  returnDecided: () => undefined,
} as unknown as DomainEvents;

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('ReturnService.create', () => {
  it('rejects a return against an order that is not delivered', async () => {
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
    const service = new ReturnService(prisma, serializer, audit, events);
    await expect(
      service.create('buyer', { orderId: 'o1', items: [{ orderItemId: 'oi1', quantity: 2 }] }),
    ).rejects.toThrow();
  });

  it('rejects a return quantity greater than the ordered quantity', async () => {
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
    const service = new ReturnService(prisma, serializer, audit, events);
    await expect(
      service.create('buyer', { orderId: 'o1', items: [{ orderItemId: 'oi1', quantity: 5 }] }),
    ).rejects.toThrow();
  });
});

describe('ReturnService.approve', () => {
  function makeService(overrides: { itemUpdate?: unknown[] } = {}) {
    const capturedReturnUpdate: { status?: string } = {};
    const prisma = {
      return: {
        findUnique: async () => ({
          id: 'r1',
          status: ReturnStatus.Requested,
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'seller',
          items: [{ id: 'ri1', requestedQuantity: decimal(5), approvedQuantity: null }],
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
    return { service: new ReturnService(prisma, serializer, audit, events), capturedReturnUpdate };
  }

  it('approves in full when no per-item quantities are given', async () => {
    const { service, capturedReturnUpdate } = makeService();
    await service.approve('seller', 'r1', {} as ApproveReturnDto);
    expect(capturedReturnUpdate.status).toBe(ReturnStatus.Approved);
  });

  it('marks partially_approved when a line is approved below requested', async () => {
    const { service, capturedReturnUpdate } = makeService();
    await service.approve('seller', 'r1', {
      items: [{ returnItemId: 'ri1', approvedQuantity: 2 }],
    });
    expect(capturedReturnUpdate.status).toBe(ReturnStatus.PartiallyApproved);
  });

  it('forbids the buyer from approving their own return', async () => {
    const { service } = makeService();
    await expect(service.approve('buyer', 'r1', {} as ApproveReturnDto)).rejects.toThrow();
  });
});
