/**
 * Collection card mosaic: first photo of each member design (position order).
 * No pack cover. Extra shots on a design stay on the design, not the collage.
 */
export function collectionPreviewFromRow(collection: {
  coverImage?: string | null;
  products?: Array<{ product: { images: string[] } }>;
}): { previewImages: string[]; imageCount: number } {
  const urls: string[] = [];
  for (const entry of collection.products ?? []) {
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

/** Prisma include fragment shared by explore, search, and company shop. */
export const collectionCardInclude = {
  company: true,
  _count: { select: { products: true } },
  products: {
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
        },
      },
    },
  },
} as const;
