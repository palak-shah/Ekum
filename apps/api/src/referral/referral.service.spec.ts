import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ReferralService } from './referral.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CompanySerializer } from '../access/company.serializer';
import type { AccessService } from '../access/access.service';

const serializer = {
  toPublicSummary: (company: { id: string; name?: string }) => ({
    id: company.id,
    name: company.name ?? company.id,
    city: null,
    verification: 'not_verified',
    logoUrl: null,
  }),
} as unknown as CompanySerializer;

function openReferral(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ref1',
    token: 'tok',
    note: 'Join us',
    createdAt: new Date(),
    referrerCompanyId: 'referrer-co',
    targetCompanyId: null,
    referrer: { id: 'referrer-co', name: 'Surat Silk' },
    target: null,
    ...overrides,
  };
}

describe('ReferralService.resolve', () => {
  it('returns the referrer and target for a valid token', async () => {
    const prisma = {
      referral: {
        findUnique: async () => ({
          id: 'ref1',
          token: 'tok',
          note: 'trusted supplier',
          createdAt: new Date(),
          referrerCompanyId: 'referrer-co',
          targetCompanyId: 'target-co',
          referrer: { id: 'referrer-co' },
          target: { id: 'target-co' },
        }),
      },
    } as unknown as PrismaService;
    const access = { createRequest: vi.fn() } as unknown as AccessService;
    const service = new ReferralService(prisma, serializer, access);

    const view = await service.resolve('tok');
    expect(view.referrer.id).toBe('referrer-co');
    expect(view.target?.id).toBe('target-co');
  });

  it('throws for an unknown token', async () => {
    const prisma = {
      referral: { findUnique: async () => null },
    } as unknown as PrismaService;
    const access = { createRequest: vi.fn() } as unknown as AccessService;
    const service = new ReferralService(prisma, serializer, access);
    await expect(service.resolve('missing')).rejects.toThrow();
  });
});

describe('ReferralService.create', () => {
  it('rejects vouching for your own business', async () => {
    const prisma = {} as unknown as PrismaService;
    const access = { createRequest: vi.fn() } as unknown as AccessService;
    const service = new ReferralService(prisma, serializer, access);
    await expect(service.create('me', { targetCompanyId: 'me' })).rejects.toThrow();
  });
});

describe('ReferralService.redeem', () => {
  it('creates an access request to the referrer for an open invite', async () => {
    const createRequest = vi.fn(async () => ({
      id: 'req-1',
      company: { id: 'referrer-co', name: 'Surat Silk' },
      note: 'Join us',
      referredBy: 'Invite',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));
    const prisma = {
      referral: { findUnique: async () => openReferral() },
    } as unknown as PrismaService;
    const access = { createRequest } as unknown as AccessService;
    const service = new ReferralService(prisma, serializer, access);

    const view = await service.redeem('viewer-co', 'tok');
    expect(view.id).toBe('req-1');
    expect(createRequest).toHaveBeenCalledWith('viewer-co', {
      targetCompanyId: 'referrer-co',
      note: 'Join us',
      referredBy: 'Invite',
    });
  });

  it('rejects self-redeem', async () => {
    const createRequest = vi.fn();
    const prisma = {
      referral: { findUnique: async () => openReferral() },
    } as unknown as PrismaService;
    const access = { createRequest } as unknown as AccessService;
    const service = new ReferralService(prisma, serializer, access);
    await expect(service.redeem('referrer-co', 'tok')).rejects.toBeInstanceOf(BadRequestException);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it('rejects targeted vouch redeem', async () => {
    const createRequest = vi.fn();
    const prisma = {
      referral: {
        findUnique: async () =>
          openReferral({
            targetCompanyId: 'target-co',
            target: { id: 'target-co', name: 'Other' },
          }),
      },
    } as unknown as PrismaService;
    const access = { createRequest } as unknown as AccessService;
    const service = new ReferralService(prisma, serializer, access);
    await expect(service.redeem('viewer-co', 'tok')).rejects.toBeInstanceOf(BadRequestException);
    expect(createRequest).not.toHaveBeenCalled();
  });
});
