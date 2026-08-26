import type { Request } from 'express';
import type { CompanyPermissions } from '@ekum/domain-types';

/** Claims carried by the short-lived JWT access token. */
export interface JwtPayload {
  sub: string;
  phone: string;
  companyId: string | null;
}

/** The authenticated principal attached to the request by JwtAuthGuard. */
export interface AuthPrincipal {
  userId: string;
  phone: string;
  companyId: string | null;
  /** The user's role in the active company (owner | staff), null without one. */
  role: string | null;
  /** Membership caps; null when there is no company. */
  permissions: CompanyPermissions | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPrincipal;
}
