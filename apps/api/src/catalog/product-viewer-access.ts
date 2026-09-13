import {
  CollectionStatus,
  ConnectionStatus,
  MessageType,
  ProductStatus,
} from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';
import { connectionPairWhere } from '../access/connection-pair';
import {
  canDiscoverCollection,
  canViewCollectionProducts,
} from './audience-visibility';
import { isCollectionLiveForBuyers, liveWindowClauses } from './collection-schedule';

type AudienceFields = {
  id: string;
  companyId: string;
  status: string;
  audience: string;
  audienceCompanyIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
};

/**
 * True when the viewer can still reach this published design through an open
 * album (products visible) — same access idea as opening the pack on Explore.
 */
export async function productAccessibleViaCollection(
  prisma: PrismaService,
  visibility: VisibilityService,
  viewerCompanyId: string,
  productId: string,
  opts: {
    wasSharedInChat: (
      viewerCompanyId: string,
      referenceId: string,
      type: string,
    ) => Promise<boolean>;
  },
): Promise<boolean> {
  const memberships = await prisma.collectionProduct.findMany({
    where: {
      productId,
      collection: {
        status: CollectionStatus.Published,
        AND: liveWindowClauses(),
      },
    },
    select: {
      collection: {
        select: {
          id: true,
          companyId: true,
          status: true,
          audience: true,
          audienceCompanyIds: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
    take: 25,
  });

  for (const row of memberships) {
    const collection = row.collection as AudienceFields;
    if (!isCollectionLiveForBuyers(collection)) continue;

    if (collection.companyId === viewerCompanyId) {
      return true;
    }

    if (await visibility.isBlocked(viewerCompanyId, collection.companyId)) {
      continue;
    }

    const connected = await visibility.canViewCatalog(viewerCompanyId, collection.companyId);
    const following =
      (await prisma.follow.findUnique({
        where: {
          followerCompanyId_followedCompanyId: {
            followerCompanyId: viewerCompanyId,
            followedCompanyId: collection.companyId,
          },
        },
        select: { id: true },
      })) != null;
    const hasViewGrant =
      (await prisma.collectionViewGrant.findUnique({
        where: {
          collectionId_companyId: {
            collectionId: collection.id,
            companyId: viewerCompanyId,
          },
        },
        select: { id: true },
      })) != null;
    const sharedInChat = await opts.wasSharedInChat(
      viewerCompanyId,
      collection.id,
      MessageType.CollectionCard,
    );
    const audienceCtx = { connected, following };

    if (
      !sharedInChat &&
      !hasViewGrant &&
      !canDiscoverCollection(viewerCompanyId, collection, audienceCtx)
    ) {
      continue;
    }

    // Locked shell (e.g. Followers via chat share only) does not unlock members.
    if (
      !canViewCollectionProducts(viewerCompanyId, collection, audienceCtx, hasViewGrant)
    ) {
      continue;
    }

    return true;
  }

  return false;
}

/** Product row shape used for open-catalog trade without Connection. */
export type TradeDiscoverableProduct = {
  id: string;
  companyId: string;
  audience: string;
  audienceCompanyIds: string[];
  status: string;
  postedToMarketAt: Date | null;
};

export async function isProductOpenTradeDiscoverable(
  prisma: PrismaService,
  visibility: VisibilityService,
  buyerCompanyId: string,
  product: TradeDiscoverableProduct,
  opts: {
    wasSharedInChat: (
      viewerCompanyId: string,
      referenceId: string,
      type: string,
    ) => Promise<boolean>;
    connected: boolean;
    following: boolean;
  },
): Promise<boolean> {
  if (product.status !== ProductStatus.Published) return false;

  const ctx = { connected: opts.connected, following: opts.following };
  if (
    product.postedToMarketAt &&
    canDiscoverCollection(buyerCompanyId, product, ctx)
  ) {
    return true;
  }

  return productAccessibleViaCollection(
    prisma,
    visibility,
    buyerCompanyId,
    product.id,
    { wasSharedInChat: opts.wasSharedInChat },
  );
}

/** Connection lookup helper for trade-access (Active). */
export async function loadTradeAudienceCtx(
  prisma: PrismaService,
  buyerCompanyId: string,
  sellerCompanyId: string,
): Promise<{ connected: boolean; following: boolean }> {
  const [connection, follow] = await Promise.all([
    prisma.connection.findFirst({
      where: {
        ...connectionPairWhere(buyerCompanyId, sellerCompanyId),
        status: ConnectionStatus.Active,
      },
      select: { id: true },
    }),
    prisma.follow.findFirst({
      where: {
        followerCompanyId: buyerCompanyId,
        followedCompanyId: sellerCompanyId,
      },
      select: { id: true },
    }),
  ]);
  return {
    connected: Boolean(connection),
    following: Boolean(follow),
  };
}
