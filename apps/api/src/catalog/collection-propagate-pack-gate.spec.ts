import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus } from '@ekum/domain-types';
import { CollectionPropagateService } from './collection-propagate.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CollectionService } from './collection.service';
import type { JobQueue } from '../jobs/job-queue.service';

describe('propagate Pack gate (P4)', () => {
  it('does not create auto-repost when follow is Look-only', async () => {
    const create = vi.fn(async () => ({ id: 'x' }));
    const collections = {
      create,
      setProducts: vi.fn(),
      publish: vi.fn(),
      syncRepostMembershipFromSource: vi.fn(async () => ({
        membershipChanged: false, activeProductIds: [], addedProductIds: [],
      })),
    } as unknown as CollectionService;
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'POST-100',
          companyId: 's1',
          name: 'Mill',
          coverImage: null,
          status: CollectionStatus.Published,
          audience: 'followers',
          audienceCompanyIds: [],
          allowForward: true,
          exploreActivityAt: new Date(),
          updatedAt: new Date(),
          repostSourceCollectionId: null,
        })),
        findMany: vi.fn(async () => []),
      },
      tradeLane: {
        findMany: vi.fn(async (args: { where?: { traderCompanyId?: string } }) => {
          if (args?.where?.traderCompanyId) {
            return [{ buyerCompanyId: 'b1', createdAt: new Date() }];
          }
          return [{ traderCompanyId: 't1' }];
        }),
      },
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'look' })),
      },
      companySettings: {
        findUnique: vi.fn(async () => ({ tradeDefaults: { shopRepostPackAllowed: true } })),
      },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'u1' })) },
    } as unknown as PrismaService;

    await new CollectionPropagateService(
      prisma,
      collections,
      { enqueue: vi.fn() } as unknown as JobQueue,
      { repostSyncDesignsAdded: vi.fn() } as never,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
  });

  it('does not create auto-repost when shop Pack is OFF even if Pack follow remains', async () => {
    const create = vi.fn(async () => ({ id: 'x' }));
    const collections = {
      create,
      setProducts: vi.fn(),
      publish: vi.fn(),
      syncRepostMembershipFromSource: vi.fn(async () => ({
        membershipChanged: false, activeProductIds: [], addedProductIds: [],
      })),
    } as unknown as CollectionService;
    const prisma = {
      collection: {
        findUnique: vi.fn(async () => ({
          id: 'POST-100',
          companyId: 's1',
          name: 'Mill',
          coverImage: null,
          status: CollectionStatus.Published,
          audience: 'followers',
          audienceCompanyIds: [],
          allowForward: true,
          exploreActivityAt: new Date(),
          updatedAt: new Date(),
          repostSourceCollectionId: null,
        })),
        findMany: vi.fn(async () => []),
      },
      tradeLane: {
        findMany: vi.fn(async (args: { where?: { traderCompanyId?: string } }) => {
          if (args?.where?.traderCompanyId) {
            return [{ buyerCompanyId: 'b1', createdAt: new Date() }];
          }
          return [{ traderCompanyId: 't1' }];
        }),
      },
      follow: {
        findUnique: vi.fn(async () => ({ status: 'allowed', accessKind: 'pack' })),
      },
      companySettings: {
        findUnique: vi.fn(async () => ({
          tradeDefaults: { shopRepostPackAllowed: false },
        })),
      },
      companyMembership: { findFirst: vi.fn(async () => ({ userId: 'u1' })) },
    } as unknown as PrismaService;

    await new CollectionPropagateService(
      prisma,
      collections,
      { enqueue: vi.fn() } as unknown as JobQueue,
      { repostSyncDesignsAdded: vi.fn() } as never,
    ).propagate('POST-100');
    expect(create).not.toHaveBeenCalled();
  });
});
