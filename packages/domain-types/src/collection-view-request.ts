import { z } from 'zod';
import type { PublicCompanySummary } from './access';

/** Ask → Allow for one collection. Not Network Connection. */
export const CollectionViewRequestStatus = {
  Pending: 'pending',
  Allowed: 'allowed',
  Denied: 'denied',
} as const;
export type CollectionViewRequestStatus =
  (typeof CollectionViewRequestStatus)[keyof typeof CollectionViewRequestStatus];

export const createCollectionViewRequestSchema = z.object({
  collectionId: z.string().min(1),
});
export type CreateCollectionViewRequestDto = z.infer<
  typeof createCollectionViewRequestSchema
>;

export interface CollectionViewRequestView {
  id: string;
  collectionId: string;
  collectionName: string;
  status: string;
  threadId: string | null;
  requester: PublicCompanySummary;
  target: PublicCompanySummary;
  createdAt: string;
  decidedAt: string | null;
}

export interface CollectionViewGrantView {
  companyId: string;
  company: PublicCompanySummary;
  grantedAt: string;
  collectionId: string;
  collectionName: string;
}

/** Chat metadata kind for pack Ask cards. */
export const COLLECTION_VIEW_REQUEST_META = 'collection_view_request' as const;
