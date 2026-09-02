import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import type { OtpService } from './otp.service';
import type { TokenService } from './token.service';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('AuthService.verifyOtp', () => {
  it('issues a session and sets needsOnboarding when the user has no company', async () => {
    const otp = { verify: vi.fn(async () => undefined) } as unknown as OtpService;
    const tokens = {
      issue: vi.fn(async () => ({
        accessToken: 'a',
        refreshToken: 'r',
        accessExpiresIn: 900,
      })),
    } as unknown as TokenService;
    const prisma = {
      user: {
        findMany: async () => [
          { id: 'u1', phone: '+919800000099', name: null, memberships: [] },
        ],
      },
      companyMembership: {
        findFirst: async () => null,
      },
      orderAcceptInvite: {
        findFirst: async () => null,
      },
    } as unknown as PrismaService;

    const service = new AuthService(prisma, otp, tokens);
    const session = await service.verifyOtp('+919800000099', '123456');

    expect(otp.verify).toHaveBeenCalledWith('+919800000099', '123456');
    expect(session.needsOnboarding).toBe(true);
    expect(session.user.companyId).toBeNull();
    expect(tokens.issue).toHaveBeenCalledWith(
      { id: 'u1', phone: '+919800000099' },
      null,
    );
  });

  it('attaches the first membership company and clears needsOnboarding', async () => {
    const otp = { verify: vi.fn(async () => undefined) } as unknown as OtpService;
    const tokens = {
      issue: vi.fn(async () => ({
        accessToken: 'a',
        refreshToken: 'r',
        accessExpiresIn: 900,
      })),
    } as unknown as TokenService;
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 'seed-user-ravi',
          phone: '+919800000001',
          memberships: [{ companyId: 'seed-company-ravi' }],
        }),
        findMany: async () => [
          {
            id: 'seed-user-ravi',
            phone: '+919800000001',
            memberships: [{ companyId: 'seed-company-ravi' }],
          },
        ],
      },
    } as unknown as PrismaService;

    const service = new AuthService(prisma, otp, tokens);
    const session = await service.verifyOtp('+919800000001', '123456');

    expect(session.needsOnboarding).toBe(false);
    expect(session.user.companyId).toBe('seed-company-ravi');
  });

  it('prefers the seed user over a same-number leftover (91… without +)', async () => {
    const otp = { verify: vi.fn(async () => undefined) } as unknown as OtpService;
    const tokens = {
      issue: vi.fn(async () => ({
        accessToken: 'a',
        refreshToken: 'r',
        accessExpiresIn: 900,
      })),
    } as unknown as TokenService;
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 'seed-user-ravi',
          phone: '+919800000001',
          memberships: [{ companyId: 'seed-company-ravi' }],
        }),
        findMany: async () => [
          { id: 'legacy', phone: '919800000001', memberships: [] },
          {
            id: 'seed-user-ravi',
            phone: '+919800000001',
            memberships: [{ companyId: 'seed-company-ravi' }],
          },
        ],
      },
    } as unknown as PrismaService;

    const service = new AuthService(prisma, otp, tokens);
    const session = await service.verifyOtp('+919800000001', '123456');
    expect(session.user.userId).toBe('seed-user-ravi');
  });
});

describe('AuthService.me', () => {
  it('reports needsOnboarding when the user has no live membership', async () => {
    const prisma = {
      companyMembership: { findFirst: async () => null },
      user: { findUnique: async () => ({ name: null }) },
    } as unknown as PrismaService;
    const service = new AuthService(
      prisma,
      {} as OtpService,
      {} as TokenService,
    );
    const result = await service.me({
      userId: 'u1',
      phone: '+9198',
      companyId: null,
      role: null,
      permissions: null,
    });
    expect(result.needsOnboarding).toBe(true);
  });

  it('restores the company when the token lost it but membership exists', async () => {
    const prisma = {
      companyMembership: {
        findFirst: async () => ({ companyId: 'seed-company-ravi', role: 'owner' }),
      },
      user: { findUnique: async () => ({ name: 'Ravi' }) },
    } as unknown as PrismaService;
    const service = new AuthService(
      prisma,
      {} as OtpService,
      {} as TokenService,
    );
    const result = await service.me({
      userId: 'seed-user-ravi',
      phone: '+919800000001',
      companyId: null,
      role: null,
      permissions: null,
    });
    expect(result.needsOnboarding).toBe(false);
    expect(result.user.companyId).toBe('seed-company-ravi');
  });

  it('rewrites leftover demo-phone sessions to the seed person', async () => {
    const prisma = {
      companyMembership: {
        findFirst: async ({ where }: { where: { companyId?: string } }) =>
          where.companyId === 'seed-company-ravi'
            ? { companyId: 'seed-company-ravi', role: 'owner' }
            : null,
      },
      user: { findUnique: async () => ({ name: 'Ravi' }) },
    } as unknown as PrismaService;
    const service = new AuthService(prisma, {} as OtpService, {} as TokenService);
    const result = await service.me({
      userId: 'leftover-amit',
      phone: '919800000001',
      companyId: 'textile-hub',
      role: 'owner',
      permissions: null,
    });
    expect(result.user.userId).toBe('seed-user-ravi');
    expect(result.user.companyId).toBe('seed-company-ravi');
    expect(result.user.name).toBe('Ravi');
  });
});

describe('AuthService.refresh / logout', () => {
  it('maps rotated tokens and needsOnboarding from companyId', async () => {
    const tokens = {
      rotate: vi.fn(async () => ({
        tokens: { accessToken: 'a2', refreshToken: 'r2', accessExpiresIn: 900 },
        userId: 'u1',
        phone: '+9198',
        companyId: null,
      })),
      revoke: vi.fn(async () => undefined),
    } as unknown as TokenService;
    const service = new AuthService(
      { user: { findUnique: async () => ({ name: 'Ravi' }) } } as unknown as PrismaService,
      {} as OtpService,
      tokens,
    );

    const session = await service.refresh('raw');
    expect(session.needsOnboarding).toBe(true);
    await service.logout('raw');
    expect(tokens.revoke).toHaveBeenCalledWith('raw');
  });
});
