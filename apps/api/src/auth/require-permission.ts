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
import type { CompanyPermissions } from '@ekum/domain-types';
import type { AuthPrincipal, AuthenticatedRequest } from './auth.types';

export type PermissionKey = keyof CompanyPermissions;

export const PERMISSION_KEY = 'ekum:permission';

export function assertPermission(principal: AuthPrincipal, key: PermissionKey): void {
  if (!principal.permissions?.[key]) {
    throw new ForbiddenException({
      code: 'NOT_ALLOWED',
      message: 'You cannot do this.',
    });
  }
}

/** Throws when the principal has no active company (matches CurrentCompanyId decorator). */
export function assertActiveCompany(principal: AuthPrincipal): string {
  const companyId = principal.companyId;
  if (!companyId) {
    throw new ForbiddenException({
      code: 'NO_ACTIVE_COMPANY',
      message: 'Set up your business to continue.',
    });
  }
  return companyId;
}

export function membershipPermissions(row: {
  canUploads: boolean;
  canChats: boolean;
  canOrders: boolean;
  canPayments: boolean;
  canTeam: boolean;
}): CompanyPermissions {
  return {
    uploads: row.canUploads,
    chats: row.canChats,
    orders: row.canOrders,
    payments: row.canPayments,
    team: row.canTeam,
  };
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const key = this.reflector.getAllAndOverride<PermissionKey | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!key) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message: 'You cannot do this.',
      });
    }
    assertPermission(request.user, key);
    return true;
  }
}

/** Marks a route as needing a membership cap. JWT must already have run. */
export function RequirePermission(key: PermissionKey) {
  return applyDecorators(SetMetadata(PERMISSION_KEY, key), UseGuards(PermissionGuard));
}

/** Current principal — use after JwtAuthGuard. */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user as AuthPrincipal;
  },
);
