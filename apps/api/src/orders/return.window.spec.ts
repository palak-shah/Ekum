import { describe, expect, it, vi } from 'vitest';
import type { HttpException } from '@nestjs/common';
import { OrderStatus } from '@ekum/domain-types';
import { ReturnService } from './return.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { AuditService } from '../audit/audit.service';
import type { DomainEvents } from '../events/events.module';

function makeService(returnWindowClosesAt: Date | null) {
  const create = vi.fn(async () => ({ id: 'r1', items: [] }));
  const prisma = {
    order: {
      findUnique: async () => ({
        id: 'o1',
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        status: OrderStatus.Delivered,
        returnWindowClosesAt,
        items: [{ id: 'oi1', name: 'Saree', quantity: { toNumber: () => 10 } }],
      }),
    },
    return: { create },
  } as unknown as PrismaService;
  const serializer = { toReturnView: (row: unknown) => row } as unknown as OrderSerializer;
  const audit = { record: vi.fn(async () => undefined) } as unknown as AuditService;
  const events = { returnRequested: vi.fn() } as unknown as DomainEvents;
  return { service: new ReturnService(prisma, serializer, audit, events), create };
}

const dto = { orderId: 'o1', items: [{ orderItemId: 'oi1', quantity: 2 }] };

describe('ReturnService return-window enforcement', () => {
  it('rejects a return once the window has closed', async () => {
    const { service, create } = makeService(new Date(Date.now() - 60_000));
    try {
      await service.create('buyer', dto);
      throw new Error('expected rejection');
    } catch (error) {
      const response = (error as HttpException).getResponse() as { code?: string };
      expect(response.code).toBe('RETURN_WINDOW_CLOSED');
    }
    expect(create).not.toHaveBeenCalled();
  });

  it('allows a return while the window is still open', async () => {
    const { service, create } = makeService(new Date(Date.now() + 60_000));
    await service.create('buyer', dto);
    expect(create).toHaveBeenCalled();
  });

  it('allows a return when no window was recorded', async () => {
    const { service, create } = makeService(null);
    await service.create('buyer', dto);
    expect(create).toHaveBeenCalled();
  });
});
