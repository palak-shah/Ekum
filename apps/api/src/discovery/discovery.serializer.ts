import { Injectable } from '@nestjs/common';
import type { Collection, Company, Product } from '@prisma/client';
import type {
  CollectionCard,
  CompanyCard,
  DiscoveryProductCard,
  ExploreProductCard,
} from '@ekum/domain-types';
import { CompanySerializer } from '../access/company.serializer';
import {
  collectionCardRateFields,
  collectionCardRateVisibility,
} from './collection-card-rate';
import { collectionPreviewFromRow } from './collection-preview';
import { collectionMemberFind } from '../catalog/collection-member-find';
import { isGeneralKind } from '../catalog/general-collection';

type CollectionCardRow = Collection & {
  company: Company;
  _count: { products: number };
  products?: Array<{
    product: {
      images: string[];
      companyId?: string;
      name?: string | null;
      sku?: string | null;
      description?: string | null;
      categories?: string[] | null;
      rate?: { toNumber(): number } | number | null;
      rateMax?: { toNumber(): number } | number | null;
      unit?: string | null;
      dispatchUnit?: string | null;
      catalogRateUnit?: string | null;
      company?: { name: string } | null;
    };
  }>;
};

/** Foreign mill names for From credit — only when the pack opts in. */
export function collectionSourceShopNames(
  packCompanyId: string,
  showSourceShops: boolean,
  products?: Array<{
    product: { companyId?: string; company?: { name: string } | null };
  }>,
): string[] {
  if (!showSourceShops) return [];
  const names = new Map<string, string>();
  for (const row of products ?? []) {
    const id = row.product.companyId;
    if (!id || id === packCompanyId) continue;
    const name = row.product.company?.name?.trim();
    if (name) names.set(id, name);
  }
  return [...names.values()];
}
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

  toCollectionCard(
    collection: CollectionCardRow,
    opts?: { viewerReposted?: boolean; viewerCompanyId?: string },
  ): CollectionCard {
    const preview = collectionPreviewFromRow(collection);
    const general = isGeneralKind((collection as { kind?: string }).kind);
    const rate = general
      ? { rateMin: null, rateMax: null, rateUnit: null }
      : collectionCardRateFields({
          rateVisibility: collectionCardRateVisibility({
            rateVisibility: collection.rateVisibility,
            packCompanyId: collection.companyId,
            viewerCompanyId: opts?.viewerCompanyId,
          }),
          rate: collection.rate,
          rateMax: collection.rateMax,
          catalogRateUnit: (collection as { catalogRateUnit?: string | null }).catalogRateUnit,
          products: collection.products,
        });
    return {
      id: collection.id,
      name: collection.name,
      kind: (collection as { kind?: string }).kind ?? 'regular',
      orderMode: (collection as { orderMode?: string | null }).orderMode ?? null,
      description: collection.description?.trim() || null,
      categories: general ? [] : collection.categories ?? [],
      memberFind: collectionMemberFind(collection.products),
      coverImage: collection.coverImage,
      previewImages: preview.previewImages,
      imageCount: preview.imageCount,
      productCount: collection._count.products,
      status: collection.status,
      // Explore “when” = last publish / new-design activity when set.
      updatedAt: (collection.exploreActivityAt ?? collection.updatedAt).toISOString(),
      allowForward: collection.allowForward,
      /** Legacy column ignored — path is TradeLane / Your paths. */
      orderPathPreference: null,
      rateMin: rate.rateMin,
      rateMax: rate.rateMax,
      rateUnit: rate.rateUnit,
      exploreNewDesignCount: collection.exploreNewDesignCount ?? 0,
      showSourceShops: collection.showSourceShops === true,
      sourceShopNames: collectionSourceShopNames(
        collection.companyId,
        collection.showSourceShops === true,
        collection.products,
      ),
      viewerReposted: opts?.viewerReposted === true,
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

  toExploreProductCard(
    product: ProductCardRow,
    opts?: { viewerReposted?: boolean },
  ): ExploreProductCard {
    return {
      id: product.id,
      name: product.name,
      images: product.images,
      rate: product.rate === null ? null : product.rate.toNumber(),
      rateMax: product.rateMax === null ? null : product.rateMax.toNumber(),
      unit: product.unit,
      dispatchUnit: (product as { dispatchUnit?: string | null }).dispatchUnit ?? null,
      catalogRateUnit:
        (product as { catalogRateUnit?: string | null }).catalogRateUnit ?? null,
      categories: product.categories ?? [],
      postedAt: (product.postedToMarketAt ?? product.createdAt).toISOString(),
      allowForward: product.allowForward,
      viewerReposted: opts?.viewerReposted === true,
      company: this.companySerializer.toPublicSummary(product.company),
    };
  }
}
