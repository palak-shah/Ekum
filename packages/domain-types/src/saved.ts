import { z } from 'zod';
import type { PublicCompanySummary } from './access';
import type { AuditActorView } from './catalog';

/**
 * Saved references — designs and collections bookmarked for later curate.
 * Stores ids only; no product/collection copies.
 */

export const createSavedItemSchema = z
  .object({
    productId: z.string().min(1).optional(),
    collectionId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasProduct = Boolean(value.productId);
    const hasCollection = Boolean(value.collectionId);
    if (hasProduct === hasCollection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Save exactly one design or collection.',
        path: hasProduct && hasCollection ? ['productId'] : ['productId'],
      });
    }
  });
export type CreateSavedItemDto = z.infer<typeof createSavedItemSchema>;

export interface SavedItemView {
  id: string;
  kind: 'product' | 'collection';
  productId?: string;
  collectionId?: string;
  /** Owner business (opaque — no role labels). */
  company: PublicCompanySummary;
  /** Product or collection title for the row. */
  name: string;
  /** Cover / first image for the row thumb. */
  thumbUrl: string | null;
  /** Design: full album; collection: up to 4 preview images. */
  images: string[];
  /** Design SKU when kind is product. */
  sku?: string | null;
  /** Design rate when kind is product (may be null / on request). */
  rate?: number | null;
  unit?: string | null;
  /** Collection collage +N and size. */
  imageCount?: number;
  productCount?: number;
  createdAt: string;
  /** Staff who saved this for the company (internal). */
  savedBy: AuditActorView | null;
}

export type SavedListView = SavedItemView[];
