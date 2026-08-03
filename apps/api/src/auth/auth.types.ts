import type { Request } from 'express';

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
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPrincipal;
}
