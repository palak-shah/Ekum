import { z } from 'zod';
import type { PublicCompanySummary } from './access';

/**
 * Referral / vouch links.
 *
 * - Open invite (no target): shareable “connect with me” link; redeem creates a
 *   pending access request to the referrer (they approve on Buyers).
 * - Targeted vouch: recipient requests access to the target with `referredBy`
 *   pre-filled — not a trust bypass (seller still approves).
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
