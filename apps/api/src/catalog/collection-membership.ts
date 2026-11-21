import { ProductStatus } from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';

/**
 * Active (buyer-visible) CollectionProduct rows.
 * Excluded tombstones stay in DB for sticky re-add; never treat them as pack members
 * on Explore, Place, share teasers, trade-access, or "has published design" gates.
 */
export const activeCollectionMemberWhere = {
  excluded: false,
} as const satisfies Prisma.CollectionProductWhereInput;

/** Published + active membership — Explore / search / shop live-pack predicate. */
export function hasActivePublishedMemberWhere(): Prisma.CollectionWhereInput {
  return {
    products: {
      some: {
        ...activeCollectionMemberWhere,
        product: { status: ProductStatus.Published },
      },
    },
  };
}

/** Prisma include fragment for buyer-facing pack thumbs (active members only). */
export const activeMemberThumbSelect = {
  where: activeCollectionMemberWhere,
  orderBy: { position: 'asc' as const },
  take: 2,
  select: { product: { select: { images: true } } },
} as const;
