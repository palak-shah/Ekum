import type { CollectionCard, CollectionView } from '@ekum/domain-types';

/** Map ceiling-safe card names into owner-style memberShops for From line. */
export function memberShopsFromSourceNames(
  sourceShopNames: string[],
): CollectionView['memberShops'] {
  return sourceShopNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({ id: `credit-${index}`, name }));
}

export function shopCollectionShelfMeta(input: {
  isOwn: boolean;
  collection: CollectionCard;
  /** Own library packs — real memberShops when isOwn. */
  libraryMemberShops?: CollectionView['memberShops'];
}): {
  hideLibraryMeta: boolean;
  memberShops: CollectionView['memberShops'];
} {
  const { isOwn, collection, libraryMemberShops } = input;
  if (isOwn) {
    return {
      hideLibraryMeta: false,
      memberShops: libraryMemberShops ?? [],
    };
  }
  const show =
    collection.showSourceShops === true && (collection.sourceShopNames?.length ?? 0) > 0;
  if (!show) {
    return { hideLibraryMeta: true, memberShops: [] };
  }
  return {
    hideLibraryMeta: false,
    memberShops: memberShopsFromSourceNames(collection.sourceShopNames),
  };
}

export function toShopCollectionRow(
  collection: CollectionCard,
  memberShops: CollectionView['memberShops'] = [],
) {
  return {
    id: collection.id,
    name: collection.name,
    status: collection.status,
    kind: collection.kind,
    libraryThumb: collection.coverImage,
    coverImage: collection.coverImage,
    companyId: collection.company.id,
    memberShops,
  };
}
