import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrderIntent, OrderKind, type CreateOrdersBatchDto, type OrderView } from '@ekum/domain-types';
import { OrderService } from './order.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { OrderSerializer } from './order.serializer';
import type { TradeAccess } from './trade-access';
import type { DomainEvents } from '../events/events.module';
import type { JobQueue } from '../jobs/job-queue.service';
import type { Env } from '../core/config/config.schema';
import type { ConfigService } from '@nestjs/config';
import type { ThreadService } from '../conversation/thread.service';
import type { OrderTrailService } from './order-trail.service';

const stubTrail = {
  append: async () => undefined,
  listForViewer: async () => [],
  backfillFromOrder: async () => undefined,
} as unknown as OrderTrailService;

describe('OrderService.createBatch', () => {
  it('splits lines by product owner and continues after one failure', async () => {
    const prisma = {
      product: {
        findMany: vi.fn(async () => [
          { id: 'p1', companyId: 'seller-a', company: { name: 'Ahmedabad Loom Co' } },
          { id: 'p2', companyId: 'seller-b', company: { name: 'Jaipur Emporium' } },
        ]),
      },
    } as unknown as PrismaService;

    const service = new OrderService(
      prisma,
      {} as OrderSerializer,
      {} as TradeAccess,
      {} as DomainEvents,
      {} as ConfigService<Env, true>,
      {} as JobQueue,
      {} as ThreadService,
      stubTrail,
    );

    const create = vi
      .spyOn(service, 'create')
      .mockImplementation(async (_actor, _user, dto) => {
        if (dto.sellerCompanyId === 'seller-b') {
          throw new BadRequestException({ code: 'NOT_CONNECTED', message: 'Connect first.' });
        }
        return {
          id: `order-${dto.sellerCompanyId}`,
          sellerCompanyId: dto.sellerCompanyId,
          sellerName: 'Ahmedabad Loom Co',
          threadId: `thread-${dto.sellerCompanyId}`,
        } as OrderView;
      });

    const dto: CreateOrdersBatchDto = {
      kind: OrderKind.Standard,
      intent: OrderIntent.Order,
      items: [
        { productId: 'p1', quantity: 10, images: [] },
        { productId: 'p2', quantity: 15, images: [] },
      ],
    };

    const result = await service.createBatch('buyer', 'user-1', dto);

    expect(create).toHaveBeenCalledTimes(2);
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]?.sellerCompanyId).toBe('seller-a');
    expect(result.failures).toEqual([
      {
        sellerCompanyId: 'seller-b',
        sellerName: 'Jaipur Emporium',
        productIds: ['p2'],
        code: 'NOT_CONNECTED',
        message: 'Connect first.',
      },
    ]);
  });
});
