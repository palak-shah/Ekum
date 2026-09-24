import type { CollectionCard, ExploreProductCard } from '@ekum/domain-types';

export function companyOpenedFromChat(state: unknown): boolean {
  return Boolean(
    state &&
      typeof state === 'object' &&
      'fromChat' in state &&
      (state as { fromChat?: unknown }).fromChat === true,
  );
}

/** Design thumbs for the shop mosaic — never a pack cover. */
export function shopCollectionPreviewImages(collection: CollectionCard): string[] {
  return collection.previewImages.map((url) => url?.trim()).filter(Boolean);
}

/** First design photo only. */
export function shopCollectionPhoto(collection: CollectionCard): string | null {
  return shopCollectionPreviewImages(collection)[0] ?? null;
}

export function shopDesignPhoto(product: ExploreProductCard): string | null {
  const first = product.images.find((url) => url?.trim());
  return first?.trim() || null;
}
