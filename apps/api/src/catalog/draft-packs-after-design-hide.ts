import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import { collectionHasPublishedMember } from './collection-schedule';

/** After this design leaves Published, no other Published member remains. */
export function shouldDraftPackAfterDesignHide(remainingPublishedOthers: number): boolean {
  return remainingPublishedOthers < 1;
}

/** Hide a live pack when its last Published design is hidden or removed. */
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

/** Leftover Published packs with only draft members (hide ran before this rule). */
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

export async function draftPublishedPacksWithoutLiveDesign(
  prisma: Pick<PrismaService, 'collection'>,
  rows: Array<{
    id: string;
    status: string;
    products?: Array<{ product?: { status?: string } | null } | null> | null;
  }>,
): Promise<Set<string>> {
  const ids = publishedPackIdsWithoutLiveDesign(rows);
  if (ids.length === 0) return new Set();
  await prisma.collection.updateMany({
    where: { id: { in: ids }, status: CollectionStatus.Published },
    data: { status: CollectionStatus.Draft, exploreActivityAt: null },
  });
  return new Set(ids);
}
