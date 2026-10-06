import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import { collectionHasPublishedMember } from './collection-schedule';

/**
 * Auto-Hide of a live pack is off. Traders unpublish with **Hide from Explore**.
 * Explore still omits packs with no published members.
 */
export function shouldDraftPackAfterDesignHide(_remainingPublishedOthers: number): boolean {
  return false;
}

/** Kept for hide-design call sites; does not change pack status. */
export async function draftPacksLeftWithoutPublishedDesign(
  prisma: Pick<PrismaService, 'collectionProduct' | 'collection'>,
  productId: string,
): Promise<number> {
  const memberships = await prisma.collectionProduct.findMany({
    where: { productId, collection: { status: CollectionStatus.Published } },
    select: { collectionId: true },
  });
  let drafted = 0;
  for (const { collectionId } of memberships) {
    const remainingPublishedOthers = await prisma.collectionProduct.count({
      where: {
        collectionId,
        productId: { not: productId },
        product: { status: ProductStatus.Published },
      },
    });
    if (!shouldDraftPackAfterDesignHide(remainingPublishedOthers)) continue;
    const result = await prisma.collection.updateMany({
      where: { id: collectionId, status: CollectionStatus.Published },
      data: { status: CollectionStatus.Draft, exploreActivityAt: null },
    });
    drafted += result.count;
  }
  return drafted;
}

/** Packs that are Published but have no published member (Explore omit — status unchanged). */
export function publishedPackIdsWithoutLiveDesign(
  rows: Array<{
    id: string;
    status: string;
    products?: Array<{ product?: { status?: string } | null } | null> | null;
  }>,
): string[] {
  return rows
    .filter(
      (row) =>
        row.status === CollectionStatus.Published && !collectionHasPublishedMember(row.products),
    )
    .map((row) => row.id);
}

/** Does not write Draft. Callers may still omit these ids from Explore. */
export async function draftPublishedPacksWithoutLiveDesign(
  _prisma: Pick<PrismaService, 'collection'>,
  rows: Array<{
    id: string;
    status: string;
    products?: Array<{ product?: { status?: string } | null } | null> | null;
  }>,
): Promise<Set<string>> {
  return new Set(publishedPackIdsWithoutLiveDesign(rows));
}
