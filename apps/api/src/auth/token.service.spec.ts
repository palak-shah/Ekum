import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { parseDurationMs } from '../common/crypto.util';
import { TokenService } from './token.service';

describe('TokenService.rotate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the same tokens when the same raw refresh is reused within grace', async () => {
    const prisma = {
      refreshToken: {
        findUnique: vi.fn(),
        update: vi.fn(async () => undefined),
        create: vi.fn(async () => undefined),
      },
    };
    const jwt = { signAsync: vi.fn(async () => 'access-new') };
    const config = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_REFRESH_TTL') return '10y';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return undefined;
      }),
    };

    const service = new TokenService(jwt as never, config as never, prisma as never);
    const issueSpy = vi.spyOn(service, 'issue').mockResolvedValue({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
    });

    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      user: {
        id: 'u1',
        phone: '+919800000001',
        memberships: [{ companyId: 'seed-company-ravi' }],
      },
    });

    const first = await service.rotate('raw-token-1');
    const second = await service.rotate('raw-token-1');

    expect(second.tokens).toEqual(first.tokens);
    expect(prisma.refreshToken.update).toHaveBeenCalledTimes(1);
    expect(issueSpy).toHaveBeenCalledTimes(1);
    expect(issueSpy).toHaveBeenCalledWith(
      { id: 'seed-user-ravi', phone: '+919800000001' },
      'seed-company-ravi',
    );
    expect(first.userId).toBe('seed-user-ravi');
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledTimes(1);
  });

  it('slides refresh expiry to now + TTL on rotate', async () => {
    const created: { expiresAt?: Date }[] = [];
    const prisma = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'rt-1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 86_400_000),
          user: {
            id: 'u1',
            phone: '+919800000001',
            memberships: [{ companyId: 'c1' }],
          },
        }),
        update: vi.fn(async () => undefined),
        create: vi.fn(async ({ data }: { data: { expiresAt: Date } }) => {
          created.push(data);
        }),
      },
    };
    const jwt = { signAsync: vi.fn(async () => 'access-new') };
    const config = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_REFRESH_TTL') return '10y';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return undefined;
      }),
    };

    const service = new TokenService(jwt as never, config as never, prisma as never);
    const before = Date.now();
    await service.rotate('raw-token-slide');
    const after = Date.now();

    expect(created).toHaveLength(1);
    const expectedMs = parseDurationMs('10y');
    const expiresAt = created[0].expiresAt!.getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + expectedMs - 50);
    expect(expiresAt).toBeLessThanOrEqual(after + expectedMs + 50);
  });

  it('rejects an expired or revoked refresh outside grace', async () => {
    const prisma = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'rt-1',
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 86_400_000),
          user: { id: 'u1', phone: '+919800000001', memberships: [] },
        }),
        update: vi.fn(),
        create: vi.fn(),
      },
    };
    const jwt = { signAsync: vi.fn() };
    const config = {
      get: vi.fn((key: string) => (key === 'JWT_REFRESH_SECRET' ? 'refresh-secret' : '10y')),
    };

    const service = new TokenService(jwt as never, config as never, prisma as never);
    await expect(service.rotate('stale-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
