import { z } from 'zod';
import { unitValues } from './enums';

/**
 * Catalog contracts. A Product is the live entity: its name is required, its
 * SKU/reference code is optional forever, and its rate is nullable ("on
 * request") all the way down. Products and Collections are separate and joined
 * many-to-many. Orders will snapshot a product at order time (see ProductSnapshot).
 */

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  sku: z.string().trim().max(64).optional(),
  description: z.string().trim().max(1000).optional(),
  // null / omitted => "on request"; a number is a per-unit rate.
  rate: z.number().nonnegative().nullable().optional(),
  unit: z.enum(unitValues).optional(),
  categories: z.array(z.string().trim().min(1)).max(20).default([]),
  images: z.array(z.string().url()).max(12).default([]),
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  description: z.string().trim().max(1000).optional(),
  coverImage: z.string().url().optional(),
});
export type CreateCollectionDto = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema.partial();
export type UpdateCollectionDto = z.infer<typeof updateCollectionSchema>;

/** Replaces the ordered set of products in a collection. */
export const setCollectionProductsSchema = z.object({
  productIds: z.array(z.string().min(1)).max(1000),
});
export type SetCollectionProductsDto = z.infer<typeof setCollectionProductsSchema>;

export interface ProductView {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  rate: number | null;
  unit: string | null;
  categories: string[];
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionView {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetailView extends CollectionView {
  products: ProductView[];
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
