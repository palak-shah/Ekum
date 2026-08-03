import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../auth.types';
import { TokenService } from '../token.service';
import { PrismaService } from '../../core/prisma/prisma.service';

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

    // Defense in depth: a token may claim a companyId, but the user only acts as
    // that company if they still hold a membership. Otherwise drop the context so
    // company-scoped routes deny access rather than trust the claim outright.
    let companyId = payload.companyId;
    if (companyId) {
      const membership = await this.prisma.companyMembership.findUnique({
        where: { userId_companyId: { userId: payload.sub, companyId } },
        select: { id: true },
      });
      if (!membership) {
        companyId = null;
      }
    }

    request.user = { userId: payload.sub, phone: payload.phone, companyId };
    return true;
  }
}
