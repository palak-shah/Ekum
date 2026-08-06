import { Injectable } from '@nestjs/common';
import type { Collection, Company, Product } from '@prisma/client';
import type {
  CollectionCard,
  CompanyCard,
  DiscoveryProductCard,
  ExploreProductCard,
} from '@ekum/domain-types';
import { CompanySerializer } from '../access/company.serializer';
import { collectionPreviewFromRow } from './collection-preview';

type CollectionCardRow = Collection & {
  company: Company;
  _count: { products: number };
  products?: Array<{ product: { images: string[] } }>;
};
type ProductCardRow = Product & { company: Company };

@Injectable()
export class DiscoverySerializer {
  constructor(private readonly companySerializer: CompanySerializer) {}

  toCompanyCard(company: Company): CompanyCard {
    return {
      id: company.id,
      name: company.name,
      city: company.city,
      verification: company.verification,
      logoUrl: company.logoUrl,
      sellCategories: company.sellCategories,
      buyCategories: company.buyCategories,
    };
  }

  toCollectionCard(collection: CollectionCardRow): CollectionCard {
    const preview = collectionPreviewFromRow(collection);
    return {
      id: collection.id,
      name: collection.name,
      coverImage: collection.coverImage,
      previewImages: preview.previewImages,
      imageCount: preview.imageCount,
      productCount: collection._count.products,
      status: collection.status,
      updatedAt: collection.updatedAt.toISOString(),
      company: this.companySerializer.toPublicSummary(collection.company),
    };
  }

  toProductCard(product: ProductCardRow): DiscoveryProductCard {
    return {
      id: product.id,
      name: product.name,
      images: product.images,
      rate: product.rate === null ? null : product.rate.toNumber(),
      unit: product.unit,
      company: this.companySerializer.toPublicSummary(product.company),
    };
  }

  toExploreProductCard(product: ProductCardRow): ExploreProductCard {
    return {
      id: product.id,
      name: product.name,
      images: product.images,
      rate: product.rate === null ? null : product.rate.toNumber(),
      unit: product.unit,
      postedAt: (product.postedToMarketAt ?? product.createdAt).toISOString(),
      company: this.companySerializer.toPublicSummary(product.company),
    };
  }
}
