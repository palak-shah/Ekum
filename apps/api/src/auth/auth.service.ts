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

    const user = await this.resolveUserByPhone(phone);
    const activeCompanyId = user.memberships[0]?.companyId ?? null;
    const tokens = await this.tokens.issue(
      { id: user.id, phone: user.phone },
      activeCompanyId,
    );

    return {
      tokens,
      user: { userId: user.id, phone: user.phone, companyId: activeCompanyId },
      needsOnboarding: user.memberships.length === 0,
    };
  }

  /**
   * Phone is already normalized to +91… by the DTO pipe. Also resolve legacy
   * rows stored without +, so 9198… and +9198… map to the same account
   * (preferring seed / + canonical).
   */
  private async resolveUserByPhone(phone: string) {
    const last10 = phone.replace(/\D/g, '').slice(-10);
    const variants = [...new Set([phone, last10, `91${last10}`, `0${last10}`])];

    const candidates = await this.prisma.user.findMany({
      where: { phone: { in: variants } },
      include: { memberships: true },
    });

    const user =
      candidates.find((row) => row.phone === phone) ??
      candidates.find((row) => row.id.startsWith('seed-')) ??
      candidates.find((row) => row.phone.startsWith('+')) ??
      candidates[0];

    if (!user) {
      return this.prisma.user.create({
        data: { phone },
        include: { memberships: true },
      });
    }

    if (user.phone !== phone) {
      // Point this login at the canonical + row when it already exists.
      const canonical = candidates.find((row) => row.phone === phone);
      if (canonical) {
        return canonical;
      }
      try {
        return await this.prisma.user.update({
          where: { id: user.id },
          data: { phone },
          include: { memberships: true },
        });
      } catch {
        return this.prisma.user.findUniqueOrThrow({
          where: { phone },
          include: { memberships: true },
        });
      }
    }

    return user;
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
