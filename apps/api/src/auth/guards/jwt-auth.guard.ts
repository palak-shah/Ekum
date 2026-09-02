import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest, AuthPrincipal } from '../auth.types';
import { TokenService } from '../token.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { membershipPermissions } from '../require-permission';
import { actingUserId, preferredSeedCompanyId } from '../seed-accounts';

/**
 * Global guard. Every route requires a valid access token unless explicitly
 * marked @Public(). It attaches the authenticated principal to the request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Sign in to continue.' });
    }

    const payload = await this.tokens.verifyAccess(header.slice('Bearer '.length));
    const userId = actingUserId(payload.phone, payload.sub);

    // Defense in depth: a token may claim a companyId, but the user only acts as
    // that company if they still hold a membership. Otherwise drop the context so
    // company-scoped routes deny access rather than trust the claim outright.
    let companyId = payload.companyId;
    let role: string | null = null;
    let permissions = null as AuthPrincipal['permissions'];

    const preferred = preferredSeedCompanyId(userId);
    if (preferred) {
      const seedMembership = await this.loadMembership(userId, preferred);
      if (seedMembership && !seedMembership.archived) {
        companyId = preferred;
        role = seedMembership.role;
        permissions = membershipPermissions(seedMembership);
      }
    }

    if (!role && companyId) {
      const membership = await this.loadMembership(userId, companyId);
      if (membership && !membership.archived) {
        role = membership.role;
        permissions = membershipPermissions(membership);
      } else {
        companyId = null;
      }
    }

    if (!companyId) {
      const live = await this.firstLiveMembership(userId);
      if (live) {
        companyId = live.companyId;
        role = live.role;
        permissions = membershipPermissions(live);
      }
    }

    request.user = { userId, phone: payload.phone, companyId, role, permissions };
    return true;
  }

  private async loadMembership(userId: string, companyId: string) {
    try {
      const row = await this.prisma.companyMembership.findUnique({
        where: { userId_companyId: { userId, companyId } },
        select: {
          role: true,
          canUploads: true,
          canChats: true,
          canOrders: true,
          canPayments: true,
          canTeam: true,
          archivedAt: true,
        },
      });
      if (!row) return null;
      return { ...row, archived: Boolean(row.archivedAt) };
    } catch {
      const row = await this.prisma.companyMembership.findUnique({
        where: { userId_companyId: { userId, companyId } },
        select: {
          role: true,
          canUploads: true,
          canChats: true,
          canOrders: true,
          canPayments: true,
          canTeam: true,
        },
      });
      if (!row) return null;
      return { ...row, archived: false };
    }
  }

  private async firstLiveMembership(userId: string) {
    const select = {
      companyId: true,
      role: true,
      canUploads: true,
      canChats: true,
      canOrders: true,
      canPayments: true,
      canTeam: true,
    } as const;
    try {
      const row = await this.prisma.companyMembership.findFirst({
        where: { userId, archivedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { ...select, archivedAt: true },
      });
      if (!row) return null;
      return { ...row, archived: Boolean(row.archivedAt) };
    } catch {
      const row = await this.prisma.companyMembership.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select,
      });
      if (!row) return null;
      return { ...row, archived: false };
    }
  }
}
