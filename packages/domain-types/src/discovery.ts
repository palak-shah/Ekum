import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import type { PublicCompanySummary } from './access';
import type { ProductView } from './catalog';

/**
 * Discovery contracts. Explore is a structured browse (by category / city /
 * recency — never engagement ranking). Search is federated across companies,
 * collections, and designs (products). Both are cursor-paginated and, on the
 * server, visibility-filtered: a company blocked by an owner never sees that
 * owner's content, and only published content is discoverable.
 */

const booleanFlag = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

export const exploreScopeValues = ['buy', 'sell'] as const;
export type ExploreScope = (typeof exploreScopeValues)[number];

export const exploreQuerySchema = cursorPageQuerySchema.extend({
  category: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  following: booleanFlag,
  /** Buy = supplier collections; Sell = companies that buy (dual-role Explore toggle). */
  scope: z.enum(exploreScopeValues).optional(),
});
export type ExploreQuery = z.infer<typeof exploreQuerySchema>;

export const searchTypeValues = ['company', 'collection', 'design'] as const;
export type SearchType = (typeof searchTypeValues)[number];

export const searchQuerySchema = cursorPageQuerySchema.extend({
  q: z.string().trim().min(1).max(80),
  type: z.enum(searchTypeValues),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export interface CompanyCard {
  id: string;
  name: string;
  city: string;
  verification: string;
  logoUrl: string | null;
  sellCategories: string[];
  buyCategories: string[];
}

export interface CollectionCard {
  id: string;
  name: string;
  coverImage: string | null;
  /** Up to 4 image URLs for WhatsApp-style album cells. */
  previewImages: string[];
  /** Total distinct images (cover + products) for the +N overlay. */
  imageCount: number;
  productCount: number;
  status: string;
  updatedAt: string;
  company: PublicCompanySummary;
}

export interface DiscoveryProductCard {
  id: string;
  name: string;
  images: string[];
  rate: number | null;
  unit: string | null;
  company: PublicCompanySummary;
}

/** Product card in the Explore mixed feed (posted to market). */
export interface ExploreProductCard {
  id: string;
  name: string;
  images: string[];
  rate: number | null;
  unit: string | null;
  postedAt: string;
  company: PublicCompanySummary;
}

/** Discriminated Explore buy-feed item — collection album or single product. */
export type ExplorePost =
  | {
      kind: 'collection';
      id: string;
      postedAt: string;
      collection: CollectionCard;
    }
  | {
      kind: 'product';
      id: string;
      postedAt: string;
      product: ExploreProductCard;
    };

/**
 * A cross-company collection view. Non-connected viewers get a preview
 * (products is null — the "blurred preview" trust rule); connected viewers get
 * the full product list.
 */
export interface CollectionPreviewView extends CollectionCard {
  connected: boolean;
  products: ProductView[] | null;
}

/** Cross-company product post. `visible=false` means body is gated (connections). */
export interface ExploreProductPreviewView extends ExploreProductCard {
  connected: boolean;
  visible: boolean;
  description?: string | null;
  categories?: string[];
}
