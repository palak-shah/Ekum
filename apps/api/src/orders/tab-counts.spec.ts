import { describe, expect, it, vi } from 'vitest';
import { OrderStatus } from '@ekum/domain-types';
import { OrderService } from './order.service';

describe('OrderService.tabCounts', () => {
  it('counts pending and completed with party + hide rules (selling)', async () => {
    const count = vi.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(3);
    const findMany = vi.fn().mockResolvedValue([]);
    const svc = Object.create(OrderService.prototype) as OrderService;
    Object.assign(svc, {
      prisma: { order: { count, findMany } },
      orderIdsWithSellerQuote: vi.fn().mockResolvedValue(new Set()),
      parentIdsNeedingQuotePass: vi.fn().mockResolvedValue(new Set()),
      linkedMillsByParent: vi.fn().mockResolvedValue(new Map()),
      healOpenTicketsInList: vi.fn().mockResolvedValue(new Set()),
      serializer: { toOrderView: vi.fn() },
      buyerCanAcceptQuoteSync: vi.fn().mockReturnValue(false),
    });

    const result = await svc.tabCounts('co-1', { tab: 'selling' });
    expect(result).toEqual({ pending: 12, completed: 3, needsYou: 0 });
    expect(count).toHaveBeenCalledTimes(2);

    const pendingWhere = count.mock.calls[0]?.[0]?.where as {
      AND: Array<{
        status?: { in: string[] };
        AND?: Array<{ sellerCompanyId?: string }>;
      }>;
    };
    const statusPart = pendingWhere.AND.find((part) => part.status?.in);
    expect(statusPart?.status?.in).toEqual(
      expect.arrayContaining([
        OrderStatus.Requested,
        OrderStatus.Confirmed,
        OrderStatus.PartShipped,
      ]),
    );
    const partyNest = pendingWhere.AND.find((part) => part.AND);
    expect(partyNest?.AND?.some((part) => part.sellerCompanyId === 'co-1')).toBe(true);
  });

  it('sums samples + complaints for Others', async () => {
    const sampleCount = vi
      .fn()
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    const complaintCount = vi
      .fn()
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    const svc = Object.create(OrderService.prototype) as OrderService;
    Object.assign(svc, {
      prisma: {
        sample: { count: sampleCount },
        complaint: { count: complaintCount },
      },
    });

    const result = await svc.tabCounts('co-1', { tab: 'others' });
    expect(result).toEqual({ pending: 5, completed: 5, needsYou: 3 });
  });
});
