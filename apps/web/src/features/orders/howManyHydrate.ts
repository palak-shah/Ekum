import type { ExploreProductPreviewView, ProductView } from '@ekum/domain-types';

/** Overlay explore detail onto a pile stub (name/thumb only). */
export function applyHowManyDetail(
  product: ProductView,
  detail: ExploreProductPreviewView | null | undefined,
): ProductView {
  if (!detail) return product;
  const categories =
    detail.categories && detail.categories.length > 0
      ? detail.categories
      : (product.categories ?? []);
  return {
    ...product,
    name: detail.name?.trim() || product.name,
    images: detail.images?.length ? detail.images : product.images,
    categories,
    unit: detail.unit ?? product.unit ?? null,
    moq: detail.moq !== undefined ? detail.moq : (product.moq ?? null),
    rate: detail.visible === false ? (product.rate ?? null) : (detail.rate ?? product.rate ?? null),
  };
}
