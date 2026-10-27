import { ProductStatus } from '@ekum/domain-types';

/** Own album ⋯ while designs are selected — Bookmark · Draft · Publish · Add · Remove · Delete last. Catalog album has no Add. GC has no Remove/Delete. */
export function ownerCollectionSelectMoreIds(
  isGeneral = false,
  isCatalog = false,
): Array<'bookmark' | 'draft' | 'publish' | 'addToPack' | 'remove' | 'delete'> {
  if (isGeneral) return ['bookmark', 'draft', 'publish', 'addToPack'];
  if (isCatalog) return ['bookmark', 'draft', 'publish', 'remove', 'delete'];
  return ['bookmark', 'draft', 'publish', 'addToPack', 'remove', 'delete'];
}

/** Published own designs the owner can Draft from album select. */
export function ownerAlbumDraftableProductIds<
  T extends { id: string; status: string; companyId: string },
>(products: readonly T[], selectedIds: readonly string[], myCompanyId: string): string[] {
  const picked = new Set(selectedIds);
  return products
    .filter(
      (product) =>
        picked.has(product.id) &&
        product.companyId === myCompanyId &&
        product.status === ProductStatus.Published,
    )
    .map((product) => product.id);
}

/** Draft own designs the owner can Publish from album select. */
export function ownerAlbumPublishableProductIds<
  T extends { id: string; status: string; companyId: string },
>(products: readonly T[], selectedIds: readonly string[], myCompanyId: string): string[] {
  const picked = new Set(selectedIds);
  return products
    .filter(
      (product) =>
        picked.has(product.id) &&
        product.companyId === myCompanyId &&
        product.status === ProductStatus.Draft,
    )
    .map((product) => product.id);
}

/** Regular / catalog album stamps this pack so the verb is collection-only. GC leftovers stay catalog-eligible. */
export function stampOwnerAddToPackDesigns<T extends { collectionIds?: string[] | null }>(
  designs: readonly T[],
  albumId: string,
  isGeneral: boolean,
): T[] {
  if (isGeneral) return [...designs];
  return designs.map((design) => ({
    ...design,
    collectionIds: [...new Set([...(design.collectionIds ?? []), albumId].filter(Boolean))],
  }));
}
