import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth.types';

/**
 * Injects the id of the company the user is currently acting as. Throws if the
 * user has not yet completed onboarding (no active company).
 */
export const CurrentCompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const companyId = request.user?.companyId;
    if (!companyId) {
      throw new ForbiddenException({
        code: 'NO_ACTIVE_COMPANY',
        message: 'Set up your business to continue.',
      });
    }
    return companyId;
  },
);
