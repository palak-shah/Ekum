import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens } from '@ekum/domain-types';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { hmacHash, parseDurationMs, randomToken } from '../common/crypto.util';
import type { JwtPayload } from './auth.types';
import { actingUserId, preferredSeedCompanyId } from './seed-accounts';

interface TokenSubject {
  id: string;
  phone: string;
}

interface RefreshGraceEntry {
  tokens: AuthTokens;
  userId: string;
  phone: string;
  companyId: string | null;
  expiresAt: number;
}

/** Reuse window for parallel refresh (multi-tab) after rotation. */
const REFRESH_GRACE_MS = 60_000;

/**
 * Issues and rotates auth tokens. The access token is a short-lived JWT; the
 * refresh token is an opaque random string stored only as a hash, so a database
 * leak never yields usable refresh tokens. Token-based auth (not cookies) keeps
 * the same mechanism working for the future Flutter client.
 */
@Injectable()
export class TokenService {
  /** Recently rotated refresh hashes → issued tokens (multi-tab grace). */
  private readonly refreshGraceByOldHash = new Map<string, RefreshGraceEntry>();

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
    this.pruneRefreshGrace();

    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const grace = this.refreshGraceByOldHash.get(tokenHash);
    if (grace && grace.expiresAt > Date.now()) {
      return {
        tokens: grace.tokens,
        userId: grace.userId,
        phone: grace.phone,
        companyId: grace.companyId,
      };
    }

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
    const userId = actingUserId(existing.user.phone, existing.user.id);
    const memberships = existing.user.memberships.filter(
      (row) => !('archivedAt' in row) || !row.archivedAt,
    );
    const preferred = preferredSeedCompanyId(userId);
    const companyId =
      (preferred && memberships.find((row) => row.companyId === preferred)?.companyId) ??
      memberships[0]?.companyId ??
      existing.user.memberships[0]?.companyId ??
      null;
    const tokens = await this.issue({ id: userId, phone: existing.user.phone }, companyId);

    this.refreshGraceByOldHash.set(tokenHash, {
      tokens,
      userId,
      phone: existing.user.phone,
      companyId,
      expiresAt: Date.now() + REFRESH_GRACE_MS,
    });

    return { tokens, userId, phone: existing.user.phone, companyId };
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

  private pruneRefreshGrace(now = Date.now()): void {
    for (const [hash, entry] of this.refreshGraceByOldHash) {
      if (entry.expiresAt <= now) {
        this.refreshGraceByOldHash.delete(hash);
      }
    }
  }
}
