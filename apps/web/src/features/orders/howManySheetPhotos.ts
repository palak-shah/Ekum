import type { ProductView } from '@ekum/domain-types';
import { howManyLineMeta } from '@/features/orders/howManyLineMeta';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';

export function howManyPhotoUrls(product: Pick<ProductView, 'images'>): string[] {
  return (product.images ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => toAbsoluteMediaUrl(url));
}

export function howManyPhotoInfo(
  product: Pick<
    ProductView,
    'name' | 'sku' | 'rate' | 'rateMax' | 'unit' | 'moq'
  >,
): { caption: string; detail: string } {
  const facts = howManyLineMeta(product);
  const sku = product.sku?.trim();
  const bits = [facts, sku].filter(Boolean);
  return { caption: product.name, detail: bits.join(' · ') };
}

function expandPerPhoto<T>(
  products: Pick<ProductView, 'images'>[],
  value: (product: Pick<ProductView, 'images'>, index: number) => T,
): T[] {
  return products.flatMap((product, index) =>
    howManyPhotoUrls(product).map(() => value(product, index)),
  );
}

export function howManyGalleryUrls(products: Pick<ProductView, 'images'>[]): string[] {
  return products.flatMap((product) => howManyPhotoUrls(product));
}

export function howManyGalleryCaptions(
  products: Pick<
    ProductView,
    'name' | 'sku' | 'rate' | 'rateMax' | 'unit' | 'moq' | 'images'
  >[],
): string[] {
  return expandPerPhoto(products, (_, index) => howManyPhotoInfo(products[index]!).caption);
}

export function howManyGalleryDetails(
  products: Pick<
    ProductView,
    'name' | 'sku' | 'rate' | 'rateMax' | 'unit' | 'moq' | 'images'
  >[],
): string[] {
  return expandPerPhoto(products, (_, index) => howManyPhotoInfo(products[index]!).detail);
}

export function galleryIndexForProduct(
  products: Pick<ProductView, 'id' | 'images'>[],
  productId: string,
): number {
  let index = 0;
  for (const product of products) {
    if (product.id === productId) return index;
    index += howManyPhotoUrls(product).length;
  }
  return 0;
}
