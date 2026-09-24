import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import type { Prisma } from '@prisma/client';
import { audienceVisibilityOr } from '../catalog/audience-visibility';
import { liveWindowClauses } from '../catalog/collection-schedule';

/**
 * Shop Designs: one row per own published product — Explore posts and
 * members of live packs the viewer can already see. Same design in many
 * albums is still one product.
 */
export function shopPublishedDesignWhere(
  viewerCompanyId: string,
  shopCompanyId: string,
  now: Date = new Date(),
): Prisma.ProductWhereInput {
  const isOwner = viewerCompanyId === shopCompanyId;
  const visibleToViewer: Prisma.ProductWhereInput[] = [
    ...audienceVisibilityOr(viewerCompanyId),
    ...(isOwner ? [{ companyId: shopCompanyId }] : []),
  ];
  const visiblePack: Prisma.CollectionWhereInput = {
    companyId: shopCompanyId,
    status: CollectionStatus.Published,
    AND: [
      ...(isOwner ? [] : liveWindowClauses(now)),
      {
        OR: [
          ...audienceVisibilityOr(viewerCompanyId),
          ...(isOwner ? [{ companyId: shopCompanyId }] : []),
        ],
      },
    ],
  };

  return {
    companyId: shopCompanyId,
    status: ProductStatus.Published,
    OR: [
      {
        AND: [{ postedToMarketAt: { not: null } }, { OR: visibleToViewer }],
      },
      {
        collections: { some: { collection: visiblePack } },
      },
    ],
  };
}
