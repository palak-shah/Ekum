import { describe, expect, it, vi } from 'vitest';
import { TradeLaneTicket } from '@ekum/domain-types';
import { findAffectedDirectLinks, revokeAffectedDirectLinks } from './trade-lane-revoke';

describe('trade-lane-revoke', () => {
  it('finds Direct Links for unfollow mill or remove-follower', async () => {
    const findMany = vi.fn(async () => [{ id: 'lane-1', groupThreadId: 'g1' }]);
    const prisma = { tradeLane: { findMany } } as never;
    await findAffectedDirectLinks(prisma, 'trader', 'mill');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ticket: TradeLaneTicket.Mill,
        }),
      }),
    );
  });

  it('closes only stored groupThreadId then deletes the lane', async () => {
    const lanes = [
      {
        id: 'lane-1',
        traderCompanyId: 'trader',
        sellerCompanyId: 'mill',
        buyerCompanyId: 'buyer',
        groupThreadId: 'g1',
        ticket: TradeLaneTicket.Mill,
        reveal: true,
        updatedAt: new Date(),
        seller: { id: 'mill', name: 'Mill' },
        buyer: { id: 'buyer', name: 'Buyer' },
      },
    ];
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      tradeLane: { findMany: vi.fn(async () => lanes), deleteMany },
      thread: { updateMany },
      collection: { findMany: vi.fn(async () => []), update: vi.fn() },
    } as never;
    const result = await revokeAffectedDirectLinks(prisma, 'trader', 'mill');
    expect(result).toHaveLength(1);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['g1'] }, messagingClosedAt: null },
      }),
    );
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['lane-1'] } } });
  });

  it('is a no-op when no Direct Links remain (idempotent)', async () => {
    const prisma = {
      tradeLane: { findMany: vi.fn(async () => []), deleteMany: vi.fn() },
      thread: { updateMany: vi.fn() },
      order: { updateMany: vi.fn() },
    } as never;
    const result = await revokeAffectedDirectLinks(prisma, 'trader', 'mill');
    expect(result).toEqual([]);
    expect(prisma.tradeLane.deleteMany).not.toHaveBeenCalled();
    expect(prisma.thread.updateMany).not.toHaveBeenCalled();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });
});
