import { Injectable } from '@nestjs/common';
import type { Collection, CollectionProduct, Product, User } from '@prisma/client';
import type { CollectionDetailView, CollectionView, ProductView } from '@ekum/domain-types';
import { toAuditActor } from '../common/audit';
import { collectionPreviewFromRow } from '../discovery/collection-preview';

type ActorUser = Pick<User, 'id' | 'name'>;

type ProductWithActors = Product & {
  createdByUser?: ActorUser | null;
  updatedByUser?: ActorUser | null;
  company?: { id: string; name: string } | null;
};

type MemberProduct = Product & {
  company?: { id: string; name: string } | null;
};

type CollectionWithCount = Collection & {
  _count?: { products: number };
  products?: (CollectionProduct & { product: MemberProduct })[];
  createdByUser?: ActorUser | null;
  updatedByUser?: ActorUser | null;
};
type CollectionWithProducts = Collection & {
  products: (CollectionProduct & { product: ProductWithActors })[];
  createdByUser?: ActorUser | null;
  updatedByUser?: ActorUser | null;
};

export const productActorInclude = {
  createdByUser: { select: { id: true, name: true } },
  updatedByUser: { select: { id: true, name: true } },
} as const;

export const collectionActorInclude = {
  createdByUser: { select: { id: true, name: true } },
  updatedByUser: { select: { id: true, name: true } },
} as const;

@Injectable()
export class CatalogSerializer {
  toProductView(product: ProductWithActors): ProductView {
    return {
      id: product.id,
      companyId: product.companyId,
      companyName: product.company?.name ?? null,
      name: product.name,
      sku: product.sku,
      description: product.description,
      moq: product.moq ?? null,
      // A null rate means "on request"; Decimal is converted for the wire.
      rate: product.rate === null ? null : product.rate.toNumber(),
      unit: product.unit,
      categories: product.categories,
      images: product.images,
      status: product.status,
      audience: product.audience ?? 'connections',
      rateVisibility: product.rateVisibility ?? 'on_request',
      audienceCompanyIds: product.audienceCompanyIds ?? [],
      audienceGroupIds: product.audienceGroupIds ?? [],
      allowForward: product.allowForward !== false,
      postedToMarketAt: product.postedToMarketAt
        ? product.postedToMarketAt.toISOString()
        : null,
      createdBy: toAuditActor(product.createdByUser),
      updatedBy: toAuditActor(product.updatedByUser),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  toCollectionView(collection: CollectionWithCount, productCount?: number): CollectionView {
    const preview = collectionPreviewFromRow(collection);
    const shops = new Map<string, string>();
    for (const row of collection.products ?? []) {
      const id = row.product.company?.id ?? row.product.companyId;
      const name = row.product.company?.name ?? '';
      if (id) shops.set(id, name || shops.get(id) || '');
    }
    return {
      id: collection.id,
      companyId: collection.companyId,
      memberShops: [...shops.entries()].map(([id, name]) => ({ id, name })),
      name: collection.name,
      description: collection.description,
      coverImage: collection.coverImage,
      status: collection.status,
      audience: collection.audience,
      rateVisibility: collection.rateVisibility,
      audienceCompanyIds: collection.audienceCompanyIds ?? [],
      audienceGroupIds: collection.audienceGroupIds ?? [],
      allowForward: collection.allowForward !== false,
      /** Legacy column ignored — path is TradeLane / Your paths. */
      orderPathPreference: null,
      productCount: productCount ?? collection._count?.products ?? collection.products?.length ?? 0,
      photoCount: preview.imageCount,
      previewImages: preview.previewImages,
      startsAt: collection.startsAt ? collection.startsAt.toISOString() : null,
      endsAt: collection.endsAt ? collection.endsAt.toISOString() : null,
      createdBy: toAuditActor(collection.createdByUser),
      updatedBy: toAuditActor(collection.updatedByUser),
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };
  }

  toCollectionDetail(collection: CollectionWithProducts): CollectionDetailView {
    return {
      ...this.toCollectionView(collection, collection.products.length),
      products: collection.products.map((entry) => this.toProductView(entry.product)),
    };
  }
}
