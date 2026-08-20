import { z } from 'zod';
import { cursorPageQuerySchema } from './common';
import type { PublicCompanySummary } from './access';
import type { ProductView } from './catalog';

/**
 * Discovery contracts. Explore answers “who should I talk to next about
 * business?” via opportunity sections (company-primary) and universal search —
 * never engagement ranking. Narrow filters (category / city) are progressive.
 * Search is federated across companies, collections, designs, cities, and
 * categories. Visibility-filtered: blocked companies never appear.
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
  /**
   * When true, only companies with a published collection or Explore-posted
   * design (audience-visible). Response rows are ExploreSupplierCard.
   */
  posted: booleanFlag,
  /** Buy = suppliers; sell = businesses that buy. Used by section endpoints, not Explore modes. */
  scope: z.enum(exploreScopeValues).optional(),
});
export type ExploreQuery = z.infer<typeof exploreQuerySchema>;

/** Optional Narrow filters for the sectioned Explore home. */
export const exploreHomeQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().min(1).max(80).optional(),
});
export type ExploreHomeQuery = z.infer<typeof exploreHomeQuerySchema>;

export const searchTypeValues = ['company', 'collection', 'design'] as const;
export type SearchType = (typeof searchTypeValues)[number];

export const searchQuerySchema = cursorPageQuerySchema.extend({
  q: z.string().trim().min(1).max(80),
  /** Omit for universal (grouped) search across all result kinds. */
  type: z.enum(searchTypeValues).optional(),
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

/** Company-led collection opportunity for Explore sections. */
export interface ExploreOpportunity {
  collection: CollectionCard;
  /** One sparse line: Connected · GST verified · Matches Sarees (or city). */
  relevance: string | null;
}

/** Standalone design opportunity (no collection required). */
export interface ExploreDesignOpportunity {
  product: ExploreProductCard;
  relevance: string | null;
}

/** Buyer/supplier company card for Explore business shelves. */
export interface ExploreBuyerOpportunity {
  company: CompanyCard;
  /** Why-connect line (network → match → trust/city). */
  relevance: string | null;
  /** Up to 4 post thumbs when they have published designs/collections. */
  previewImages: string[];
  designCount: number;
  collectionCount: number;
  /** ISO time of the newest visible post; null when they have none. */
  latestPostedAt: string | null;
}

/** Recently published businesses for the Explore Stories rail. */
export interface ExploreStory {
  company: PublicCompanySummary;
  latestPostedAt: string;
}

/** Supplier directory row — company that has posted designs and/or collections. */
export interface ExploreSupplierCard {
  company: CompanyCard;
  relevance: string | null;
  /** Up to 4 recent post images (designs or collection covers). */
  previewImages: string[];
  designCount: number;
  collectionCount: number;
  /** ISO time of the newest visible post. */
  latestPostedAt: string;
}

/**
 * Sectioned Explore home — no Buying/Selling mode.
 * Collections and designs are separate shelves. Own company never appears.
 * `lookingForWhatYouSell` is null when the viewer does not sell.
 */
export interface ExploreHomeView {
  forYou: ExploreOpportunity[];
  fromNetwork: ExploreOpportunity[];
  /** Recommended standalone designs (not in network shelf). */
  designsForYou: ExploreDesignOpportunity[];
  /** Designs from companies the viewer follows. */
  designsFromNetwork: ExploreDesignOpportunity[];
  suggestedBusinesses: ExploreBuyerOpportunity[];
  lookingForWhatYouSell: ExploreBuyerOpportunity[] | null;
  /** Recently published businesses (Explore Stories rail); empty → hide rail. */
  stories: ExploreStory[];
}

/** Grouped universal search (type omitted on `/search`). */
export interface UniversalSearchResults {
  companies: CompanyCard[];
  collections: CollectionCard[];
  designs: DiscoveryProductCard[];
  cities: string[];
  categories: string[];
}

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
  /** Minimum order in pieces when the seller set one. */
  moq?: number | null;
  categories?: string[];
}
