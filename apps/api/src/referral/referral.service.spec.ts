import { describe, expect, it } from 'vitest';
import { ReferralService } from './referral.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CompanySerializer } from '../access/company.serializer';

const serializer = {
  toPublicSummary: (company: { id: string }) => ({ id: company.id }),
} as unknown as CompanySerializer;

describe('ReferralService.resolve', () => {
  it('returns the referrer and target for a valid token', async () => {
    const prisma = {
      referral: {
        findUnique: async () => ({
          id: 'ref1',
          token: 'tok',
          note: 'trusted supplier',
          createdAt: new Date(),
          referrer: { id: 'referrer-co' },
          target: { id: 'target-co' },
        }),
      },
    } as unknown as PrismaService;
    const service = new ReferralService(prisma, serializer);

    const view = await service.resolve('tok');
    expect(view.referrer.id).toBe('referrer-co');
    expect(view.target?.id).toBe('target-co');
  });

  it('throws for an unknown token', async () => {
    const prisma = {
      referral: { findUnique: async () => null },
    } as unknown as PrismaService;
    const service = new ReferralService(prisma, serializer);
    await expect(service.resolve('missing')).rejects.toThrow();
  });
});

describe('ReferralService.create', () => {
  it('rejects vouching for your own business', async () => {
    const prisma = {} as unknown as PrismaService;
    const service = new ReferralService(prisma, serializer);
    await expect(service.create('me', { targetCompanyId: 'me' })).rejects.toThrow();
  });
});
