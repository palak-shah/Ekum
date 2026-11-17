import { isDesignOrPackPath } from '@/features/browse/selectionWorkspaceBarVisibility';

/**
 * Share / Message payload for the Selection dock.
 * Design Share on a pack/design page → selected designs only (no leftover album).
 * Collection Share elsewhere → albums when picked; designs when picked.
 */
export function selectionShareCatalogPayload(input: {
  pathname: string;
  pageSelecting: boolean;
  albums: { collectionId: string; name: string; image?: string | null }[];
  products: { productId: string; name: string; image?: string | null }[];
}): {
  collections: { collectionId: string; name: string; image?: string | null }[];
  products: { productId: string; name: string; image?: string | null }[];
} {
  const designShareOnPack =
    input.pageSelecting &&
    isDesignOrPackPath(input.pathname) &&
    input.products.length > 0;
  return {
    collections: designShareOnPack ? [] : input.albums,
    products: input.products,
  };
}
