import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { generateOtpCode, hmacHash, safeEqual } from '../common/crypto.util';

const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

export interface OtpIssueResult {
  expiresInSeconds: number;
  /** Present only outside production, to make local/testing flows easy. */
  devCode?: string;
}

/**
 * Issues and verifies phone OTP challenges. Codes are stored hashed with an
 * expiry and attempt cap; they are never persisted in plaintext.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issue(phone: string): Promise<OtpIssueResult> {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await this.prisma.otpChallenge.create({
      data: { phone, codeHash: this.hash(code), expiresAt },
    });

    const exposeDevCode = this.config.get('OTP_EXPOSE_DEV_CODE', { infer: true });
    if (exposeDevCode) {
      this.logger.debug(`OTP for ${phone}: ${code}`);
    }
    // TODO(Phase 1 hardening): send via SMS provider + rate limiting.

    return {
      expiresInSeconds: OTP_TTL_MS / 1000,
      devCode: exposeDevCode ? code : undefined,
    };
  }

  async verify(phone: string, code: string): Promise<void> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const invalid = () =>
      new UnauthorizedException({
        code: 'INVALID_OTP',
        message: 'That code is incorrect or expired. Ask for a new one.',
      });

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      throw invalid();
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new UnauthorizedException({
        code: 'OTP_ATTEMPTS_EXCEEDED',
        message: 'Too many tries. Ask for a new code.',
      });
    }

    if (!safeEqual(challenge.codeHash, this.hash(code))) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw invalid();
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
  }

  private hash(code: string): string {
    return hmacHash(code, this.config.get('JWT_ACCESS_SECRET', { infer: true }));
  }
}
