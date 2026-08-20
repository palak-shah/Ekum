import { describe, expect, it, vi } from 'vitest';
import { RateVisibility } from '@ekum/domain-types';
import { rememberPublishDefaults, resolvePublishPolicy } from './publish-policy';

describe('resolvePublishPolicy', () => {
  it('uses platform defaults when company has none', async () => {
    const prisma = {
      companySettings: { findUnique: vi.fn().mockResolvedValue(null) },
      broadcastList: { findFirst: vi.fn() },
    };
    const policy = await resolvePublishPolicy(prisma as never, 'c1');
    expect(policy).toEqual({
      rateVisibility: RateVisibility.OnRequest,
      allowForward: true,
    });
  });

  it('reads company usual from tradeDefaults.publishDefaults', async () => {
    const prisma = {
      companySettings: {
        findUnique: vi.fn().mockResolvedValue({
          tradeDefaults: {
            publishDefaults: {
              rateVisibility: RateVisibility.Visible,
              allowForward: false,
            },
          },
        }),
      },
      broadcastList: { findFirst: vi.fn() },
    };
    const policy = await resolvePublishPolicy(prisma as never, 'c1');
    expect(policy).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: false,
    });
  });

  it('applies only non-null group overrides', async () => {
    const prisma = {
      companySettings: {
        findUnique: vi.fn().mockResolvedValue({
          tradeDefaults: {
            publishDefaults: {
              rateVisibility: RateVisibility.OnRequest,
              allowForward: true,
            },
          },
        }),
      },
      broadcastList: {
        findFirst: vi.fn().mockResolvedValue({
          defaultRateVisibility: RateVisibility.Visible,
          allowForward: null,
        }),
      },
    };
    const policy = await resolvePublishPolicy(prisma as never, 'c1', 'g1');
    expect(policy).toEqual({
      rateVisibility: RateVisibility.Visible,
      allowForward: true,
    });
  });
});

describe('rememberPublishDefaults', () => {
  it('merges publishDefaults without wiping other trade flags', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      companySettings: {
        findUnique: vi.fn().mockResolvedValue({
          tradeDefaults: { sellingEnabled: true, buyingEnabled: false },
        }),
        upsert,
      },
    };
    await rememberPublishDefaults(prisma as never, 'c1', {
      rateVisibility: RateVisibility.Visible,
      allowForward: false,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          tradeDefaults: {
            sellingEnabled: true,
            buyingEnabled: false,
            publishDefaults: {
              rateVisibility: RateVisibility.Visible,
              allowForward: false,
            },
          },
        },
      }),
    );
  });
});
