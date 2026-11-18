import { CollectionKind, CollectionStatus, ProductStatus } from '@ekum/domain-types';

/**
 * Pure leftover rule — mirrors `generalMemberProductWhere` without Prisma.
 * Used by regression tests; do not invent a second membership system.
 */
export function isPackMembershipLeftover(input: {
  productStatus: string;
  joins: ReadonlyArray<{
    kind: string;
    collectionStatus: string;
  }>;
}): boolean {
  if (input.productStatus === ProductStatus.Archived) return false;
  return !input.joins.some(
    (join) =>
      (join.kind === CollectionKind.Regular || join.kind === CollectionKind.Catalog) &&
      join.collectionStatus !== CollectionStatus.Archived,
  );
}
