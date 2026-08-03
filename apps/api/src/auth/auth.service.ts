import { Injectable } from '@nestjs/common';
import type { AuthSession, SessionUser } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { OtpService, type OtpIssueResult } from './otp.service';
import { TokenService } from './token.service';
import type { AuthPrincipal } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

  requestOtp(phone: string): Promise<OtpIssueResult> {
    return this.otp.issue(phone);
  }

  async verifyOtp(phone: string, code: string): Promise<AuthSession> {
    await this.otp.verify(phone, code);

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
      include: { memberships: true },
    });

    // Phase 1 exposes one company per user; act as the first membership if any.
    const activeCompanyId = user.memberships[0]?.companyId ?? null;
    const tokens = await this.tokens.issue(user, activeCompanyId);

    return {
      tokens,
      user: { userId: user.id, phone: user.phone, companyId: activeCompanyId },
      needsOnboarding: user.memberships.length === 0,
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthSession> {
    const { tokens, userId, phone, companyId } = await this.tokens.rotate(rawRefreshToken);
    return {
      tokens,
      user: { userId, phone, companyId },
      needsOnboarding: companyId === null,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.tokens.revoke(rawRefreshToken);
  }

  async me(principal: AuthPrincipal): Promise<{ user: SessionUser; needsOnboarding: boolean }> {
    const memberships = await this.prisma.companyMembership.count({
      where: { userId: principal.userId },
    });
    return {
      user: {
        userId: principal.userId,
        phone: principal.phone,
        companyId: principal.companyId,
      },
      needsOnboarding: memberships === 0,
    };
  }
}
