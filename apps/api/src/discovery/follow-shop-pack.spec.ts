import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FollowAccessKind } from '@ekum/domain-types';
import { FollowService } from './follow.service';
import { FollowStatus } from './follow-access';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('P3 shop-wide Pack OFF', () => {
  it('demotes all Pack followers to Look and blocks new Pack grants', async () => {
    const updateMany = vi.fn(async () => ({ count: 2 }));
    const notifyTargets: string[] = [];
    const prisma = {
      companySettings: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ tradeDefaults: { shopRepostPackAllowed: true } })
          .mockResolvedValue({ tradeDefaults: { shopRepostPackAllowed: false } }),
        upsert: vi.fn(async () => ({})),
      },
      follow: {
        findMany: vi.fn(async () => [
          { id: 'f1', followerCompanyId: 't1' },
          { id: 'f2', followerCompanyId: 't2' },
        ]),
        updateMany,
        findUnique: vi.fn(async () => ({
          id: 'f3',
          status: FollowStatus.Allowed,
          accessKind: FollowAccessKind.Look,
          followedCompanyId: 'mill',
          packAskPending: false,
          follower: { id: 't3', name: 'T3' },
        })),
        update: vi.fn(async () => ({
          id: 'f3',
          status: FollowStatus.Allowed,
          accessKind: FollowAccessKind.Pack,
          follower: { id: 't3', name: 'T3' },
        })),
      },
      company: { findMany: vi.fn(async () => []) },
      message: { create: vi.fn(async () => ({})) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;

    const threads = {
      findExactPairDirectThreadId: vi.fn(async (a: string, b: string) => {
        notifyTargets.push(`${a}:${b}`);
        return null;
      }),
    };
    const service = new FollowService(
      prisma,
      {} as never,
      { toCompanyCard: () => ({ id: 'x' }) } as never,
      threads as never,
      { followAllowed: vi.fn() } as never,
    );

    const off = await service.setShopRepostPack('mill', false);
    expect(off.demoted).toBe(2);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { accessKind: FollowAccessKind.Look },
      }),
    );
    expect(prisma.companySettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          tradeDefaults: expect.objectContaining({ shopRepostPackAllowed: false }),
        }),
      }),
    );

    await expect(service.setAccess('mill', 't3', 'pack')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('re-enabling Pack does not auto-promote Look followers', async () => {
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const prisma = {
      companySettings: {
        findUnique: vi.fn(async () => ({
          tradeDefaults: { shopRepostPackAllowed: false },
        })),
        upsert: vi.fn(async () => ({})),
      },
      follow: { findMany: vi.fn(async () => []), updateMany },
    } as unknown as PrismaService;
    const service = new FollowService(
      prisma,
      {} as never,
      { toCompanyCard: () => ({ id: 'x' }) } as never,
      { findExactPairDirectThreadId: vi.fn() } as never,
      { followAllowed: vi.fn() } as never,
    );
    const on = await service.setShopRepostPack('mill', true);
    expect(on.demoted).toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
