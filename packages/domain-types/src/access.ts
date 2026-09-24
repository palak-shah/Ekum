import { z } from 'zod';

/**
 * Access is the named Connect gate (distinct from Follow-ask).
 * The first real enquiry carries intent; approval reveals only what is
 * authorised, never the full catalogue by default.
 */
export const createAccessRequestSchema = z.object({
  targetCompanyId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
  referredBy: z.string().trim().max(120).optional(),
});
export type CreateAccessRequestDto = z.infer<typeof createAccessRequestSchema>;

export const declineAccessRequestSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});
export type DeclineAccessRequestDto = z.infer<typeof declineAccessRequestSchema>;

export interface AccessRequestView {
  id: string;
  company: PublicCompanySummary;
  note: string | null;
  referredBy: string | null;
  status: string;
  createdAt: string;
}

export interface ConnectionView {
  id: string;
  company: PublicCompanySummary;
  status: string;
  createdAt: string;
  /** Current company may pause (active only). */
  canPause: boolean;
  canResume: boolean;
  canBlock: boolean;
  canUnblock: boolean;
}

export interface PublicCompanySummary {
  id: string;
  name: string;
  city: string;
  verification: string;
  logoUrl: string | null;
}

export const FollowStatus = {
  Pending: 'pending',
  Allowed: 'allowed',
} as const;
export type FollowStatus = (typeof FollowStatus)[keyof typeof FollowStatus];

export const FollowAccessKind = {
  Look: 'look',
  Pack: 'pack',
} as const;
export type FollowAccessKind = (typeof FollowAccessKind)[keyof typeof FollowAccessKind];

/** POST /follows — ask, never auto-allow. */
export interface FollowAskResult {
  following: boolean;
  pending: boolean;
}

/** Incoming pending follow (shop inbox). */
export interface FollowAskView {
  company: PublicCompanySummary;
  createdAt: string;
}

/** Allowed follower (shop list; access is shop-facing only). */
export interface ShopFollowerView {
  company: PublicCompanySummary;
  accessKind: FollowAccessKind;
  createdAt: string;
}
