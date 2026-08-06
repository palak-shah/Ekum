import { z } from 'zod';

/**
 * Access is the named, permissioned gate (distinct from permissionless Follow).
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
  /** Whether the current company is the catalogue owner or the viewer. */
  role: 'owner' | 'viewer';
  status: string;
  createdAt: string;
}

export interface PublicCompanySummary {
  id: string;
  name: string;
  city: string;
  verification: string;
  logoUrl: string | null;
}
