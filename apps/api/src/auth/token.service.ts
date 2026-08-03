import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens } from '@ekum/domain-types';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { hmacHash, parseDurationMs, randomToken } from '../common/crypto.util';
import type { JwtPayload } from './auth.types';

interface TokenSubject {
  id: string;
  phone: string;
}

/**
 * Issues and rotates auth tokens. The access token is a short-lived JWT; the
 * refresh token is an opaque random string stored only as a hash, so a database
 * leak never yields usable refresh tokens. Token-based auth (not cookies) keeps
 * the same mechanism working for the future Flutter client.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  async issue(subject: TokenSubject, companyId: string | null): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: subject.id, phone: subject.phone, companyId };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.createRefreshToken(subject.id);
    return { accessToken, refreshToken };
  }

  async verifyAccess(token: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Please sign in again.' });
    }
  }

  async rotate(rawRefreshToken: string): Promise<{
    tokens: AuthTokens;
    userId: string;
    phone: string;
    companyId: string | null;
  }> {
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { memberships: { orderBy: { createdAt: 'asc' } } } } },
    });

    if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Please sign in again.' });
    }

    // Rotate: revoke the used token and issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    // Preserve the acting company across refresh so onboarded users are not
    // forced back through OTP. Phase 1 exposes one company per user.
    const companyId = existing.user.memberships[0]?.companyId ?? null;
    const tokens = await this.issue({ id: existing.user.id, phone: existing.user.phone }, companyId);
    return { tokens, userId: existing.user.id, phone: existing.user.phone, companyId };
  }

  async revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomToken();
    const expiresAt = new Date(
      Date.now() + parseDurationMs(this.config.get('JWT_REFRESH_TTL', { infer: true })),
    );
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hashRefreshToken(raw), expiresAt },
    });
    return raw;
  }

  private hashRefreshToken(raw: string): string {
    return hmacHash(raw, this.config.get('JWT_REFRESH_SECRET', { infer: true }));
  }
}
