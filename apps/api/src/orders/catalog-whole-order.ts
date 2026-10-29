import { BadRequestException } from '@nestjs/common';
import {
  CatalogOrderMode,
  CollectionKind,
  ProductStatus,
  catalogWholePeerIds,
  catalogWholeQtyMessage,
  catalogWholeSplitMessage,
  CATALOG_WHOLE_QTY,
  CATALOG_WHOLE_SPLIT,
  isCatalogWholeGroupMember,
} from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

export {
  CATALOG_WHOLE_QTY,
  CATALOG_WHOLE_SPLIT,
  catalogWholeQtyMessage,
  catalogWholeSplitMessage,
};

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

export type CatalogWholeStampFields = {
  catalogCollectionId: string;
  catalogName: string;
  catalogWhole: true;
};

export type CatalogWholePackHint = {
  id: string;
  name: string;
  kind?: string | null;
  orderMode?: string | null;
};

/** Map productId → stamp when the pack or exclusive catalog is Order as whole. */
export async function resolveCatalogWholeStamps(
  prisma: PrismaService,
  productIds: string[],
  pack?: CatalogWholePackHint | null,
): Promise<Map<string, CatalogWholeStampFields>> {
  const stamps = new Map<string, CatalogWholeStampFields>();
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return stamps;
  if (
    pack &&
    pack.kind === CollectionKind.Catalog &&
    pack.orderMode === CatalogOrderMode.Whole
  ) {
    const stamp: CatalogWholeStampFields = {
      catalogCollectionId: pack.id,
      catalogName: pack.name,
      catalogWhole: true,
    };
    for (const id of unique) stamps.set(id, stamp);
    return stamps;
  }
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
  if (catalogIds.length === 0) return stamps;
  const catalogs = await prisma.collection.findMany({
    where: {
      id: { in: catalogIds },
      kind: CollectionKind.Catalog,
      orderMode: CatalogOrderMode.Whole,
    },
    select: { id: true, name: true },
  });
  const byId = new Map(catalogs.map((row) => [row.id, row]));
  for (const product of products) {
    const catalog = product.catalogCollectionId
      ? byId.get(product.catalogCollectionId)
      : undefined;
    if (!catalog) continue;
    stamps.set(product.id, {
      catalogCollectionId: catalog.id,
      catalogName: catalog.name,
      catalogWhole: true,
    });
  }
  return stamps;
}

export function assertEqualWholeCatalogQuantities(
  lines: Array<{ productId?: string | null; quantity: number }>,
  stamps: Map<string, CatalogWholeStampFields>,
): void {
  const byCatalog = new Map<string, { name: string; qty: number }>();
  for (const line of lines) {
    const id = line.productId?.trim();
    if (!id) continue;
    const stamp = stamps.get(id);
    if (!stamp) continue;
    const seen = byCatalog.get(stamp.catalogCollectionId);
    if (!seen) {
      byCatalog.set(stamp.catalogCollectionId, {
        name: stamp.catalogName,
        qty: line.quantity,
      });
      continue;
    }
    if (seen.qty !== line.quantity) {
      throw new BadRequestException({
        code: CATALOG_WHOLE_QTY,
        message: catalogWholeQtyMessage(stamp.catalogName),
      });
    }
  }
}

type WholeLine = {
  id: string;
  catalogCollectionId?: string | null;
  catalogName?: string | null;
  catalogWhole?: boolean | null;
  sourceItemId?: string | null;
};

export function expandCatalogWholeItemIds(items: WholeLine[], orderItemId: string): string[] {
  return catalogWholePeerIds(items, orderItemId);
}

export function fanOutCatalogWholeLines<T extends { orderItemId: string }>(
  items: WholeLine[],
  lines: T[],
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    for (const id of expandCatalogWholeItemIds(items, line.orderItemId)) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ ...line, orderItemId: id });
    }
  }
  return out;
}

export function assertCatalogWholeDecisionTogether(
  items: WholeLine[],
  decisions: Array<{ orderItemId: string; action: string }>,
): void {
  const byId = new Map(decisions.map((row) => [row.orderItemId, row.action]));
  const groups = new Map<string, { name: string; ids: string[] }>();
  for (const item of items) {
    if (!isCatalogWholeGroupMember(item) || !item.catalogCollectionId) continue;
    const id = item.catalogCollectionId;
    const group = groups.get(id) ?? { name: item.catalogName ?? 'Catalog', ids: [] };
    group.ids.push(item.id);
    groups.set(id, group);
  }
  for (const group of groups.values()) {
    const actions = group.ids.map((id) => byId.get(id)).filter((action): action is string => Boolean(action));
    if (actions.length === 0) continue;
    if (actions.some((action) => action !== actions[0])) {
      throw new BadRequestException({
        code: CATALOG_WHOLE_SPLIT,
        message: catalogWholeSplitMessage(group.name),
      });
    }
  }
}
