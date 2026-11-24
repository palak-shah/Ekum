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
import {
  collectionSourceShopNames,
  sourceChainCompanyIdsForPack,
  type SourceCreditHop,
} from './source-shop-credit';
import { mapMediaUrlsForViewer } from '../media/media-url-token';

export {
  collectionSourceShopNames,
  revealedCreditCompanyId,
  visitorDesignCreditCompanyName,
  sourceHopsFromRows,
  type SourceCreditHop,
  type SourceCreditHopRow,
} from './source-shop-credit';

type CollectionCardRow = Collection & {
  company: Company;
  _count: { products: number };
  products?: Array<{
    product: {
      images: string[];
      /** Set by collectionCardInclude; preview/count only count published members. */
      status?: string | null;
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
    opts?: {
      viewerReposted?: boolean;
      viewerRepostCollectionId?: string | null;
      viewerCompanyId?: string;
      repostEligibleCount?: number;
      /** Immediate→outer repost source hops for visitor credit ceiling. */
      sourceHops?: SourceCreditHop[];
      /** Full hop map for incomplete/cyclic fail-closed credit. */
      hopRows?: Map<string, import('./source-shop-credit').SourceCreditHopRow>;
      /** Batch 3: resolved buyer-facing band when pack uses calc modes. */
      resolvedBand?: { rateMin: number | null; rateMax: number | null } | null;
      /** Viewer-only: chrome from viewer's child when viewerReposted. */
      viewerRepostChrome?: {
        rateMin: number | null;
        rateMax: number | null;
        rateUnit: string | null;
        supplierRateMin: number | null;
        pricingMode: string | null;
        marginValue: number | null;
      } | null;
      /** Owner-only: supplier + margin on own curated child cards. */
      ownerCuratedChrome?: {
        supplierRateMin: number | null;
        pricingMode: string | null;
        marginValue: number | null;
      } | null;
    },
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
          resolvedBand: opts?.resolvedBand,
        });
    return {
      id: collection.id,
      name: collection.name,
      kind: (collection as { kind?: string }).kind ?? 'regular',
      orderMode: (collection as { orderMode?: string | null }).orderMode ?? null,
      description: collection.description?.trim() || null,
      categories: general ? [] : collection.categories ?? [],
      memberFind: collectionMemberFind(collection.products),
      // Feed / list: always signed preview (thumbnail1) — not originals.
      coverImage: collection.coverImage
        ? mapMediaUrlsForViewer([collection.coverImage], 'preview')[0] ?? null
        : collection.coverImage,
      previewImages: mapMediaUrlsForViewer(preview.previewImages, 'preview'),
      imageCount: preview.imageCount,
      productCount: collection._count.products,
      status: collection.status,
      // Explore “when” = last publish / new-design activity when set.
      updatedAt: (collection.exploreActivityAt ?? collection.updatedAt).toISOString(),
      allowForward: collection.allowForward,
      allowDownload: collection.allowDownload === true,
      audience: collection.audience,
      rateVisibility: collection.rateVisibility,
      sourceChainCompanyIds: sourceChainCompanyIdsForPack({
        packCompanyId: collection.companyId,
        foreignMemberCompanyIds: (collection.products ?? [])
          .map((row) => row.product?.companyId)
          .filter((id): id is string => Boolean(id)),
        sourceHops: opts?.sourceHops ?? [],
      }),
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
        opts?.sourceHops ?? [],
        {
          declaredSourceCollectionId:
            (collection as { repostSourceCollectionId?: string | null })
              .repostSourceCollectionId ?? null,
          hopRows: opts?.hopRows,
        },
      ),
      viewerReposted: opts?.viewerReposted === true,
      isRepostChild: Boolean(
        (collection as { repostSourceCollectionId?: string | null }).repostSourceCollectionId ||
          (collection as { repostSourceProductId?: string | null }).repostSourceProductId,
      ),
      viewerRepostCollectionId: opts?.viewerRepostCollectionId ?? null,
      ...(opts?.viewerRepostChrome
        ? {
            viewerRepostRateMin: opts.viewerRepostChrome.rateMin,
            viewerRepostRateMax: opts.viewerRepostChrome.rateMax,
            viewerRepostRateUnit: opts.viewerRepostChrome.rateUnit,
            viewerRepostSupplierRateMin: opts.viewerRepostChrome.supplierRateMin,
            viewerRepostPricingMode: opts.viewerRepostChrome.pricingMode,
            viewerRepostMarginValue: opts.viewerRepostChrome.marginValue,
          }
        : {}),
      ...(opts?.ownerCuratedChrome
        ? {
            ownerSupplierRateMin: opts.ownerCuratedChrome.supplierRateMin,
            ownerPricingMode: opts.ownerCuratedChrome.pricingMode,
            ownerMarginValue: opts.ownerCuratedChrome.marginValue,
          }
        : {}),
      repostEligibleCount:
        opts?.repostEligibleCount ?? collection._count.products,
      company: this.companySerializer.toPublicSummary(collection.company),
    };
  }

  toProductCard(product: ProductCardRow): DiscoveryProductCard {
    return {
      id: product.id,
      name: product.name,
      images: mapMediaUrlsForViewer(product.images, 'preview'),
      rate: product.rate === null ? null : product.rate.toNumber(),
      unit: product.unit,
      company: this.companySerializer.toPublicSummary(product.company),
    };
  }

  toExploreProductCard(
    product: ProductCardRow,
    opts?: {
      viewerReposted?: boolean;
      viewerRepostCollectionId?: string | null;
      repostEligibleCount?: number;
    },
  ): ExploreProductCard {
    return {
      id: product.id,
      name: product.name,
      // List/feed card: preview only. productDetail upgrades when allowDownload/owner.
      images: mapMediaUrlsForViewer(product.images, 'preview'),
      rate: product.rate === null ? null : product.rate.toNumber(),
      rateMax: product.rateMax === null ? null : product.rateMax.toNumber(),
      unit: product.unit,
      dispatchUnit: (product as { dispatchUnit?: string | null }).dispatchUnit ?? null,
      catalogRateUnit:
        (product as { catalogRateUnit?: string | null }).catalogRateUnit ?? null,
      categories: product.categories ?? [],
      postedAt: (product.postedToMarketAt ?? product.createdAt).toISOString(),
      allowForward: product.allowForward,
      allowDownload: product.allowDownload === true,
      catalogCollectionId:
        (product as { catalogCollectionId?: string | null }).catalogCollectionId ?? null,
      viewerReposted: opts?.viewerReposted === true,
      viewerRepostCollectionId: opts?.viewerRepostCollectionId ?? null,
      repostEligibleCount: opts?.repostEligibleCount ?? (product.allowForward === false ? 0 : 1),
      company: this.companySerializer.toPublicSummary(product.company),
    };
  }
}
