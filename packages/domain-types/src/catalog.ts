import { z } from 'zod';
import {
  orderPathPreferenceValues,
  publishAudienceValues,
  rateVisibilityValues,
  unitValues,
} from './enums';

/**
 * Catalog contracts. A Product (design) is the live entity: name required; rate
 * nullable ("on request"). SKU is optional on input — if omitted the API assigns
 * a stable company-unique code that never changes for that product's life.
 * Products and Collections are separate (many-to-many). Client "catalogue" means
 * an order-as-whole pack (future); shop publish is "Publish design", not catalogue.
 */

/** Staff who/when on catalog + orders rows (full AuditLog UI later). */
export interface AuditActorView {
  id: string;
  name: string | null;
}

/** Own-library list sort + created date range. */
export const listCatalogQuerySchema = z.object({
  sort: z.enum(['newest', 'oldest']).optional().default('newest'),
  /** Inclusive start (ISO or YYYY-MM-DD). */
  createdFrom: z.string().min(1).max(40).optional(),
  /** Inclusive end (ISO or YYYY-MM-DD). */
  createdTo: z.string().min(1).max(40).optional(),
});
export type ListCatalogQuery = z.infer<typeof listCatalogQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  /** Optional on create; server fills a stable SKU when omitted. */
  sku: z.string().trim().min(1).max(64).optional(),
  /** Seller notes for buyers (fabric, size, width, etc.). */
  description: z.string().trim().max(1000).optional(),
  /** Minimum order in pieces; null clears on update. */
  moq: z.number().int().positive().max(1_000_000).nullable().optional(),
  // null / omitted => "on request"; a number is a per-unit rate.
  rate: z.number().nonnegative().nullable().optional(),
  unit: z.enum(unitValues).optional(),
  categories: z.array(z.string().trim().min(1)).max(20).default([]),
  images: z
    .array(
      z.string().url({
        message: 'Photo isn’t ready yet. Remove it and add it again.',
      }),
    )
    .default([]),
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

/** ISO datetime or YYYY-MM-DD; null clears. Parsed to UTC bounds in the API. */
const optionalScheduleInstant = z.union([z.string().min(1).max(40), z.null()]).optional();

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  description: z.string().trim().max(1000).optional(),
  coverImage: z
    .string()
    .url({ message: 'Photo isn’t ready yet. Remove it and add it again.' })
    .optional(),
  /** Live window start. null clears. */
  startsAt: optionalScheduleInstant,
  /** Live window end. null = evergreen. */
  endsAt: optionalScheduleInstant,
  /** Direct | I handle; null/omit = use Profile default at order time. */
  orderPathPreference: z.enum(orderPathPreferenceValues).nullable().optional(),
});
export type CreateCollectionDto = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema.partial();
export type UpdateCollectionDto = z.infer<typeof updateCollectionSchema>;

/** Replaces the ordered set of products in a collection. */
export const setCollectionProductsSchema = z.object({
  productIds: z.array(z.string().min(1)).max(1000),
});
export type SetCollectionProductsDto = z.infer<typeof setCollectionProductsSchema>;

/** Audience + rate visibility decided in the publish sheet (not a settings page). */
export const publishCollectionSchema = z
  .object({
    audience: z.enum(publishAudienceValues).default('connections'),
    rateVisibility: z.enum(rateVisibilityValues).default('on_request'),
    /** When false, buyers cannot forward this pack/design beyond the supplier. */
    allowForward: z.boolean().default(true),
    /** Direct | I handle for orders from this pack; null = Profile default. */
    orderPathPreference: z.enum(orderPathPreferenceValues).nullable().optional(),
    /** Optional single buyer group (legacy / exactly-one convenience). */
    groupId: z.string().min(1).optional(),
    /** Buyer groups chosen on Publish — restore chips on Visibility. */
    groupIds: z.array(z.string().min(1)).max(50).optional(),
    /** Required when audience is `selected` — company IDs that may see this collection. */
    companyIds: z.array(z.string().min(1)).max(500).optional(),
    /** Required the first time a company ever publishes — unlocks canPublish. */
    consentToSell: z.boolean().optional(),
    /** Live window start. Omit to leave unchanged; null = live now. */
    startsAt: optionalScheduleInstant,
    /** Live window end. Omit to leave unchanged; null = evergreen. */
    endsAt: optionalScheduleInstant,
  })
  .superRefine((value, ctx) => {
    if (value.audience === 'selected' && (!value.companyIds || value.companyIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pick at least one company for a selected audience.',
        path: ['companyIds'],
      });
    }
  });
