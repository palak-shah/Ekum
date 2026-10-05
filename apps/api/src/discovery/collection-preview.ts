import { ProductStatus } from '@ekum/domain-types';

function memberIsPublished(product: { status?: string | null }): boolean {
  return product.status === ProductStatus.Published;
}

/**
 * Collection card mosaic: first photo of each live member design (position order).
 * No pack cover. Extra shots on a design stay on the design, not the collage.
 * Unpublished members never count as a design on Explore / shop / search.
 */
export function collectionPreviewFromRow(collection: {
  coverImage?: string | null;
  products?: Array<{ product: { images: string[]; status?: string | null } }>;
}): { previewImages: string[]; imageCount: number } {
  const urls: string[] = [];
  for (const entry of collection.products ?? []) {
    if (!memberIsPublished(entry.product)) continue;
    const first = entry.product.images.find((url) => url?.trim());
    if (first && !urls.includes(first)) {
      urls.push(first);
    }
  }

  return {
    previewImages: urls.slice(0, 4),
    imageCount: urls.length,
  };
}

/** Live members only — draft / archived designs are not a pack on Explore. */
export const publishedCollectionMemberWhere = {
  product: { status: ProductStatus.Published },
} as const;

/** Prisma include fragment shared by explore, search, and company shop. */
export const collectionCardInclude = {
  company: true,
  _count: {
    select: {
      products: { where: publishedCollectionMemberWhere },
    },
  },
  products: {
    where: publishedCollectionMemberWhere,
    orderBy: { position: 'asc' as const },
    take: 12,
    include: {
      product: {
        select: {
          images: true,
          companyId: true,
          name: true,
          sku: true,
          description: true,
          categories: true,
          status: true,
          company: { select: { name: true } },
        },
      },
    },
  },
} as const;
