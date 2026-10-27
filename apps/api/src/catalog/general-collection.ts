import {
  CollectionKind,
  CollectionStatus,
  ProductStatus,
} from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export const GENERAL_COLLECTION_DEFAULT_NAME = 'General Collection';

type Db = {
  collection: {
    findFirst: (args: Prisma.CollectionFindFirstArgs) => Promise<{
      id: string;
      name: string;
      kind: string;
      status: string;
    } | null>;
    create: (args: Prisma.CollectionCreateArgs) => Promise<{ id: string }>;
  };
};

export function isGeneralKind(kind: string | null | undefined): boolean {
  return kind === CollectionKind.General;
}

export function isCatalogKind(kind: string | null | undefined): boolean {
  return kind === CollectionKind.Catalog;
}

/** User-facing pack noun — catalog never reads as collection. */
export function packNoun(kind: string | null | undefined): 'catalog' | 'collection' {
  return isCatalogKind(kind) ? 'catalog' : 'collection';
}

/** Shop / Explore / share — General Collection is owner library only. */
export function publicCollectionKindWhere(): Prisma.CollectionWhereInput {
  return { kind: { not: CollectionKind.General } };
}

export function qualifyingCollectionWhere(companyId: string): Prisma.CollectionWhereInput {
  return {
    companyId,
    kind: { in: [CollectionKind.Regular, CollectionKind.Catalog] },
    status: { not: CollectionStatus.Archived },
  };
}

/** Own non-deleted products with no qualifying regular/catalog membership. */
export function generalMemberProductWhere(companyId: string): Prisma.ProductWhereInput {
  return {
    companyId,
    status: { not: ProductStatus.Archived },
    collections: {
      none: {
        collection: qualifyingCollectionWhere(companyId),
      },
    },
  };
}

/** Computed GC members as join-shaped rows (General Collection has no CollectionProduct). */
export function generalMemberJoinRows<T extends { id: string; createdAt: Date }>(
  collectionId: string,
  members: T[],
): Array<{
  id: string;
  collectionId: string;
  productId: string;
  position: number;
  createdAt: Date;
  product: T;
}> {
  return members.map((product, position) => ({
    id: `gc_${product.id}`,
    collectionId,
    productId: product.id,
    position,
    createdAt: product.createdAt,
    product,
  }));
}

export function assertNotGeneralMutation(kind: string | null | undefined, action: string): void {
  if (!isGeneralKind(kind)) return;
  throw new BadRequestException({
    code: 'GENERAL_COLLECTION_READONLY',
    message: `General Collection ${action}.`,
  });
}

export async function ensureGeneralCollection(
  db: Db,
  companyId: string,
  userId?: string,
): Promise<{ id: string; name: string }> {
  const existing = await db.collection.findFirst({
    where: { companyId, kind: CollectionKind.General },
    select: { id: true, name: true, kind: true, status: true },
  });
  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  const clash = await db.collection.findFirst({
    where: {
      companyId,
      status: { not: CollectionStatus.Archived },
      name: { equals: GENERAL_COLLECTION_DEFAULT_NAME, mode: 'insensitive' },
    },
    select: { id: true, name: true, kind: true, status: true },
  });
  const name = clash
    ? `${GENERAL_COLLECTION_DEFAULT_NAME} · library`
    : GENERAL_COLLECTION_DEFAULT_NAME;

  const created = await db.collection.create({
    data: {
      id: `gc_${companyId}`,
      companyId,
      name,
      kind: CollectionKind.General,
      status: CollectionStatus.Published,
      createdByUserId: userId ?? null,
      updatedByUserId: userId ?? null,
    },
    select: { id: true },
  });
  return { id: created.id, name };
}
