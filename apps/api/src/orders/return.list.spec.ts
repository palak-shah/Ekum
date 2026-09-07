import { describe, expect, it } from 'vitest';
import { ReturnService } from './return.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { AuditService } from '../audit/audit.service';
import type { DomainEvents } from '../events/events.module';

describe('ReturnService.list', () => {
  it('returns a cursor page for the actor company', async () => {
    const rows = [
      {
        id: 'r1',
        orderId: 'o1',
        buyerCompanyId: 'buyer',
        sellerCompanyId: 'seller',
        status: 'requested',
      },
    ];
    const prisma = {
      return: {
        findMany: async (args: { where: { OR?: unknown } }) => {
          expect(args.where.OR).toBeTruthy();
          return rows;
        },
      },
    } as unknown as PrismaService;
    const serializer = {
      toReturnView: (entity: { id: string }, viewer: string) => ({
        id: entity.id,
        viewer,
      }),
    } as unknown as OrderSerializer;
    const service = new ReturnService(
      prisma,
      serializer,
      { record: async () => undefined } as unknown as AuditService,
      {
        returnRequested: () => undefined,
        returnDecided: () => undefined,
      } as unknown as DomainEvents,
      {
        append: async () => undefined,
      } as unknown as import('./order-trail.service').OrderTrailService,
    );

    const page = await service.list('seller', { limit: 20 });
    expect(page.results).toEqual([{ id: 'r1', viewer: 'seller' }]);
    expect(page.nextCursor).toBeNull();
  });
});
