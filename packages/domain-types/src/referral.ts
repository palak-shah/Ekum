import { z } from 'zod';
import type { PublicCompanySummary } from './access';

/**
 * Referral / vouch links. A company creates a shareable token that vouches for a
 * business (or is a generic invite). When a recipient opens it, the client can
 * pre-fill an access request with `referredBy` set to the referrer — trust
 * travels through people, not cold outreach.
 */
export const createReferralSchema = z.object({
  targetCompanyId: z.string().min(1).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CreateReferralDto = z.infer<typeof createReferralSchema>;

export interface ReferralView {
  id: string;
  token: string;
  note: string | null;
  referrer: PublicCompanySummary;
  target: PublicCompanySummary | null;
  createdAt: string;
}
