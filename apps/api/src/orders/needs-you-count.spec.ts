import { describe, expect, it, vi } from 'vitest';
import { OrderStatus } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('OrderService.needsYouCount', () => {
  it('loads open-status orders once instead of paging list()', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const list = vi.fn();
    const svc = Object.create(OrderService.prototype) as OrderService;
    Object.assign(svc, {
      prisma: { order: { findMany } },
      list,
      orderIdsWithSellerQuote: vi.fn().mockResolvedValue(new Set()),
      parentIdsNeedingQuotePass: vi.fn().mockResolvedValue(new Set()),
      linkedMillsByParent: vi.fn().mockResolvedValue(new Map()),
      healManageParentsInList: vi.fn().mockResolvedValue(new Set()),
      serializer: { toOrderView: vi.fn() },
      buyerCanAcceptQuoteSync: vi.fn().mockReturnValue(false),
    });

    const count = await svc.needsYouCount('co-1');
    expect(count).toBe(0);
    expect(list).not.toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledTimes(1);
    const where = findMany.mock.calls[0]?.[0]?.where as {
      AND: Array<{ status?: { in: string[] } }>;
    };
    const statusFilter = where.AND.find((part) => part.status?.in)?.status?.in;
    expect(statusFilter).toEqual(
      expect.arrayContaining([
        OrderStatus.Requested,
        OrderStatus.Confirmed,
        OrderStatus.PartShipped,
      ]),
    );
  });
});
