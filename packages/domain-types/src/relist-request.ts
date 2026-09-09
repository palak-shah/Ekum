import { z } from 'zod';
import type { PublicCompanySummary } from './access';

/** Ask → Allow to put designs in a pack. Not Connection; not view Ask. */
export const RelistRequestStatus = {
  Pending: 'pending',
  Allowed: 'allowed',
  Denied: 'denied',
} as const;
export type RelistRequestStatus =
  (typeof RelistRequestStatus)[keyof typeof RelistRequestStatus];

export const createRelistRequestSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(50),
  /** When set, Ask targets the pack owner (desk chain). */
  sourceCollectionId: z.string().min(1).optional(),
});
export type CreateRelistRequestDto = z.infer<typeof createRelistRequestSchema>;

export interface RelistRequestView {
  id: string;
  productIds: string[];
  productNames: string[];
  status: string;
  threadId: string | null;
  sourceCollectionId: string | null;
  requester: PublicCompanySummary;
  target: PublicCompanySummary;
  createdAt: string;
  decidedAt: string | null;
}

export interface ProductRelistGrantView {
  companyId: string;
  company: PublicCompanySummary;
  grantedAt: string;
  productId: string;
  productName: string;
}

/** Chat metadata kind for pack-permission Ask cards. */
export const RELIST_REQUEST_META = 'relist_request' as const;

/** Viewer pack access for Selection (grants + pending asks + pack-open). */
export interface RelistAccessView {
  grantedProductIds: string[];
  /** productId → pending request id */
  pendingByProductId: Record<string, string>;
  /** Open because source pack published allow-to-relist */
  packOpenProductIds: string[];
}

export const checkRelistAccessSchema = z.object({
  productIds: z.array(z.string().min(1)).max(200),
  /** productId → pack they picked from (desk publish allow). */
  packByProductId: z.record(z.string().min(1)).optional(),
});
export type CheckRelistAccessDto = z.infer<typeof checkRelistAccessSchema>;
