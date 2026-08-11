import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { OtpService } from './otp.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ConfigService } from '@nestjs/config';
import { hmacHash } from '../common/crypto.util';
import type { Env } from '../core/config/config.schema';

const SECRET = 'test-secret';

function config(): ConfigService<Env, true> {
  return {
    get: (key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return SECRET;
      if (key === 'OTP_EXPOSE_DEV_CODE') return true;
      return undefined;
    },
  } as unknown as ConfigService<Env, true>;
}

describe('OtpService.verify', () => {
  it('accepts a matching unexpired code and consumes the challenge', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      otpChallenge: {
        findFirst: async () => ({
          id: 'otp-1',
          codeHash: hmacHash('123456', SECRET),
          expiresAt: new Date(Date.now() + 60_000),
          attempts: 0,
        }),
        update,
      },
    } as unknown as PrismaService;

    const service = new OtpService(prisma, config());
    await expect(service.verify('+919800000001', '123456')).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'otp-1' },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      }),
    );
  });

  it('rejects an expired code', async () => {
    const prisma = {
      otpChallenge: {
        findFirst: async () => ({
          id: 'otp-1',
          codeHash: hmacHash('123456', SECRET),
          expiresAt: new Date(Date.now() - 1_000),
          attempts: 0,
        }),
        update: vi.fn(),
      },
    } as unknown as PrismaService;

    const service = new OtpService(prisma, config());
    await expect(service.verify('+919800000001', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a wrong code and increments attempts', async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      otpChallenge: {
        findFirst: async () => ({
          id: 'otp-1',
          codeHash: hmacHash('123456', SECRET),
          expiresAt: new Date(Date.now() + 60_000),
          attempts: 0,
        }),
        update,
      },
    } as unknown as PrismaService;

    const service = new OtpService(prisma, config());
    await expect(service.verify('+919800000001', '000000')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { attempts: { increment: 1 } },
      }),
    );
  });

  it('rejects when attempts are exhausted', async () => {
    const prisma = {
      otpChallenge: {
        findFirst: async () => ({
          id: 'otp-1',
          codeHash: hmacHash('123456', SECRET),
          expiresAt: new Date(Date.now() + 60_000),
          attempts: 5,
        }),
        update: vi.fn(),
      },
    } as unknown as PrismaService;

    const service = new OtpService(prisma, config());
    try {
      await service.verify('+919800000001', '123456');
      expect.fail('expected OTP_ATTEMPTS_EXCEEDED');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toMatchObject({
        code: 'OTP_ATTEMPTS_EXCEEDED',
      });
    }
  });
});
