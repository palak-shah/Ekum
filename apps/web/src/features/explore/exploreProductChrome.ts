import type { ExploreProductPreviewView } from '@ekum/domain-types';
import type { DesignSheetProduct } from '@/features/browse/DesignSheet';

/** Sticky Curate · Ask for rates · Order — visitors only, same as pack `visitor`. */
export function exploreProductTradeDock(input: {
  visitor: boolean;
  visible: boolean;
}): boolean {
  return input.visitor && input.visible;
}

/** Chat / `/explore/products/:id` host — keep exclusive catalog stamps so Order remaps. */
export function exploreProductToSheet(
  data: ExploreProductPreviewView,
): DesignSheetProduct {
  return {
    id: data.id,
    name: data.name,
    images: data.images ?? [],
    companyId: data.company.id,
    companyName: data.company.name,
    allowForward: data.allowForward !== false,
    categories: data.categories ?? [],
    description: data.description ?? null,
    unit: data.unit ?? null,
    dispatchUnit: data.dispatchUnit ?? null,
    moq: data.moq ?? null,
    rate: data.rate ?? null,
    rateMax: data.rateMax ?? null,
    ...(data.catalogCollectionId
      ? { catalogCollectionId: data.catalogCollectionId }
      : {}),
    ...(data.catalogOrderMode ? { catalogOrderMode: data.catalogOrderMode } : {}),
  };
}
