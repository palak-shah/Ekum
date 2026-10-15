import {
  applyDecorators,
  createParamDecorator,
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthPrincipal, AuthenticatedRequest } from '../auth/auth.types';

export const PLATFORM_ADMIN_KEY = 'ekum:platform-admin';

export function assertPlatformAdmin(principal: AuthPrincipal): void {
  if (!principal.isPlatformAdmin) {
    throw new ForbiddenException({
      code: 'NOT_PLATFORM_ADMIN',
      message: 'Admin access required.',
    });
  }
}

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new ForbiddenException({
        code: 'NOT_PLATFORM_ADMIN',
        message: 'Admin access required.',
      });
    }
    assertPlatformAdmin(request.user);
    return true;
  }
}

export function RequirePlatformAdmin() {
  return applyDecorators(
    SetMetadata(PLATFORM_ADMIN_KEY, true),
    UseGuards(PlatformAdminGuard),
  );
}

export const CurrentPlatformAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new ForbiddenException({
        code: 'NOT_PLATFORM_ADMIN',
        message: 'Admin access required.',
      });
    }
    assertPlatformAdmin(request.user);
    return request.user;
  },
);
