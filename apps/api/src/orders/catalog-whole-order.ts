import { BadRequestException } from '@nestjs/common';
import { CatalogOrderMode, CollectionKind, ProductStatus } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

export const CATALOG_WHOLE_REQUIRED = 'CATALOG_WHOLE_REQUIRED';

export function catalogWholeRequiredMessage(name: string) {
  return `${name.trim() || 'This catalog'} is ordered as a whole.`;
}

export function missingWholeCatalogMembers(input: {
  kind?: string | null;
  orderMode?: string | null;
  name: string;
  publishedMemberIds: string[];
  orderedIds: string[];
}): { code: string; message: string } | null {
  if (input.kind !== CollectionKind.Catalog || input.orderMode !== CatalogOrderMode.Whole) {
    return null;
  }
  const ordered = new Set(input.orderedIds);
  if (input.publishedMemberIds.some((id) => !ordered.has(id))) {
    return {
      code: CATALOG_WHOLE_REQUIRED,
      message: catalogWholeRequiredMessage(input.name),
    };
  }
  return null;
}

/** Exclusive own members of a whole catalog cannot be cherry-picked. */
export async function assertExclusiveWholeCatalogComplete(
  prisma: PrismaService,
  productIds: string[],
): Promise<void> {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return;
  const products = await prisma.product.findMany({
    where: { id: { in: unique } },
    select: { id: true, catalogCollectionId: true },
  });
  const catalogIds = [
    ...new Set(
      products
        .map((row) => row.catalogCollectionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (catalogIds.length === 0) return;
  const catalogs = await prisma.collection.findMany({
    where: {
      id: { in: catalogIds },
      kind: CollectionKind.Catalog,
      orderMode: CatalogOrderMode.Whole,
    },
    select: {
      id: true,
      name: true,
      products: {
        select: {
          productId: true,
          product: { select: { status: true } },
        },
      },
    },
  });
  const ordered = new Set(unique);
  for (const catalog of catalogs) {
    const publishedMemberIds = catalog.products
      .filter(
        (row) => !row.product?.status || row.product.status === ProductStatus.Published,
      )
      .map((row) => row.productId);
    const missing = missingWholeCatalogMembers({
      kind: CollectionKind.Catalog,
      orderMode: CatalogOrderMode.Whole,
      name: catalog.name,
      publishedMemberIds,
      orderedIds: [...ordered],
    });
    if (missing) {
      throw new BadRequestException(missing);
    }
  }
}
