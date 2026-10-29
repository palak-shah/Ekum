import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, PublishAudience, RepostOrigin } from '@ekum/domain-types';
import {
  canUnionAutomaticSelected,
  mergeSelectedBuyers,
  removeDirectLinkBuyer,
  unionDirectLinkBuyer,
} from './direct-link-repost-audience';

describe('direct-link-repost-audience', () => {
  it('merges buyer ids without duplicates', () => {
    expect(mergeSelectedBuyers(['b1'], ['b1', 'b2'])).toEqual(['b1', 'b2']);
  });

  it('unions only automatic Selected packs', () => {
    expect(
      canUnionAutomaticSelected({
        audience: PublishAudience.Selected,
        repostOrigin: RepostOrigin.Automatic,
      }),
    ).toBe(true);
    expect(
      canUnionAutomaticSelected({
        audience: PublishAudience.Followers,
        repostOrigin: RepostOrigin.Automatic,
      }),
    ).toBe(false);
  });

  it('adds a buyer to an automatic Selected pack', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      collection: {
        findMany: vi.fn(async (args: { where?: { companyId?: string; audience?: string } }) => {
          if (args.where?.companyId === 'mill') return [{ id: 'POST-100' }];
          return [{ id: 'POST-201', audienceCompanyIds: ['b1'] }];
        }),
        update,
      },
    };
    await unionDirectLinkBuyer(prisma, {
      traderCompanyId: 't1',
      millCompanyId: 'mill',
      buyerCompanyId: 'b2',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'POST-201' },
      data: { audienceCompanyIds: ['b1', 'b2'] },
    });
  });

  it('drafts the automatic pack when the last buyer is removed', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      collection: {
        findMany: vi.fn(async (args: { where?: { companyId?: string; audience?: string } }) => {
          if (args.where?.companyId === 'mill') return [{ id: 'POST-100' }];
          return [{ id: 'POST-201', audienceCompanyIds: ['b1'] }];
        }),
        update,
      },
    };
    await removeDirectLinkBuyer(prisma, {
      traderCompanyId: 't1',
      millCompanyId: 'mill',
      buyerCompanyId: 'b1',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'POST-201' },
      data: { status: CollectionStatus.Draft, exploreActivityAt: null },
    });
  });
});
