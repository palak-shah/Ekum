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
import { resolveBuyerRepostPackAvailability } from './load-upstream-packs';

type AudienceFields = {
  id: string;
  companyId: string;
  status: string;
  audience: string;
  audienceCompanyIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  repostSourceCollectionId?: string | null;
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
      excluded: false,
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
          repostSourceCollectionId: true,
        },
      },
    },
    take: 25,
  });

  const availability = await resolveBuyerRepostPackAvailability(
    prisma,
    memberships.map((row) => ({
      id: row.collection.id,
      companyId: row.collection.companyId,
      repostSourceCollectionId: (
        row.collection as { repostSourceCollectionId?: string | null }
      ).repostSourceCollectionId,
    })),
  );

  for (const row of memberships) {
    const collection = row.collection as AudienceFields;
    if (!isCollectionLiveForBuyers(collection)) continue;

    if (collection.companyId === viewerCompanyId) {
      return true;
    }

    // Soft-unavailable descendant packs must not unlock design detail.
    if (availability.omitIds.has(collection.id)) {
      continue;
    }
    // Mixed pack still listed: synced/upstream members stay locked.
    const eligibleIds = availability.eligibleProductIdsByPackId.get(collection.id);
    if (eligibleIds && !eligibleIds.has(productId)) {
      continue;
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
        select: { status: true },
      }))?.status === 'allowed';
    const hasViewGrant =
      (await prisma.collectionViewGrant.findFirst({
        where: {
          collectionId: collection.id,
          companyId: viewerCompanyId,
          expiresAt: { gt: new Date() },
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
        status: 'allowed',
      },
      select: { id: true },
    }),
  ]);
  return {
    connected: Boolean(connection),
    following: Boolean(follow),
  };
}