export type PublishCollectionDto = z.infer<typeof publishCollectionSchema>;

/**
 * Publish a design = live on Explore for the chosen audience.
 * Same sheet as collections (audience / rates / forward).
 */
export const postProductToMarketSchema = publishCollectionSchema;
export type PostProductToMarketDto = z.infer<typeof postProductToMarketSchema>;

/** Alias: publish and Explore are one step. */
export const publishProductSchema = postProductToMarketSchema;
export type PublishProductDto = PostProductToMarketDto;

export interface ProductView {
  id: string;
  /** Owning company — needed to detect curated (foreign) collection members. */
  companyId: string;
  /** Present on Explore pack previews so Direct confirm can name each owner. */
  companyName?: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  /** Minimum order quantity in pieces; null when not set. */
  moq: number | null;
  rate: number | null;
  unit: string | null;
  categories: string[];
  images: string[];
  status: string;
  audience: string;
  rateVisibility: string;
  audienceCompanyIds: string[];
  /** Buyer group IDs last chosen for selected audience (empty when custom list). */
  audienceGroupIds: string[];
  allowForward: boolean;
  /** ISO time when live on Explore; null when draft/hidden. */
  postedToMarketAt: string | null;
  createdBy: AuditActorView | null;
  updatedBy: AuditActorView | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionView {
  id: string;
  companyId: string;
  /**
   * Distinct member shops (owner list/detail). Used for the owner-only
   * “From {shop}” line. Empty when members were not loaded.
   */
  memberShops: { id: string; name: string }[];
  name: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  audience: string;
  rateVisibility: string;
  audienceCompanyIds: string[];
  /** Buyer group IDs last chosen for selected audience (empty when custom list). */
  audienceGroupIds: string[];
  allowForward: boolean;
  /**
   * Direct | I handle for orders from this pack.
   * null = use pack owner Profile default at order time.
   */
  orderPathPreference: string | null;
  productCount: number;
  /** Distinct photos across cover + member designs. */
  photoCount: number;
  /** Up to 4 member image URLs for seller collage tiles. */
  previewImages: string[];
  startsAt: string | null;
  endsAt: string | null;
  createdBy: AuditActorView | null;
  updatedBy: AuditActorView | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetailView extends CollectionView {
  products: ProductView[];
}

export const createShareLinkSchema = z
  .object({
    collectionId: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasCollection = Boolean(value.collectionId);
    const hasProduct = Boolean(value.productId);
    if (hasCollection === hasProduct) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pick one album or one design.',
        path: ['collectionId'],
      });
    }
  });
export type CreateShareLinkDto = z.infer<typeof createShareLinkSchema>;

export interface ShareLinkDesignPreview {
  id: string;
  name: string;
  image: string | null;
}

export interface ShareLinkView {
  token: string;
  kind: 'collection' | 'product';
  targetId: string;
  name: string;
  /** Catalog owner business — used in WhatsApp share / OG. */
  companyName: string;
  image: string | null;
  audience: string;
  /** Everyone + live: guest may see design thumbs. Closed packs stay cover + name. */
  open: boolean;
  designs: ShareLinkDesignPreview[];
  expired: boolean;
  path: string;
}

/**
 * The immutable shape captured onto an order line at order time. Defined here so
 * the Orders domain and the future Flutter client share one contract. Prices and
 * names on a live Product can change; a placed order must not.
 */
export interface ProductSnapshot {
  productId: string;
  name: string;
  sku: string | null;
  rate: number | null;
  unit: string | null;
  image: string | null;
}
