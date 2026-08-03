import { Injectable } from '@nestjs/common';
import type { Collection, CollectionProduct, Product } from '@prisma/client';
import type { CollectionDetailView, CollectionView, ProductView } from '@ekum/domain-types';

type CollectionWithCount = Collection & { _count?: { products: number } };
type CollectionWithProducts = Collection & {
  products: (CollectionProduct & { product: Product })[];
};

@Injectable()
export class CatalogSerializer {
  toProductView(product: Product): ProductView {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      // A null rate means "on request"; Decimal is converted for the wire.
      rate: product.rate === null ? null : product.rate.toNumber(),
      unit: product.unit,
      categories: product.categories,
      images: product.images,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  toCollectionView(collection: CollectionWithCount, productCount?: number): CollectionView {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      coverImage: collection.coverImage,
      status: collection.status,
      audience: collection.audience,
      rateVisibility: collection.rateVisibility,
      productCount: productCount ?? collection._count?.products ?? 0,
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
