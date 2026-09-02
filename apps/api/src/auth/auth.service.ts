import { Injectable } from '@nestjs/common';
import type { AuthSession, SessionUser } from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { OtpService, type OtpIssueResult } from './otp.service';
import { TokenService } from './token.service';
import type { AuthPrincipal } from './auth.types';
import { attachPendingOrderInvite } from '../orders/order-invite-claim';
import { actingUserId, preferredSeedCompanyId, SEED_USER_BY_LAST10 } from './seed-accounts';

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
    let activeCompanyId: string | null =
      user.memberships.find((row) => !('archivedAt' in row) || !row.archivedAt)?.companyId ??
      user.memberships[0]?.companyId ??
      null;
    if (!activeCompanyId) {
      const seedCompanyId = preferredSeedCompanyId(user.id);
      if (seedCompanyId) {
        const seedMembership = await this.firstLiveMembership(user.id, seedCompanyId);
        if (seedMembership) {
          activeCompanyId = seedMembership.companyId;
        }
      }
    }
    if (!activeCompanyId) {
      activeCompanyId = await attachPendingOrderInvite(this.prisma, user.id, user.phone);
    }
    const tokens = await this.tokens.issue(
      { id: user.id, phone: user.phone },
      activeCompanyId,
    );

    return {
      tokens,
      user: {
        userId: user.id,
        phone: user.phone,
        companyId: activeCompanyId,
        name: user.name?.trim() || null,
      },
      needsOnboarding: activeCompanyId == null,
    };
  }

  /**
   * Phone is already normalized to +91… by the DTO pipe. Also resolve legacy
   * rows stored without +, so 9198… and +9198… map to the same account
   * (preferring seed / + canonical).
   */
  private async resolveUserByPhone(phone: string) {
    const last10 = phone.replace(/\D/g, '').slice(-10);
    const variants = [...new Set([phone, last10, `91${last10}`, `+91${last10}`, `0${last10}`])];

    const membershipSelect = { select: { companyId: true, role: true } } as const;
    const seedId = SEED_USER_BY_LAST10[last10];
    if (seedId) {
      const seeded = await this.prisma.user.findUnique({
        where: { id: seedId },
        include: { memberships: membershipSelect },
      });
      if (seeded) {
        return seeded;
      }
    }

    const candidates = await this.prisma.user.findMany({
      where: { phone: { in: variants } },
      include: { memberships: membershipSelect },
    });

    const user =
      candidates.find((row) => row.id.startsWith('seed-')) ??
      candidates.find((row) => row.phone === phone) ??
      candidates.find((row) => row.phone.startsWith('+')) ??
      candidates[0];

    if (!user) {
      return this.prisma.user.create({
        data: { phone },
        include: { memberships: membershipSelect },
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
          include: { memberships: membershipSelect },
        });
      } catch {
        return this.prisma.user.findUniqueOrThrow({
          where: { phone },
          include: { memberships: membershipSelect },
        });
      }
    }

    return user;
  }

  async refresh(rawRefreshToken: string): Promise<AuthSession> {
    const { tokens, userId, phone, companyId } = await this.tokens.rotate(rawRefreshToken);
    const name = await this.displayName(userId);
    return {
      tokens,
      user: { userId, phone, companyId, name },
      needsOnboarding: companyId === null,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.tokens.revoke(rawRefreshToken);
  }

  async me(principal: AuthPrincipal): Promise<{ user: SessionUser; needsOnboarding: boolean }> {
    const userId = actingUserId(principal.phone, principal.userId);
    let companyId = principal.companyId;
    let role = principal.role;
    let permissions = principal.permissions;
    if (!companyId || preferredSeedCompanyId(userId)) {
      const row = await this.firstLiveMembership(userId, preferredSeedCompanyId(userId));
      if (row) {
        companyId = row.companyId;
        role = row.role;
        permissions = principal.permissions;
      }
    }
    const name = await this.displayName(userId);
    return {
      user: {
        userId,
        phone: principal.phone,
        companyId,
        name,
        role,
        permissions,
      },
      needsOnboarding: companyId == null,
    };
  }

  private async displayName(userId: string): Promise<string | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return row?.name?.trim() || null;
  }

  private async firstLiveMembership(userId: string, preferCompanyId?: string) {
    const prefer = preferCompanyId
      ? await this.liveMembershipRow({ userId, companyId: preferCompanyId })
      : null;
    if (prefer) return prefer;
    return this.liveMembershipRow({ userId });
  }

  private async liveMembershipRow(where: { userId: string; companyId?: string }) {
    try {
      return await this.prisma.companyMembership.findFirst({
        where: { ...where, archivedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { companyId: true, role: true },
      });
    } catch {
      return this.prisma.companyMembership.findFirst({
        where,
        orderBy: { createdAt: 'asc' },
        select: { companyId: true, role: true },
      });
    }
  }
}
