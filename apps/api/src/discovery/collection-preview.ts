/**
 * Builds WhatsApp-album preview fields for a collection card: up to four cell
 * URLs plus the full distinct image count used for the +N overlay.
 */
export function collectionPreviewFromRow(collection: {
  coverImage: string | null;
  products?: Array<{ product: { images: string[] } }>;
}): { previewImages: string[]; imageCount: number } {
  const urls: string[] = [];
  const push = (url: string | null | undefined) => {
    if (url && !urls.includes(url)) {
      urls.push(url);
    }
  };

  push(collection.coverImage);
  for (const entry of collection.products ?? []) {
    for (const image of entry.product.images) {
      push(image);
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
    include: { product: { select: { images: true } } },
  },
} as const;
