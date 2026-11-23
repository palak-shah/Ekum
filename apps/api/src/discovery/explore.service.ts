import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CollectionStatus,
  MessageType,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  VerificationStatus,
  isRepostPricingMode,
  type CollectionCard,
  type CollectionPreviewView,
  type CompanyCard,
  type CursorPage,
  type ExploreBuyerOpportunity,
  type ExploreDesignOpportunity,
  type ExploreHomeQuery,
  type ExploreHomeView,
  type ExploreStory,
  type ExploreOpportunity,
  type ExplorePost,
  type ExploreProductCard,
  type ExploreProductPreviewView,
  type ExploreQuery,
  type ExploreSupplierCard,
  type ProductView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { omitCoveredDesignFeedRows } from './omit-covered-design-feed-rows';
import {
  activeConnectionsForCompanyWhere,
  companyNotBlockedWith,
  counterpartIdsFromRows,
} from '../access/connection-pair';
import { VisibilityService } from '../access/visibility.service';
import { discoverableProfileWhere } from './follow-access';
import { CatalogSerializer } from '../catalog/catalog.serializer';
import { CollectionService } from '../catalog/collection.service';
import { mapMediaUrlsForViewer } from '../media/media-url-token';
import { catalogMediaAccess } from '../media/catalog-media-access';
import { shouldReuseRepostChild } from '../catalog/collection-lineage';
import {
  generalMemberJoinRows,
  generalMemberProductWhere,
  isGeneralKind,
  publicCollectionKindWhere,
} from '../catalog/general-collection';
import { peerCompanyIdFilter, pinOwnRows, prependOwnCapped } from './explore-own-pin';
import {
  diversifyNewestThenFill,
  olderThanActivityWhere,
  parseFeedCursor,
} from './explore-feed-page';
import {
  collectionSourceShopNames,
  sourceHopsFromRows,
  visitorDesignCreditCompanyName,
  DiscoverySerializer,
} from './discovery.serializer';
import type { SourceCreditHopRow } from './source-shop-credit';
import { loadSourceCreditHopRows } from './load-source-credit-hops';
import {
  canDiscoverCollection,
  canViewCollectionProducts,
} from '../catalog/audience-visibility';
import {
  projectEligibleCollectionMembers,
  resolveBuyerRepostPackAvailability,
} from '../catalog/load-upstream-packs';
import {
  filterSoftAvailableProducts,
  filterViewerEligibleMembers,
} from '../catalog/repost-availability';
import {
  hasPublishedDesignClause,
  isCollectionLiveForBuyers,
  liveWindowClauses,
} from '../catalog/collection-schedule';
import {
  collectionCardRateFields,
  collectionCardRateVisibility,
} from './collection-card-rate';
import { collectionCardInclude, publishedCollectionMemberWhere } from './collection-preview';
import { cursorArgs, toCursorPage } from './pagination';
import { rankWindowTake } from './rank-window';
import {
  buyerFacingBand,
  resolvePackMemberBuyerRates,
  resolvedBandsForPacks,
  buyerFacingViaCuratedPackForProduct,
} from '../catalog/repost-pricing-resolve';
import {
  interestHitLabel,
  matchesCompanyInterest,
  resolveInterestFromCompany,
  type ResolvedInterest,
} from './interest-match';
import { audienceVisibilityOr, curatedSourceExcludeAnd } from '../catalog/audience-visibility';
import { productAccessibleViaCollection } from '../catalog/product-viewer-access';
import { compareByMarketRelevance } from './feed-rank';
import { viewerPackTicket } from '../orders/viewer-pack-ticket';
import { millShareActiveSet } from '../orders/mill-share';
import { laneRoutesDirect } from '../orders/trade-lane';
import {
  categoryHasSomeWhere,
  cityEqualsWhere,
  interestFromNarrowCategories,
  narrowLists,
} from './explore-narrow';
import {
  groupReceivedByDay,
  isCuratedCollection,
  isDirectedAudience,
  isEligibleStoryPublisher,
  pickReceivedCurated,
} from './exploreReceived';

/** Drop join rows whose product is gone so hops cannot 500 the album GET. */
function presentCollectionProducts<T extends { product?: unknown | null }>(
  entries: T[] | undefined,
): Array<T & { product: NonNullable<T['product']> }> {
  const list: Array<T & { product: NonNullable<T['product']> }> = [];
  for (const entry of entries ?? []) {
    if (entry.product == null) continue;
    list.push(entry as T & { product: NonNullable<T['product']> });
  }
  return list;
}

/** Posts visible to this viewer by publish audience (everyone/connections/followers/selected). */
function audienceVisibility(viewerCompanyId: string): { OR: object[] } {
  return { OR: audienceVisibilityOr(viewerCompanyId) };
}

/** Audience + curated source auto-exclude for collection rows. */
function collectionAudienceVisibility(viewerCompanyId: string): object {
  return {
    AND: [
      audienceVisibility(viewerCompanyId),
      curatedSourceExcludeAnd(viewerCompanyId),
      hasPublishedDesignClause(),
    ],
  };
}

type CollectionCardRow = Prisma.CollectionGetPayload<{ include: typeof collectionCardInclude }>;
type ProductFeedRow = Prisma.ProductGetPayload<{ include: { company: true } }>;

type FeedRow = {
  feedId: string;
  postedAt: Date;
  company: InterestCompanyRow;
  kind: 'collection' | 'product';
  collection?: CollectionCardRow;
  product?: ProductFeedRow;
};

type InterestCompanyRow = {
  id: string;
  city: string;
  sellCategories: string[];
  superCategories: string[];
  masterCategories?: string[];
};

function withLiveDesigns<T extends { _count?: { products: number } }>(rows: T[]): T[] {
  return rows.filter((row) => (row._count?.products ?? 0) > 0);
}

function pageMerged<T>(
  merged: T[],
  query: { cursor?: string; limit: number },
  cursorOf: (row: T) => string,
): T[] {
  let start = 0;
  if (query.cursor) {
    const index = merged.findIndex((row) => cursorOf(row) === query.cursor);
    start = index >= 0 ? index + 1 : 0;
  }
  return merged.slice(start, start + query.limit + 1);
}

function byPostedAtDesc(a: FeedRow, b: FeedRow): number {
  const delta = b.postedAt.getTime() - a.postedAt.getTime();
  if (delta !== 0) return delta;
  return b.feedId.localeCompare(a.feedId);
}

@Injectable()
export class ExploreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly catalog: CatalogSerializer,
    private readonly discovery: DiscoverySerializer,
    private readonly collectionService: CollectionService,
  ) {}

  /**
   * Sectioned Explore home. Optional category/city Narrow filters apply across sections.
   * `side=buying` fills receivedByDay; receivedCurated is always populated for Home.
   * Own packs pin at most two in the first window so peers stay visible.
   */
  async home(viewerCompanyId: string, query: ExploreHomeQuery = {}): Promise<ExploreHomeView> {
    const feedOnly = query.sections === 'feed';
    const sectionLimit = 12;
    const { categories: homeCategories, cities: homeCities } = narrowLists(query);
    const base: ExploreQuery = {
      limit: sectionLimit,
      ...(homeCategories[0] ? { category: homeCategories[0] } : {}),
      ...(homeCities[0] ? { city: homeCities[0] } : {}),
      ...(homeCategories.length ? { categories: homeCategories } : {}),
      ...(homeCities.length ? { cities: homeCities } : {}),
    };

    const viewer = await this.prisma.company.findUnique({
      where: { id: viewerCompanyId },
      select: {
        sellCategories: true,
        buyCategories: true,
        superCategories: true,
        masterCategories: true,
        city: true,
      },
    });
    const sells = (viewer?.sellCategories ?? []).some((tag) => tag.trim().length > 0);
    const interest = interestFromNarrowCategories(homeCategories) ??
      resolveInterestFromCompany(viewer ?? {});
    // Explore `sections=feed` skips Home-only shelves; selling still needs buyers.
    const wantBuyers = sells && (!feedOnly || query.side === 'selling');
    const wantSuggested = !feedOnly;
    const wantReceived = !feedOnly;

    const [
      networkPage,
      forYouPage,
      ownCollections,
      networkDesigns,
      forYouDesignsRaw,
      suggestedPage,
      buyersPage,
      connectedRows,
      followedRows,
      broadcastRows,
    ] = await Promise.all([
      this.collections(viewerCompanyId, { ...base, following: true }),
      this.collections(viewerCompanyId, base),
      this.ownLiveCollections(viewerCompanyId, { ...base, limit: sectionLimit }),
      this.designs(viewerCompanyId, { ...base, following: true, limit: 8 }),
      this.designs(viewerCompanyId, { ...base, limit: 12 }),
      wantSuggested
        ? this.companies(viewerCompanyId, { ...base, scope: 'buy' })
        : Promise.resolve({ results: [] as CompanyCard[], nextCursor: null }),
      wantBuyers
        ? this.companies(viewerCompanyId, { ...base, scope: 'sell' })
        : Promise.resolve({ results: [] as CompanyCard[], nextCursor: null }),
      this.prisma.connection.findMany({
        where: activeConnectionsForCompanyWhere(viewerCompanyId),
        select: { companyLowId: true, companyHighId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerCompanyId: viewerCompanyId, status: 'allowed' },
        select: { followedCompanyId: true },
      }),
      wantReceived
        ? this.prisma.broadcast.findMany({
            where: {
              type: MessageType.CollectionCard,
              referenceId: { not: null },
              recipients: { some: { recipientCompanyId: viewerCompanyId } },
            },
            select: { referenceId: true },
          })
        : Promise.resolve([] as { referenceId: string | null }[]),
    ]);

    const connectedIds = new Set(counterpartIdsFromRows(viewerCompanyId, connectedRows));
    const followedIds = new Set(followedRows.map((row) => row.followedCompanyId));
    const networkIds = new Set(networkPage.results.map((row) => row.id));
    const networkDesignIds = new Set(networkDesigns.results.map((row) => row.id));
    const ownIds = new Set(ownCollections.map((collection) => collection.id));
    const opportunityCollections = prependOwnCapped(
      ownCollections,
      [
        ...networkPage.results,
        ...forYouPage.results.filter((collection) => !networkIds.has(collection.id)),
      ],
      (collection) => collection.id,
    );
    const opportunityDesignsUnfiltered = [
      ...networkDesigns.results,
      ...forYouDesignsRaw.results.filter((product) => !networkDesignIds.has(product.id)),
    ];
    const coveredByHomePacks = await this.memberProductIdsForCollections(
      opportunityCollections.map((row) => row.id),
    );
    const opportunityDesigns = opportunityDesignsUnfiltered.filter(
      (product) => !coveredByHomePacks.has(product.id),
    );
    const publisherIds = [
      ...new Set([
        ...opportunityCollections.map((row) => row.company.id),
        ...opportunityDesigns.map((row) => row.company.id),
      ]),
    ];
    const tradeRows =
      publisherIds.length > 0
        ? await this.prisma.company.findMany({
            where: { id: { in: publisherIds } },
            select: {
              id: true,
              sellCategories: true,
              superCategories: true,
              masterCategories: true,
            },
          })
        : [];
    const tradeById = new Map(tradeRows.map((row) => [row.id, row]));

    const fromNetwork = networkPage.results.map((collection) =>
      this.toOpportunity(collection, interest, connectedIds, followedIds, tradeById.get(collection.company.id)),
    );
    const rankedForYou = forYouPage.results
      .filter((collection) => !networkIds.has(collection.id) && !ownIds.has(collection.id))
      .map((collection) =>
        this.toOpportunity(
          collection,
          interest,
          connectedIds,
          followedIds,
          tradeById.get(collection.company.id),
        ),
      );
    const forYou = prependOwnCapped(
      ownCollections.map((collection) =>
        this.toOpportunity(
          collection,
          interest,
          connectedIds,
          followedIds,
          tradeById.get(collection.company.id),
        ),
      ),
      rankedForYou,
      (row) => row.collection.id,
    );

    const designsFromNetwork = networkDesigns.results
      .filter((product) => !coveredByHomePacks.has(product.id))
      .map((product) =>
        this.toDesignOpportunity(
          product,
          interest,
          connectedIds,
          followedIds,
          tradeById.get(product.company.id),
        ),
      );
    const designsForYou = forYouDesignsRaw.results
      .filter((product) => !networkDesignIds.has(product.id) && !coveredByHomePacks.has(product.id))
      .map((product) =>
        this.toDesignOpportunity(
          product,
          interest,
          connectedIds,
          followedIds,
          tradeById.get(product.company.id),
        ),
      );

    const viewerSell = (viewer?.sellCategories ?? []).filter(Boolean);
    const viewerBuy = (viewer?.buyCategories ?? []).filter(Boolean);

    const businessIds = [
      ...new Set([
        ...suggestedPage.results.map((company) => company.id),
        ...buyersPage.results.map((company) => company.id),
      ]),
    ];
    const shopPreviews =
      businessIds.length > 0
        ? await this.shopPreviewsForCompanies(viewerCompanyId, businessIds)
        : new Map<string, { previewImages: string[]; designCount: number; collectionCount: number; latestPostedAt: string | null }>();

    const suggestedBusinesses = suggestedPage.results.map((company) =>
      this.toSuggestedOpportunity(
        company,
        connectedIds,
        followedIds,
        'sell',
        viewerSell,
        viewerBuy,
        shopPreviews.get(company.id),
      ),
    );
    const lookingForWhatYouSell = sells
      ? buyersPage.results.map((company) =>
          this.toSuggestedOpportunity(
            company,
            connectedIds,
            followedIds,
            'buy',
            viewerSell,
            viewerBuy,
            shopPreviews.get(company.id),
          ),
        )
      : null;

    const stories = await this.storiesForHome({
      fromNetwork,
      designsFromNetwork,
      forYou,
      designsForYou,
      viewerCompanyId,
      followedIds,
      connectedIds,
    });

    let receivedByDay: ExploreHomeView['receivedByDay'] = [];
    let receivedCurated: ExploreHomeView['receivedCurated'] = [];
    if (wantReceived) {
      const broadcastCollectionIds = [
        ...new Set(
          broadcastRows
            .map((row) => row.referenceId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const receivedPacks = await this.loadReceivedPacks(
        viewerCompanyId,
        base,
        broadcastCollectionIds,
      );
      receivedByDay =
        query.side === 'buying'
          ? groupReceivedByDay(receivedPacks).map((day) => ({
              day: day.day,
              groups: day.groups.map((group) => ({
                company: group.items[0]!.company,
                collections: group.items,
              })),
            }))
          : [];
      receivedCurated = pickReceivedCurated(receivedPacks);
    }

    return {
      forYou,
      fromNetwork,
      designsForYou,
      designsFromNetwork,
      suggestedBusinesses,
      lookingForWhatYouSell,
      stories,
      receivedByDay,
      receivedCurated,
    };
  }

  /**
   * Stories from home shelves plus any followed/connected mill that still has a
   * live pack — so one busy follow cannot wipe another off the rail.
   */
  private async storiesForHome(input: {
    fromNetwork: ExploreHomeView['fromNetwork'];
    designsFromNetwork: ExploreHomeView['designsFromNetwork'];
    forYou: ExploreHomeView['forYou'];
    designsForYou: ExploreHomeView['designsForYou'];
    viewerCompanyId: string;
    followedIds: Set<string>;
    connectedIds: Set<string>;
  }): Promise<ExploreStory[]> {
    const latest = new Map<string, ExploreStory>();
    const touch = (
      company: ExploreStory['company'],
      at: string | null | undefined,
      allowOwn = false,
    ) => {
      if (!company?.id || !at) return;
      const isOwn = company.id === input.viewerCompanyId;
      if (
        !isOwn &&
        !isEligibleStoryPublisher(company.id, input.followedIds, input.connectedIds)
      ) {
        return;
      }
      if (isOwn && !allowOwn) return;
      const prev = latest.get(company.id);
      if (!prev || prev.latestPostedAt < at) {
        latest.set(company.id, { company, latestPostedAt: at });
      }
    };

    for (const row of input.fromNetwork) {
      touch(row.collection.company, row.collection.updatedAt);
    }
    for (const row of input.designsFromNetwork) {
      touch(row.product.company, row.product.postedAt);
    }
    for (const row of input.forYou) {
      touch(row.collection.company, row.collection.updatedAt, true);
    }
    for (const row of input.designsForYou) {
      touch(row.product.company, row.product.postedAt, true);
    }

    const eligibleIds = [
      ...new Set([...input.followedIds, ...input.connectedIds]),
    ].filter((id) => id !== input.viewerCompanyId && !latest.has(id));
    if (eligibleIds.length > 0) {
      const packs = await this.prisma.collection.findMany({
        where: {
          companyId: { in: eligibleIds },
          status: CollectionStatus.Published,
          ...publicCollectionKindWhere(),
          AND: [
            collectionAudienceVisibility(input.viewerCompanyId),
            ...liveWindowClauses(),
            hasPublishedDesignClause(),
          ],
        },
        include: { company: true },
        orderBy: [{ exploreActivityAt: 'desc' }, { id: 'desc' }],
        distinct: ['companyId'],
        take: eligibleIds.length,
      });
      for (const pack of packs) {
        const at = (pack.exploreActivityAt ?? pack.updatedAt).toISOString();
        touch(this.discovery.toCompanyCard(pack.company), at);
      }
    }

    const stories = [...latest.values()].sort((a, b) =>
      a.latestPostedAt < b.latestPostedAt ? 1 : -1,
    );
    const own = stories.find((s) => s.company.id === input.viewerCompanyId);
    const others = stories.filter((s) => s.company.id !== input.viewerCompanyId).slice(0, 15);
    return own ? [own, ...others] : others;
  }

  private async loadReceivedPacks(
    viewerCompanyId: string,
    query: ExploreQuery,
    broadcastCollectionIds: string[],
  ) {
    const audienceOr: Prisma.CollectionWhereInput[] = [
      { audience: { in: [PublishAudience.Connections, PublishAudience.Followers, PublishAudience.Selected] } },
    ];
    if (broadcastCollectionIds.length > 0) {
      audienceOr.push({ id: { in: broadcastCollectionIds } });
    }

    const rows = await this.prisma.collection.findMany({
      where: {
        status: CollectionStatus.Published,
        kind: { not: 'general' },
        companyId: { not: viewerCompanyId },
        company: this.companyFilter(viewerCompanyId, query),
        AND: [collectionAudienceVisibility(viewerCompanyId), ...liveWindowClauses()],
        OR: audienceOr,
      },
      include: collectionCardInclude,
      orderBy: [{ exploreActivityAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
      take: 80,
    });

    const live = withLiveDesigns(rows).filter(
      (row) => isDirectedAudience(row.audience) || broadcastCollectionIds.includes(row.id),
    );
    const availability = await resolveBuyerRepostPackAvailability(
      this.prisma,
      live.map((row) => ({
        id: row.id,
        companyId: row.companyId,
        repostSourceCollectionId: (
          row as { repostSourceCollectionId?: string | null }
        ).repostSourceCollectionId,
      })),
    );
    const softOff = availability.omitIds;
    const visible = live
      .filter((row) => row.companyId === viewerCompanyId || !softOff.has(row.id))
      .map((row) =>
        projectEligibleCollectionMembers(
          row,
          viewerCompanyId,
          availability.eligibleProductIdsByPackId.get(row.id),
        ),
      );
    const eligible = await this.eligibleCountByCollection(viewerCompanyId, visible);
    const stamps = await this.viewerRepostStamps(viewerCompanyId, {
      collectionIds: visible.map((row) => row.id),
      productIds: [],
    });
    const sourceHopRows = await this.loadSourceCreditHopRows(
      visible.map(
        (row) =>
          (row as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
      ),
    );
    const bands = await this.resolvedBandsByPack(viewerCompanyId, visible);
    return visible.map((row) => {
      const card = this.discovery.toCollectionCard(row, {
        viewerCompanyId,
        viewerReposted: stamps.collections.has(row.id),
        viewerRepostCollectionId: stamps.collections.get(row.id) ?? null,
        repostEligibleCount: eligible.get(row.id) ?? 0,
        sourceHops: sourceHopsFromRows(
          (row as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
          sourceHopRows,
        ),
        hopRows: sourceHopRows,
        resolvedBand: bands.get(row.id) ?? null,
      });
      const memberCompanyIds = row.products.map((entry) => entry.product.companyId);
      return {
        postedAt: row.exploreActivityAt ?? row.updatedAt,
        companyId: row.companyId,
        curated: isCuratedCollection(row.companyId, memberCompanyIds),
        payload: card,
      };
    });
  }

  /** Published designs on Explore (posted to market), including the viewer’s own. */
  async designs(
    viewerCompanyId: string,
    query: ExploreQuery,
  ): Promise<CursorPage<ExploreProductCard>> {
    const baseWhere: Prisma.ProductWhereInput = {
      status: ProductStatus.Published,
      postedToMarketAt: { not: null },
      company: this.companyFilter(viewerCompanyId, query),
      AND: [audienceVisibility(viewerCompanyId)],
    };

    const orderBy = [{ postedToMarketAt: 'desc' as const }, { id: 'desc' as const }];
    const args = {
      take: query.limit + 1,
      orderBy,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    };

    if (query.following) {
      const rows = await this.prisma.product.findMany({
        where: baseWhere,
        include: { company: true },
        ...args,
      });
      return this.toProductCardPage(viewerCompanyId, rows, query.limit);
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId, status: 'allowed' },
      select: { followedCompanyId: true },
    });
    const followedIds = followed.map((row) => row.followedCompanyId);

    if (followedIds.length === 0) {
      const rows = await this.prisma.product.findMany({
        where: { ...baseWhere, companyId: { not: viewerCompanyId } },
        include: { company: true },
        ...args,
      });
      return this.toProductCardPage(viewerCompanyId, rows, query.limit);
    }

    const [followedRows, otherRows] = await Promise.all([
      this.prisma.product.findMany({
        where: { ...baseWhere, companyId: { in: followedIds } },
        include: { company: true },
        orderBy,
        take: query.limit + 1,
      }),
      this.prisma.product.findMany({
        where: {
          ...baseWhere,
          companyId: peerCompanyIdFilter(viewerCompanyId, followedIds),
        },
        include: { company: true },
        orderBy,
        take: query.limit + 1,
      }),
    ]);
    const merged = [...followedRows, ...otherRows];
    const page = pageMerged(merged, query, (row) => row.id);
    return this.toProductCardPage(viewerCompanyId, page, query.limit);
  }

  /**
   * Mixed market feed: published collections and products posted to market.
   * Page 1 soft-ranks within a window. Later pages keyset by activity so scroll
   * can keep loading older live packs past that window.
   */
  async feed(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<ExplorePost>> {
    if (query.cursor) {
      return this.feedContinue(viewerCompanyId, query);
    }

    const companyFilter = this.companyFilter(viewerCompanyId, query);
    const windowTake = rankWindowTake(query.limit);
    const collectionWhere: Prisma.CollectionWhereInput = {
      status: CollectionStatus.Published,
      ...publicCollectionKindWhere(),
      company: companyFilter,
      AND: [collectionAudienceVisibility(viewerCompanyId), ...liveWindowClauses()],
    };
    const productWhere: Prisma.ProductWhereInput = {
      status: ProductStatus.Published,
      postedToMarketAt: { not: null },
      company: companyFilter,
      AND: [audienceVisibility(viewerCompanyId)],
    };

    if (query.following) {
      const [collections, products] = await Promise.all([
        this.prisma.collection.findMany({
          where: collectionWhere,
          include: collectionCardInclude,
          orderBy: [{ exploreActivityAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          take: windowTake,
        }),
        this.prisma.product.findMany({
          where: productWhere,
          include: { company: true },
          orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
          take: windowTake,
        }),
      ]);
      const merged = await this.omitSoftUnavailableFeedRows(
        viewerCompanyId,
        await this.hideDesignsCoveredByPacks(
          diversifyNewestThenFill(
            [
              ...withLiveDesigns(collections).map((row) => this.toCollectionFeedRow(row)),
              ...products.map((row) => this.toProductFeedRow(row)),
            ].sort(byPostedAtDesc),
            (row) => row.company.id,
            windowTake,
          ),
        ),
      );
      const page = pageMerged(merged, query, (row) => row.feedId);
      const stamps = await this.viewerRepostStampsForFeed(viewerCompanyId, page);
      const eligible = await this.eligibleForFeedRows(viewerCompanyId, page);
      const sourceHopRows = await this.loadSourceCreditHopRows(
        page.map(
          (row) =>
            row.collection &&
            (row.collection as { repostSourceCollectionId?: string | null })
              .repostSourceCollectionId,
        ),
      );
      const bands = await this.resolvedBandsByPack(
        viewerCompanyId,
        page.filter((row) => row.collection).map((row) => row.collection!),
      );
      return toCursorPage(
        page,
        query.limit,
        (row) =>
          this.toExplorePost(row, stamps, eligible, viewerCompanyId, sourceHopRows, bands),
        (row) => row.feedId,
      );
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId, status: 'allowed' },
      select: { followedCompanyId: true },
    });
    const followedIds = followed.map((row) => row.followedCompanyId);

    const [followedCollections, otherCollections, followedProducts, otherProducts] =
      await Promise.all([
        followedIds.length > 0
          ? this.prisma.collection.findMany({
              where: { ...collectionWhere, companyId: { in: followedIds } },
              include: collectionCardInclude,
              orderBy: [{ exploreActivityAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
              take: windowTake,
            })
          : Promise.resolve([] as CollectionCardRow[]),
        this.prisma.collection.findMany({
          where: {
            ...collectionWhere,
            companyId: peerCompanyIdFilter(viewerCompanyId, followedIds),
          },
          include: collectionCardInclude,
          orderBy: [{ exploreActivityAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          take: windowTake,
        }),
        followedIds.length > 0
          ? this.prisma.product.findMany({
              where: { ...productWhere, companyId: { in: followedIds } },
              include: { company: true },
              orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
              take: windowTake,
            })
          : Promise.resolve([] as ProductFeedRow[]),
        this.prisma.product.findMany({
          where: {
            ...productWhere,
            companyId: peerCompanyIdFilter(viewerCompanyId, followedIds),
          },
          include: { company: true },
          orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
          take: windowTake,
        }),
      ]);

    const followedRows = diversifyNewestThenFill(
      [
        ...withLiveDesigns(followedCollections).map((row) => this.toCollectionFeedRow(row)),
        ...followedProducts.map((row) => this.toProductFeedRow(row)),
      ].sort(byPostedAtDesc),
      (row) => row.company.id,
      windowTake,
    );
    const otherRows = [
      ...withLiveDesigns(otherCollections).map((row) => this.toCollectionFeedRow(row)),
      ...otherProducts.map((row) => this.toProductFeedRow(row)),
    ].sort(byPostedAtDesc);

    const { interest, city } = await this.resolveViewerRankContext(viewerCompanyId, query);
    const softRank = interest.tags.length > 0 && narrowLists(query).categories.length === 0;
    const ranked = softRank
      ? this.mergeFollowThenInterest(followedRows, otherRows, interest, city)
      : [
          ...followedRows,
          ...[...otherRows].sort((a, b) => compareByMarketRelevance(a, b, interest, city)),
        ];
    const merged = pinOwnRows(ranked, (row) => row.company.id === viewerCompanyId);

    const page = pageMerged(
      await this.omitSoftUnavailableFeedRows(
        viewerCompanyId,
        await this.hideDesignsCoveredByPacks(merged),
      ),
      query,
      (row) => row.feedId,
    );
    const stamps = await this.viewerRepostStampsForFeed(viewerCompanyId, page);
    const eligible = await this.eligibleForFeedRows(viewerCompanyId, page);
    const sourceHopRows = await this.loadSourceCreditHopRows(
      page.map(
        (row) =>
          row.collection &&
          (row.collection as { repostSourceCollectionId?: string | null })
            .repostSourceCollectionId,
      ),
    );
    const bands = await this.resolvedBandsByPack(
      viewerCompanyId,
      page.filter((row) => row.collection).map((row) => row.collection!),
    );
    return toCursorPage(
      page,
      query.limit,
      (row) =>
        this.toExplorePost(row, stamps, eligible, viewerCompanyId, sourceHopRows, bands),
      (row) => row.feedId,
    );
  }

  /** Later Buying pages — activity keyset, no soft-rank window cap. */
  private async feedContinue(
    viewerCompanyId: string,
    query: ExploreQuery,
  ): Promise<CursorPage<ExplorePost>> {
    const parsed = parseFeedCursor(query.cursor ?? '');
    if (!parsed) {
      return { results: [], nextCursor: null };
    }

    let postedAt: Date | null = null;
    if (parsed.kind === 'collection') {
      const row = await this.prisma.collection.findUnique({
        where: { id: parsed.entityId },
        select: { exploreActivityAt: true, createdAt: true },
      });
      postedAt = row ? (row.exploreActivityAt ?? row.createdAt) : null;
    } else {
      const row = await this.prisma.product.findUnique({
        where: { id: parsed.entityId },
        select: { postedToMarketAt: true, createdAt: true },
      });
      postedAt = row ? (row.postedToMarketAt ?? row.createdAt) : null;
    }
    if (!postedAt) {
      return { results: [], nextCursor: null };
    }

    const companyFilter = this.companyFilter(viewerCompanyId, query);
    const take = query.limit + 1;
    const collectionWhere: Prisma.CollectionWhereInput = {
      status: CollectionStatus.Published,
      ...publicCollectionKindWhere(),
      company: companyFilter,
      AND: [
        collectionAudienceVisibility(viewerCompanyId),
        ...liveWindowClauses(),
        olderThanActivityWhere(postedAt, parsed.entityId, 'exploreActivityAt') as Prisma.CollectionWhereInput,
      ],
    };
    const productWhere: Prisma.ProductWhereInput = {
      status: ProductStatus.Published,
      postedToMarketAt: { not: null },
      company: companyFilter,
      AND: [
        audienceVisibility(viewerCompanyId),
        olderThanActivityWhere(postedAt, parsed.entityId, 'postedToMarketAt') as Prisma.ProductWhereInput,
      ],
    };

    const [collections, products] = await Promise.all([
      this.prisma.collection.findMany({
        where: collectionWhere,
        include: collectionCardInclude,
        orderBy: [{ exploreActivityAt: 'desc' }, { id: 'desc' }],
        take,
      }),
      this.prisma.product.findMany({
        where: productWhere,
        include: { company: true },
        orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
        take,
      }),
    ]);

    const merged = await this.omitSoftUnavailableFeedRows(
      viewerCompanyId,
      await this.hideDesignsCoveredByPacks(
        [
          ...withLiveDesigns(collections).map((row) => this.toCollectionFeedRow(row)),
          ...products.map((row) => this.toProductFeedRow(row)),
        ].sort(byPostedAtDesc),
      ),
    );
    const page = merged.slice(0, take);
    const stamps = await this.viewerRepostStampsForFeed(viewerCompanyId, page);
    const eligible = await this.eligibleForFeedRows(viewerCompanyId, page);
    const sourceHopRows = await this.loadSourceCreditHopRows(
      page.map(
        (row) =>
          row.collection &&
          (row.collection as { repostSourceCollectionId?: string | null })
            .repostSourceCollectionId,
      ),
    );
    const bands = await this.resolvedBandsByPack(
      viewerCompanyId,
      page.filter((row) => row.collection).map((row) => row.collection!),
    );
    return toCursorPage(
      page,
      query.limit,
      (row) =>
        this.toExplorePost(row, stamps, eligible, viewerCompanyId, sourceHopRows, bands),
      (row) => row.feedId,
    );
  }

  /**
   * Viewer’s own live packs — not subject to the followed-first 12-post window.
   * General Collection stays library-only.
   */
  private async ownLiveCollections(
    viewerCompanyId: string,
    query: ExploreQuery,
  ): Promise<CollectionCard[]> {
    const rows = await this.prisma.collection.findMany({
      where: {
        companyId: viewerCompanyId,
        status: CollectionStatus.Published,
        ...publicCollectionKindWhere(),
        company: this.companyFilter(viewerCompanyId, query),
        AND: [collectionAudienceVisibility(viewerCompanyId), ...liveWindowClauses()],
      },
      include: collectionCardInclude,
      orderBy: [{ exploreActivityAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit,
    });
    const live = withLiveDesigns(rows);
    const page = await this.toCollectionCardPage(viewerCompanyId, live, live.length);
    return page.results;
  }

  /** Collections-only browse (same ranking rules as feed, without product posts). */
  async collections(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<CollectionCard>> {
    const windowTake = rankWindowTake(query.limit);
    const baseWhere: Prisma.CollectionWhereInput = {
      status: CollectionStatus.Published,
      company: this.companyFilter(viewerCompanyId, query),
      AND: [collectionAudienceVisibility(viewerCompanyId), ...liveWindowClauses()],
    };

    if (query.following) {
      // First page: pull a ranking window then keep ≥1 newest pack per followed
      // shop so one busy mill cannot fill all 12 home slots.
      if (!query.cursor) {
        const rows = await this.prisma.collection.findMany({
          where: baseWhere,
          include: collectionCardInclude,
          orderBy: [
            { exploreActivityAt: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          take: windowTake,
        });
        const diverse = diversifyNewestThenFill(
          withLiveDesigns(rows),
          (row) => row.companyId,
          query.limit + 1,
        );
        return this.toCollectionCardPage(viewerCompanyId, diverse, query.limit);
      }
      const rows = await this.prisma.collection.findMany({
        where: baseWhere,
        include: collectionCardInclude,
        orderBy: [
          { exploreActivityAt: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: query.limit + 1,
        cursor: { id: query.cursor },
        skip: 1,
      });
      return this.toCollectionCardPage(viewerCompanyId, withLiveDesigns(rows), query.limit);
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId, status: 'allowed' },
      select: { followedCompanyId: true },
    });
    const followedIds = followed.map((row) => row.followedCompanyId);
    const orderBy = [
      { exploreActivityAt: 'desc' as const },
      { createdAt: 'desc' as const },
      { id: 'desc' as const },
    ];
    const [followedRows, otherRows] = await Promise.all([
      followedIds.length > 0
        ? this.prisma.collection.findMany({
            where: { ...baseWhere, companyId: { in: followedIds } },
            include: collectionCardInclude,
            orderBy,
            take: windowTake,
          })
        : Promise.resolve([] as CollectionCardRow[]),
      this.prisma.collection.findMany({
        where: {
          ...baseWhere,
          companyId: peerCompanyIdFilter(viewerCompanyId, followedIds),
        },
        include: collectionCardInclude,
        orderBy,
        take: windowTake,
      }),
    ]);

    const { interest, city } = await this.resolveViewerRankContext(viewerCompanyId, query);
    const softRank = interest.tags.length > 0 && narrowLists(query).categories.length === 0;
    const followedFeed = withLiveDesigns(followedRows).map((row) => this.toCollectionFeedRow(row));
    const otherFeed = withLiveDesigns(otherRows).map((row) => this.toCollectionFeedRow(row));
    const mergedFeed = softRank
      ? this.mergeFollowThenInterest(followedFeed, otherFeed, interest, city)
      : [
          ...followedFeed,
          ...[...otherFeed].sort((a, b) => compareByMarketRelevance(a, b, interest, city)),
        ];
    const page = pageMerged(mergedFeed, query, (row) => row.collection!.id);
    const cards = page.map((row) => row.collection!);
    return this.toCollectionCardPage(viewerCompanyId, cards, query.limit);
  }

  async companies(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<CompanyCard>> {
    const lookingForBuyers = query.scope === 'sell';
    const { categories, cities } = narrowLists(query);
    const categoryClause = lookingForBuyers
      ? categories.length
        ? categoryHasSomeWhere(categories, 'buyCategories')
        : { buyCategories: { isEmpty: false } }
      : categories.length
        ? categoryHasSomeWhere(categories, 'sellCategories')
        : { sellCategories: { isEmpty: false } };
    const where: Prisma.CompanyWhereInput = {
      id: { not: viewerCompanyId },
      ...categoryClause,
      ...cityEqualsWhere(cities),
      AND: [
        companyNotBlockedWith(viewerCompanyId),
        discoverableProfileWhere(viewerCompanyId),
      ],
    };
    if (query.following) {
      where.followers = { some: { followerCompanyId: viewerCompanyId } };
    }

    const rows = await this.prisma.company.findMany({ where, ...cursorArgs(query) });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toCompanyCard(row));
  }

  /**
   * Suppliers (or scoped companies) with at least one audience-visible published
   * collection or Explore-posted design. Ranked: interest match → rest, then
   * newest post activity (following is not pinned to the top).
   */
  async postedSuppliers(
    viewerCompanyId: string,
    query: ExploreQuery,
  ): Promise<CursorPage<ExploreSupplierCard>> {
    const lookingForBuyers = query.scope === 'sell';
    const { categories, cities } = narrowLists(query);
    const visibleOr = audienceVisibilityOr(viewerCompanyId) as Prisma.CollectionWhereInput[];
    const visibleProductOr = audienceVisibilityOr(viewerCompanyId) as Prisma.ProductWhereInput[];

    const postedContent: Prisma.CompanyWhereInput = {
      OR: [
        {
          collections: {
            some: {
              status: CollectionStatus.Published,
              OR: visibleOr,
              AND: [curatedSourceExcludeAnd(viewerCompanyId), ...liveWindowClauses()],
            },
          },
        },
        {
          products: {
            some: {
              status: ProductStatus.Published,
              postedToMarketAt: { not: null },
              OR: visibleProductOr,
            },
          },
        },
      ],
    };

    const where: Prisma.CompanyWhereInput = {
      id: { not: viewerCompanyId },
      AND: [
        postedContent,
        companyNotBlockedWith(viewerCompanyId),
        discoverableProfileWhere(viewerCompanyId),
      ],
      ...(lookingForBuyers
        ? categories.length
          ? categoryHasSomeWhere(categories, 'buyCategories')
          : { buyCategories: { isEmpty: false } }
        : categories.length
          ? categoryHasSomeWhere(categories, 'sellCategories')
          : {}),
      ...cityEqualsWhere(cities),
    };
    if (query.following) {
      where.followers = { some: { followerCompanyId: viewerCompanyId } };
    }

    const companyInclude = {
      collections: {
        where: {
          status: CollectionStatus.Published,
          OR: visibleOr,
          AND: liveWindowClauses(),
        },
        orderBy: { updatedAt: 'desc' as const },
        take: 4,
        select: {
          updatedAt: true,
          coverImage: true,
          products: {
            where: { excluded: false },
            orderBy: { position: 'asc' as const },
            take: 2,
            select: { product: { select: { images: true } } },
          },
        },
      },
      products: {
        where: {
          status: ProductStatus.Published,
          postedToMarketAt: { not: null },
          OR: visibleProductOr,
        },
        orderBy: { postedToMarketAt: 'desc' as const },
        take: 4,
        select: { images: true, postedToMarketAt: true },
      },
      _count: {
        select: {
          collections: {
            where: {
              status: CollectionStatus.Published,
              OR: visibleOr,
              AND: liveWindowClauses(),
            },
          },
          products: {
            where: {
              status: ProductStatus.Published,
              postedToMarketAt: { not: null },
              OR: visibleProductOr,
            },
          },
        },
      },
    } satisfies Prisma.CompanyInclude;

    type PostedCompanyRow = Prisma.CompanyGetPayload<{ include: typeof companyInclude }>;

    const [followed, connectedRows, rankCtx] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerCompanyId: viewerCompanyId, status: 'allowed' },
        select: { followedCompanyId: true },
      }),
      this.prisma.connection.findMany({
        where: activeConnectionsForCompanyWhere(viewerCompanyId),
        select: { companyLowId: true, companyHighId: true },
      }),
      this.resolveViewerRankContext(viewerCompanyId, query),
    ]);
    const followedIds = followed.map((row) => row.followedCompanyId);
    const connectedIds = new Set(counterpartIdsFromRows(viewerCompanyId, connectedRows));
    const followedSet = new Set(followedIds);
    const fetchCap = Math.min(Math.max(query.limit * 4, 40), 120);

    // Single pool — do not pin followed companies ahead of discovery.
    const rows = await this.prisma.company.findMany({
      where,
      include: companyInclude,
      take: fetchCap,
    });

    const toCard = (row: PostedCompanyRow): ExploreSupplierCard & { sortAt: number } => {
      const company = this.discovery.toCompanyCard(row);
      const designTimes = row.products
        .map((product) => product.postedToMarketAt?.getTime() ?? 0)
        .filter((time) => time > 0);
      const collectionTimes = row.collections.map((collection) => collection.updatedAt.getTime());
      const sortAt = Math.max(0, ...designTimes, ...collectionTimes);
      const previewImages: string[] = [];
      for (const product of row.products) {
        for (const image of product.images) {
          if (image && !previewImages.includes(image)) previewImages.push(image);
          if (previewImages.length >= 4) break;
        }
        if (previewImages.length >= 4) break;
      }
      if (previewImages.length < 4) {
        for (const collection of row.collections) {
          const cover =
            collection.coverImage ||
            collection.products.flatMap((entry) => entry.product.images)[0] ||
            null;
          if (cover && !previewImages.includes(cover)) previewImages.push(cover);
          if (previewImages.length >= 4) break;
        }
      }
      const relevance = this.companyRelevance(
        company,
        connectedIds,
        followedSet,
        lookingForBuyers ? 'buy' : 'sell',
      );

      return {
        company,
        relevance,
        previewImages: mapMediaUrlsForViewer(previewImages.slice(0, 4), 'preview'),
        designCount: row._count.products,
        collectionCount: row._count.collections,
        latestPostedAt: sortAt > 0 ? new Date(sortAt).toISOString() : row.createdAt.toISOString(),
        sortAt,
      };
    };

    const interest = rankCtx.interest;
    const matchInterest = rows
      .filter((row) => matchesCompanyInterest(row, interest))
      .map(toCard)
      .sort((a, b) => b.sortAt - a.sortAt);
    const rest = rows
      .filter((row) => !matchesCompanyInterest(row, interest))
      .map(toCard)
      .sort((a, b) => b.sortAt - a.sortAt);
    const merged = [...matchInterest, ...rest];
    const page = pageMerged(merged, query, (row) => row.company.id);
    return toCursorPage(
      page,
      query.limit,
      (row) => {
        const { sortAt: _sortAt, ...card } = row;
        return card;
      },
      (row) => row.company.id,
    );
  }

  /**
   * Cross-company collection view. Discoverable audiences (e.g. everyone) get
   * the product list without a Connection; restricted audiences still gate
   * products until connected / selected / following as published.
   */
  async collectionDetail(viewerCompanyId: string, id: string): Promise<CollectionPreviewView> {
    let collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        company: true,
        _count: { select: { products: { where: { excluded: false } } } },
        products: {
          where: { excluded: false },
          orderBy: { position: 'asc' },
          include: { product: true },
        },
      },
    });

    const notFound = () =>
      new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    if (!collection) {
      throw notFound();
    }

    // Narrow away `null` before reassignment (Prisma include types widen on `let` writes).
    let album = collection;
    const isOwner = album.companyId === viewerCompanyId;
    if (isOwner && isGeneralKind((album as { kind?: string }).kind)) {
      const members = await this.prisma.product.findMany({
        where: generalMemberProductWhere(viewerCompanyId),
        orderBy: { createdAt: 'desc' },
      });
      const collectionId = album.id;
      album = {
        ...album,
        products: generalMemberJoinRows(collectionId, members),
        _count: { ...album._count, products: members.length },
      };
    }
    album = {
      ...album,
      products: presentCollectionProducts(album.products),
    };
    const connected =
      isOwner || (await this.visibility.canViewCatalog(viewerCompanyId, album.companyId));
    const following =
      isOwner ||
      (await this.prisma.follow.findUnique({
        where: {
          followerCompanyId_followedCompanyId: {
            followerCompanyId: viewerCompanyId,
            followedCompanyId: album.companyId,
          },
        },
        select: { status: true },
      }))?.status === 'allowed';
    const audienceCtx = { connected, following };
    // Forward free / soft shell: live pack + known shop always returns the shell.
    // Designs stay gated — products null → Ask UI. Chat share no longer needed
    // just to reach the shell (was only bypassing the old hard 404).
    const hasViewGrant =
      !isOwner &&
      (await this.prisma.collectionViewGrant.findFirst({
        where: {
          collectionId: id,
          companyId: viewerCompanyId,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      })) != null;
    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, album.companyId)) {
        throw notFound();
      }
      if (!isCollectionLiveForBuyers(album)) {
        throw notFound();
      }
      // Live published + known shop → soft shell (products null). Soft-unavailable
      // vs Ask is distinguished via softUnavailable on the preview. Hard 404 only
      // when blocked / not live / missing (above).
    }

    const albumAvailability = await resolveBuyerRepostPackAvailability(this.prisma, [
      {
        id: album.id,
        companyId: album.companyId,
        repostSourceCollectionId: (
          album as { repostSourceCollectionId?: string | null }
        ).repostSourceCollectionId,
      },
    ]);
    const upstreamSoftOmit = albumAvailability.omitIds.has(album.id);
    const upstreamChainSoft = albumAvailability.chainSoftIds.has(album.id);
    // Buyers: full soft shell only when omitted. Owners: banner when chain soft.
    const softUnavailable = !isOwner && upstreamSoftOmit;
    const upstreamUnavailable = isOwner && upstreamChainSoft;

    const showProducts =
      isOwner ||
      (!softUnavailable &&
        canViewCollectionProducts(viewerCompanyId, album, audienceCtx, hasViewGrant));

    let products: ProductView[] | null = null;
    if (showProducts) {
      const memberRows = isOwner
        ? album.products
        : upstreamChainSoft
          ? filterViewerEligibleMembers(
              album.companyId,
              album.products.map((entry) => ({
                ...entry,
                membershipOrigin: (
                  entry as { membershipOrigin?: string | null }
                ).membershipOrigin,
                excluded: (entry as { excluded?: boolean }).excluded === true,
              })),
              true,
            )
          : filterSoftAvailableProducts(album.companyId, album.products);
      const foreignSourceIds = [
        ...new Set(
          memberRows
            .map((entry) => entry.product.companyId)
            .filter((sourceId) => sourceId !== album.companyId),
        ),
      ];
      const connectedToSource = new Map<string, boolean>();
      await Promise.all(
        foreignSourceIds.map(async (sourceId) => {
          connectedToSource.set(
            sourceId,
            await this.visibility.canViewCatalog(viewerCompanyId, sourceId),
          );
        }),
      );

      const ownerIds = [
        ...new Set(memberRows.map((entry) => entry.product.companyId)),
      ];
      const ownerRows = await this.prisma.company.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true },
      });
      const ownerName = new Map(ownerRows.map((row) => [row.id, row.name]));

      const packOwnerName = album.company.name;
      const sourceHopRows = await this.loadSourceCreditHopRows([
        (album as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
      ]);
      const sourceHops = sourceHopsFromRows(
        (album as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
        sourceHopRows,
      );
      const usesCalc = isRepostPricingMode(
        (album as { repostPricingMode?: string | null }).repostPricingMode,
      );
      const albumBuyerRates = usesCalc
        ? await resolvePackMemberBuyerRates(this.prisma, album, {
            viewerCompanyId,
          })
        : null;
      products = memberRows
        .filter((entry) =>
          isOwner
            ? entry.product.status !== ProductStatus.Archived
            : entry.product.status === ProductStatus.Published,
        )
        .map((entry) => {
        const millName = ownerName.get(entry.product.companyId) ?? null;
        // Owner: real mill. Visitors: Show supplier + hop ceiling (never leak hidden S1).
        const companyName = visitorDesignCreditCompanyName({
          isOwner,
          showSourceShops: album.showSourceShops === true,
          packCompanyId: album.companyId,
          packCompanyName: packOwnerName,
          productCompanyId: entry.product.companyId,
          productCompanyName: millName,
          sourceHops,
          declaredSourceCollectionId:
            (album as { repostSourceCollectionId?: string | null })
              .repostSourceCollectionId ?? null,
          hopRows: sourceHopRows,
        });
        const view = {
          ...this.catalog.toProductView(entry.product),
          companyName,
        };
        // Pack owner always gets full member media even when companyId is the mill.
        const access =
          isOwner ||
          album.allowDownload === true ||
          entry.product.allowDownload === true
            ? 'full'
            : 'preview';
        const withMedia = {
          ...view,
          // Effective download for this album hop (pack OR design).
          allowDownload:
            isOwner ||
            album.allowDownload === true ||
            entry.product.allowDownload === true,
          images: mapMediaUrlsForViewer(view.images, access),
        };
        if (usesCalc) {
          const buyerFacing = albumBuyerRates?.get(entry.productId)?.buyerFacing ?? null;
          if (isOwner) {
            return { ...withMedia, rate: buyerFacing };
          }
          if (!connected && album.rateVisibility === RateVisibility.OnRequest) {
            return { ...withMedia, rate: null };
          }
          return { ...withMedia, rate: buyerFacing };
        }
        if (isOwner) {
          return withMedia;
        }
        // Rates stay "on request" until connected when the collection says so.
        if (!connected && album.rateVisibility === RateVisibility.OnRequest) {
          return { ...withMedia, rate: null };
        }
        // Foreign members: apply the source product's rate ceiling for this viewer.
        const sourceId = entry.product.companyId;
        if (
          sourceId !== album.companyId &&
          entry.product.rateVisibility === RateVisibility.OnRequest &&
          !connectedToSource.get(sourceId)
        ) {
          return { ...withMedia, rate: null };
        }
        return withMedia;
      });
    }

    const millCompanyIds = [
      ...new Set(
        album.products
          .map((entry) => entry.product.companyId)
          .filter((sourceId) => sourceId !== album.companyId),
      ),
    ];
    let viewerTicket: 'me' | 'mill' | null = null;
    let directMillCompanyIds: string[] = [];
    if (!isOwner && millCompanyIds.length > 0) {
      const lanes = await this.prisma.tradeLane.findMany({
        where: {
          traderCompanyId: album.companyId,
          buyerCompanyId: viewerCompanyId,
          sellerCompanyId: { in: millCompanyIds },
        },
        select: { sellerCompanyId: true, ticket: true, behaviors: true },
      });
      viewerTicket = viewerPackTicket({
        isOwner,
        millCompanyIds,
        lanes: lanes.map((lane) => ({
          sellerCompanyId: lane.sellerCompanyId,
          ticket: lane.ticket === 'mill' ? 'mill' : 'me',
        })),
      });
      const laneByMill = new Map(lanes.map((lane) => [lane.sellerCompanyId, lane]));
      const packMills = await millShareActiveSet(
        this.prisma,
        album.companyId,
        millCompanyIds,
      );
      directMillCompanyIds = millCompanyIds.filter((millId) => {
        const lane = laneByMill.get(millId);
        return laneRoutesDirect({
          ticket: lane?.ticket,
          behaviors: lane?.behaviors,
          millShareActive: packMills.has(millId),
        });
      });
    }

    const albumSourceHopRows = await this.loadSourceCreditHopRows([
      (album as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
    ]);
    const albumSourceHops = sourceHopsFromRows(
      (album as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
      albumSourceHopRows,
    );
    const generalAlbum = isGeneralKind((album as { kind?: string }).kind);
    // Calc modes: band from resolved buyer-facing (never raw foreign Product.rate).
    let resolvedAlbumBand: { rateMin: number | null; rateMax: number | null } | null =
      null;
    if (
      !generalAlbum &&
      isRepostPricingMode((album as { repostPricingMode?: string | null }).repostPricingMode)
    ) {
      const resolved = await resolvePackMemberBuyerRates(this.prisma, album, {
        viewerCompanyId,
      });
      resolvedAlbumBand = buyerFacingBand(
        [...resolved.values()].map((row) => row.buyerFacing),
      );
    }
    const card = this.discovery.toCollectionCard(album, {
      viewerCompanyId,
      sourceHops: albumSourceHops,
      hopRows: albumSourceHopRows,
      resolvedBand: resolvedAlbumBand,
    });
    const sourceShopNames =
      card.sourceShopNames.length > 0
        ? card.sourceShopNames
        : collectionSourceShopNames(
            album.companyId,
            album.showSourceShops === true,
            (products ?? []).map((row) => ({
              product: {
                companyId: row.companyId,
                company: { name: row.companyName?.trim() || '' },
              },
            })),
            albumSourceHops,
            {
              declaredSourceCollectionId:
                (album as { repostSourceCollectionId?: string | null })
                  .repostSourceCollectionId ?? null,
              hopRows: albumSourceHopRows,
            },
          );
    // Album facts: pack rate first; else min–max priced designs. Owner always
    // sees the band; on_request hides it from other users only.
    // General Collection is leftover storage — not a pack ₹ band.
    const albumRate = generalAlbum
      ? { rateMin: null, rateMax: null, rateUnit: null }
      : collectionCardRateFields({
          rateVisibility: collectionCardRateVisibility({
            rateVisibility: album.rateVisibility,
            packCompanyId: album.companyId,
            viewerCompanyId,
          }),
          rate: album.rate,
          rateMax: album.rateMax,
          catalogRateUnit: (album as { catalogRateUnit?: string | null }).catalogRateUnit,
          products: album.products,
          resolvedBand: resolvedAlbumBand,
        });
    const description = album.description?.trim() || null;
    // Locked / soft-unavailable: name + shop — no cover, designs, rates, or supplier credit.
    // softUnavailable flag lets the client show unavailable chrome (not Ask).
    if (!showProducts) {
      return {
        ...card,
        sourceShopNames: softUnavailable ? [] : sourceShopNames,
        rateMin: softUnavailable ? null : albumRate.rateMin,
        rateMax: softUnavailable ? null : albumRate.rateMax,
        rateUnit: softUnavailable ? null : albumRate.rateUnit,
        description: softUnavailable ? null : description,
        coverImage: null,
        previewImages: [],
        imageCount: 0,
        connected,
        products: null,
        softUnavailable,
        upstreamUnavailable: false,
        viewerTicket: null,
        directMillCompanyIds: [],
      };
    }
    return {
      ...card,
      sourceShopNames,
      rateMin: albumRate.rateMin,
      rateMax: albumRate.rateMax,
      rateUnit: albumRate.rateUnit,
      description,
      connected,
      products,
      softUnavailable: false,
      upstreamUnavailable,
      productCount: products?.length ?? 0,
      viewerTicket,
      directMillCompanyIds,
    };
  }

  /**
   * Followed (recency) → interest public (relevance) → rest (relevance).
   * Relevance = interest match + freshness + same-city.
   */
  mergeFollowThenInterest(
    followedRows: FeedRow[],
    otherRows: FeedRow[],
    interest: ResolvedInterest,
    viewerCity: string | null = null,
  ): FeedRow[] {
    const matchOther = otherRows
      .filter((row) => matchesCompanyInterest(row.company, interest))
      .sort((a, b) => compareByMarketRelevance(a, b, interest, viewerCity));
    const otherOther = otherRows
      .filter((row) => !matchesCompanyInterest(row.company, interest))
      .sort((a, b) => compareByMarketRelevance(a, b, interest, viewerCity));
    return [...followedRows, ...matchOther, ...otherOther];
  }

  async productDetail(
    viewerCompanyId: string,
    id: string,
  ): Promise<ExploreProductPreviewView> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { company: true },
    });
    const notFound = () =>
      new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    if (!product) {
      throw notFound();
    }

    const isOwner = product.companyId === viewerCompanyId;
    const connected =
      isOwner || (await this.visibility.canViewCatalog(viewerCompanyId, product.companyId));
    const following =
      isOwner ||
      (await this.prisma.follow.findUnique({
        where: {
          followerCompanyId_followedCompanyId: {
            followerCompanyId: viewerCompanyId,
            followedCompanyId: product.companyId,
          },
        },
        select: { status: true },
      }))?.status === 'allowed';
    const audienceCtx = { connected, following };
    const onMarket =
      Boolean(product.postedToMarketAt) &&
      canDiscoverCollection(viewerCompanyId, product, audienceCtx);
    const sharedInChat =
      !isOwner &&
      ((await this.wasSharedInChat(viewerCompanyId, id, MessageType.ProductCard)) ||
        (await this.wasSharedInDesignAlbum(viewerCompanyId, id)));

    let viaOpenCollection = false;
    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, product.companyId)) {
        throw notFound();
      }
      if (product.status !== ProductStatus.Published) {
        throw notFound();
      }
      // Market post, connection, chat share, or still visible in an openable album.
      // Otherwise soft preview (visible: false) so Request access can show.
      if (!connected && !onMarket && !sharedInChat) {
        viaOpenCollection = await productAccessibleViaCollection(
          this.prisma,
          this.visibility,
          viewerCompanyId,
          id,
          { wasSharedInChat: (viewer, ref, type) => this.wasSharedInChat(viewer, ref, type) },
        );
      }
    }

    const showBody =
      isOwner ||
      sharedInChat ||
      viaOpenCollection ||
      canViewCollectionProducts(viewerCompanyId, product, audienceCtx);
    const card = this.discovery.toExploreProductCard(product);
    const extras = {
      connected,
      description: product.description,
      moq: product.moq ?? null,
      piecesPerPack: product.piecesPerPack ?? null,
      dispatchUnit: product.dispatchUnit ?? null,
      categories: product.categories,
    };
    if (!showBody) {
      return { ...card, ...extras, images: [], rate: null, visible: false };
    }
    const access = catalogMediaAccess({
      viewerCompanyId,
      ownerCompanyId: product.companyId,
      allowDownload: product.allowDownload === true,
    });
    const images = mapMediaUrlsForViewer(product.images, access);
    const allowDownload = isOwner || product.allowDownload === true;
    // Curated via-pack: trader calc quote beats mill Product.rate for buyers.
    const viaPackRate = await buyerFacingViaCuratedPackForProduct(
      this.prisma,
      viewerCompanyId,
      id,
      product.companyId,
    );
    if (viaPackRate !== undefined) {
      return { ...card, ...extras, images, allowDownload, rate: viaPackRate, visible: true };
    }
    if (!isOwner && !connected && product.rateVisibility === RateVisibility.OnRequest) {
      return { ...card, ...extras, images, allowDownload, rate: null, visible: true };
    }
    return { ...card, ...extras, images, allowDownload, visible: true };
  }

  /** True when this object was shared into a thread the viewer still belongs to. */
  private async wasSharedInChat(
    viewerCompanyId: string,
    referenceId: string,
    type: string,
  ): Promise<boolean> {
    const hit = await this.prisma.message.findFirst({
      where: {
        type,
        referenceId,
        thread: {
          participants: {
            some: { companyId: viewerCompanyId, leftAt: null },
          },
        },
      },
      select: { id: true },
    });
    return Boolean(hit);
  }

  /** Design album chat cards list product ids in metadata — same unlock as ProductCard. */
  private async wasSharedInDesignAlbum(
    viewerCompanyId: string,
    productId: string,
  ): Promise<boolean> {
    const hit = await this.prisma.message.findFirst({
      where: {
        type: MessageType.DesignAlbum,
        thread: {
          participants: {
            some: { companyId: viewerCompanyId, leftAt: null },
          },
        },
        AND: [
          {
            metadata: {
              path: ['productIds'],
              array_contains: productId,
            },
          },
        ],
      },
      select: { id: true },
    });
    return Boolean(hit);
  }

  private toOpportunity(
    collection: CollectionCard,
    interest: ResolvedInterest,
    connectedIds: Set<string>,
    followedIds: Set<string>,
    trade?: { sellCategories: string[]; superCategories: string[] },
  ): ExploreOpportunity {
    return {
      collection,
      relevance: this.collectionRelevance(
        collection,
        interest,
        connectedIds,
        followedIds,
        trade,
      ),
    };
  }

  private toDesignOpportunity(
    product: ExploreProductCard,
    interest: ResolvedInterest,
    connectedIds: Set<string>,
    followedIds: Set<string>,
    trade?: { sellCategories: string[]; superCategories: string[] },
  ): ExploreDesignOpportunity {
    return {
      product,
      relevance: this.designRelevance(product, interest, connectedIds, followedIds, trade),
    };
  }

  private toSuggestedOpportunity(
    company: CompanyCard,
    connectedIds: Set<string>,
    followedIds: Set<string>,
    tradeSide: 'buy' | 'sell',
    viewerSell: string[] = [],
    viewerBuy: string[] = [],
    shop?: {
      previewImages: string[];
      designCount: number;
      collectionCount: number;
      latestPostedAt: string | null;
    },
  ): ExploreBuyerOpportunity {
    return {
      company,
      relevance: this.companyRelevance(
        company,
        connectedIds,
        followedIds,
        tradeSide,
        viewerSell,
        viewerBuy,
      ),
      previewImages: shop?.previewImages ?? [],
      designCount: shop?.designCount ?? 0,
      collectionCount: shop?.collectionCount ?? 0,
      latestPostedAt: shop?.latestPostedAt ?? null,
    };
  }

  /** Visible published design/collection thumbs for company cards. */
  private async shopPreviewsForCompanies(
    viewerCompanyId: string,
    companyIds: string[],
  ): Promise<
    Map<
      string,
      {
        previewImages: string[];
        designCount: number;
        collectionCount: number;
        latestPostedAt: string | null;
      }
    >
  > {
    const map = new Map<
      string,
      {
        previewImages: string[];
        designCount: number;
        collectionCount: number;
        latestPostedAt: string | null;
      }
    >();
    if (companyIds.length === 0) return map;

    const visibleOr = audienceVisibilityOr(viewerCompanyId) as Prisma.CollectionWhereInput[];
    const visibleProductOr = audienceVisibilityOr(viewerCompanyId) as Prisma.ProductWhereInput[];

    const rows = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: {
        id: true,
        collections: {
          where: {
            status: CollectionStatus.Published,
            OR: visibleOr,
            AND: [...liveWindowClauses(), hasPublishedDesignClause()],
          },
          orderBy: { updatedAt: 'desc' },
          take: 4,
          select: {
            updatedAt: true,
            coverImage: true,
            products: {
              where: { excluded: false },
              orderBy: { position: 'asc' },
              take: 2,
              select: { product: { select: { images: true } } },
            },
          },
        },
        products: {
          where: {
            status: ProductStatus.Published,
            postedToMarketAt: { not: null },
            OR: visibleProductOr,
          },
          orderBy: { postedToMarketAt: 'desc' },
          take: 4,
          select: { images: true, postedToMarketAt: true },
        },
        _count: {
          select: {
            collections: {
              where: {
                status: CollectionStatus.Published,
                OR: visibleOr,
                AND: [...liveWindowClauses(), hasPublishedDesignClause()],
              },
            },
            products: {
              where: {
                status: ProductStatus.Published,
                postedToMarketAt: { not: null },
                OR: visibleProductOr,
              },
            },
          },
        },
      },
    });

    for (const row of rows) {
      const previewImages: string[] = [];
      for (const product of row.products) {
        for (const image of product.images) {
          if (image && !previewImages.includes(image)) previewImages.push(image);
          if (previewImages.length >= 4) break;
        }
        if (previewImages.length >= 4) break;
      }
      if (previewImages.length < 4) {
        for (const collection of row.collections) {
          const cover =
            collection.coverImage ||
            collection.products.flatMap((entry) => entry.product.images)[0] ||
            null;
          if (cover && !previewImages.includes(cover)) previewImages.push(cover);
          if (previewImages.length >= 4) break;
        }
      }
      const designTimes = row.products
        .map((product) => product.postedToMarketAt?.getTime() ?? 0)
        .filter((time) => time > 0);
      const collectionTimes = row.collections.map((collection) => collection.updatedAt.getTime());
      const latestMs = Math.max(0, ...designTimes, ...collectionTimes);
      map.set(row.id, {
        previewImages: mapMediaUrlsForViewer(previewImages.slice(0, 4), 'preview'),
        designCount: row._count.products,
        collectionCount: row._count.collections,
        latestPostedAt: latestMs > 0 ? new Date(latestMs).toISOString() : null,
      });
    }
    return map;
  }

  private designRelevance(
    product: ExploreProductCard,
    interest: ResolvedInterest,
    connectedIds: Set<string>,
    followedIds: Set<string>,
    trade?: { sellCategories: string[]; superCategories: string[] },
  ): string | null {
    const parts: string[] = [];
    const companyId = product.company.id;
    if (connectedIds.has(companyId)) {
      parts.push('Connected');
    } else if (followedIds.has(companyId)) {
      parts.push('In your network');
    }
    if (product.company.verification === VerificationStatus.GstVerified) {
      parts.push('GST verified');
    }
    if (trade && interest.tags.length + interest.supers.length > 0) {
      const companyRow = {
        id: companyId,
        city: product.company.city,
        sellCategories: trade.sellCategories,
        superCategories: trade.superCategories,
      };
      if (matchesCompanyInterest(companyRow, interest)) {
        const hit =
          interest.tags.find((tag) => trade.sellCategories.includes(tag)) ??
          interest.supers.find((superId) => trade.superCategories.includes(superId));
        if (hit) {
          parts.push(`Matches ${interestHitLabel(hit)}`);
        }
      }
    }
    if (parts.length === 0) {
      return product.company.city || null;
    }
    return parts.slice(0, 3).join(' · ');
  }

  private collectionRelevance(
    collection: CollectionCard,
    interest: ResolvedInterest,
    connectedIds: Set<string>,
    followedIds: Set<string>,
    trade?: { sellCategories: string[]; superCategories: string[] },
  ): string | null {
    const parts: string[] = [];
    const companyId = collection.company.id;
    if (connectedIds.has(companyId)) {
      parts.push('Connected');
    } else if (followedIds.has(companyId)) {
      parts.push('In your network');
    }
    if (collection.company.verification === VerificationStatus.GstVerified) {
      parts.push('GST verified');
    }
    if (trade && interest.tags.length + interest.supers.length > 0) {
      const companyRow = {
        id: companyId,
        city: collection.company.city,
        sellCategories: trade.sellCategories,
        superCategories: trade.superCategories,
      };
      if (matchesCompanyInterest(companyRow, interest)) {
        const hit =
          interest.tags.find((tag) => trade.sellCategories.includes(tag)) ??
          interest.supers.find((superId) => trade.superCategories.includes(superId));
        if (hit) {
          parts.push(`Matches ${interestHitLabel(hit)}`);
        }
      }
    }
    if (parts.length === 0) {
      return collection.company.city || null;
    }
    return parts.slice(0, 3).join(' · ');
  }

  /**
   * Why-connect line for business shelves (max 2 clauses):
   * Connected / In your network → interest match → GST → city.
   */
  private companyRelevance(
    company: CompanyCard,
    connectedIds: Set<string>,
    followedIds: Set<string>,
    tradeSide: 'buy' | 'sell',
    viewerSell: string[] = [],
    viewerBuy: string[] = [],
  ): string | null {
    const parts: string[] = [];
    if (connectedIds.has(company.id)) {
      parts.push('Connected');
    } else if (followedIds.has(company.id)) {
      parts.push('In your network');
    }

    if (tradeSide === 'sell') {
      const match = viewerBuy.find((tag) => company.sellCategories.includes(tag));
      const sell = match ?? company.sellCategories.filter(Boolean)[0];
      // Plain: “Sells Sarees” — section title already frames why they’re suggested.
      if (sell) parts.push(`Sells ${interestHitLabel(sell)}`);
    } else {
      const match = viewerSell.find((tag) => company.buyCategories.includes(tag));
      if (match) {
        parts.push(`May want your ${interestHitLabel(match)}`);
      } else {
        const buy = company.buyCategories.filter(Boolean)[0];
        // Avoid “May want… · Buys…” double phrasing — one clear clause.
        parts.push(buy ? `Buys ${interestHitLabel(buy)}` : 'May want what you sell');
      }
    }

    if (parts.length < 2 && company.verification === VerificationStatus.GstVerified) {
      parts.push('GST verified');
    }
    if (parts.length < 2 && company.city) {
      parts.push(company.city);
    }
    return parts.length > 0 ? parts.slice(0, 2).join(' · ') : null;
  }

  private async memberProductIdsForCollections(collectionIds: string[]): Promise<Set<string>> {
    if (collectionIds.length === 0) return new Set();
    const members = await this.prisma.collectionProduct.findMany({
      where: { collectionId: { in: collectionIds }, excluded: false },
      select: { productId: true },
    });
    return new Set(members.map((row) => row.productId));
  }

  /** Pack already shows the design — keep the album, drop the solo tile. */
  private async hideDesignsCoveredByPacks(rows: FeedRow[]): Promise<FeedRow[]> {
    const collectionIds = [
      ...new Set(
        rows.flatMap((row) => (row.kind === 'collection' && row.collection ? [row.collection.id] : [])),
      ),
    ];
    return omitCoveredDesignFeedRows(rows, await this.memberProductIdsForCollections(collectionIds));
  }

  /** P1: omit soft-unavailable descendant packs from buyer-facing Explore feeds. */
  private async omitSoftUnavailableFeedRows(
    viewerCompanyId: string,
    rows: FeedRow[],
  ): Promise<FeedRow[]> {
    const packs = rows.flatMap((row) =>
      row.kind === 'collection' && row.collection
        ? [
            {
              id: row.collection.id,
              companyId: row.collection.companyId,
              repostSourceCollectionId: (
                row.collection as { repostSourceCollectionId?: string | null }
              ).repostSourceCollectionId,
            },
          ]
        : [],
    );
    if (packs.length === 0) return rows;
    const availability = await resolveBuyerRepostPackAvailability(this.prisma, packs);
    const softOff = availability.omitIds;
    return rows.flatMap((row) => {
      if (row.kind !== 'collection' || !row.collection) return [row];
      if (row.collection.companyId === viewerCompanyId) return [row];
      if (softOff.has(row.collection.id)) return [];
      const eligibleIds = availability.eligibleProductIdsByPackId.get(row.collection.id);
      if (!eligibleIds) return [row];
      return [
        {
          ...row,
          collection: projectEligibleCollectionMembers(
            row.collection,
            viewerCompanyId,
            eligibleIds,
          ),
        },
      ];
    });
  }

  private toCollectionFeedRow(row: CollectionCardRow): FeedRow {
    return {
      feedId: `c:${row.id}`,
      postedAt: row.exploreActivityAt ?? row.createdAt,
      company: row.company,
      kind: 'collection',
      collection: row,
    };
  }

  private toProductFeedRow(row: ProductFeedRow): FeedRow {
    return {
      feedId: `p:${row.id}`,
      postedAt: row.postedToMarketAt ?? row.createdAt,
      company: row.company,
      kind: 'product',
      product: row,
    };
  }

  private resolvedBandsByPack(
    viewerCompanyId: string,
    rows: Parameters<typeof resolvedBandsForPacks>[2],
  ) {
    return resolvedBandsForPacks(this.prisma, viewerCompanyId, rows);
  }

  /** Stamp Explore cards so already-reposted peer posts show the done icon. */
  private async toCollectionCardPage(
    viewerCompanyId: string,
    rows: CollectionCardRow[],
    limit: number,
  ): Promise<CursorPage<CollectionCard>> {
    const stamps = await this.viewerRepostStamps(viewerCompanyId, {
      collectionIds: rows.map((row) => row.id),
      productIds: [],
    });
    const availability = await resolveBuyerRepostPackAvailability(
      this.prisma,
      rows.map((row) => ({
        id: row.id,
        companyId: row.companyId,
        repostSourceCollectionId: (
          row as { repostSourceCollectionId?: string | null }
        ).repostSourceCollectionId,
      })),
    );
    const softOff = availability.omitIds;
    const visible = rows
      .filter((row) => row.companyId === viewerCompanyId || !softOff.has(row.id))
      .map((row) =>
        projectEligibleCollectionMembers(
          row,
          viewerCompanyId,
          availability.eligibleProductIdsByPackId.get(row.id),
        ),
      );
    const eligible = await this.eligibleCountByCollection(viewerCompanyId, visible);
    const sourceHopRows = await this.loadSourceCreditHopRows(
      visible.map(
        (row) =>
          (row as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
      ),
    );
    const bands = await this.resolvedBandsByPack(viewerCompanyId, visible);
    return toCursorPage(visible, limit, (row) =>
      this.discovery.toCollectionCard(row, {
        viewerReposted: stamps.collections.has(row.id),
        viewerRepostCollectionId: stamps.collections.get(row.id) ?? null,
        viewerCompanyId,
        repostEligibleCount: eligible.get(row.id) ?? 0,
        sourceHops: sourceHopsFromRows(
          (row as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
          sourceHopRows,
        ),
        hopRows: sourceHopRows,
        resolvedBand: bands.get(row.id) ?? null,
      }),
    );
  }

  private async loadSourceCreditHopRows(
    sourceIds: Array<string | null | undefined>,
  ): Promise<Map<string, SourceCreditHopRow>> {
    return loadSourceCreditHopRows(this.prisma, sourceIds);
  }

  private async toProductCardPage(
    viewerCompanyId: string,
    rows: ProductFeedRow[],
    limit: number,
  ): Promise<CursorPage<ExploreProductCard>> {
    const stamps = await this.viewerRepostStamps(viewerCompanyId, {
      collectionIds: [],
      productIds: rows.map((row) => row.id),
    });
    const allowed = await this.allowedProductIdSet(
      viewerCompanyId,
      rows.map((row) => row.id),
    );
    return toCursorPage(rows, limit, (row) =>
      this.discovery.toExploreProductCard(row, {
        viewerReposted: stamps.products.has(row.id),
        viewerRepostCollectionId: stamps.products.get(row.id) ?? null,
        repostEligibleCount: allowed.has(row.id) ? 1 : 0,
      }),
    );
  }

  private async viewerRepostStampsForFeed(
    viewerCompanyId: string,
    rows: FeedRow[],
  ): Promise<{ collections: Map<string, string>; products: Map<string, string> }> {
    return this.viewerRepostStamps(viewerCompanyId, {
      collectionIds: rows.flatMap((row) =>
        row.kind === 'collection' && row.collection ? [row.collection.id] : [],
      ),
      productIds: rows.flatMap((row) =>
        row.kind === 'product' && row.product ? [row.product.id] : [],
      ),
    });
  }

  /**
   * Source id → viewer's existing child pack id (edit-from-Explore).
   * Skips reusable draft/auto Selected children (those stay create-reuse).
   */
  private async viewerRepostStamps(
    viewerCompanyId: string,
    ids: { collectionIds: string[]; productIds: string[] },
  ): Promise<{
    collections: Map<string, string>;
    products: Map<string, string>;
  }> {
    const collectionIds = [...new Set(ids.collectionIds)];
    const productIds = [...new Set(ids.productIds)];
    if (collectionIds.length === 0 && productIds.length === 0) {
      return { collections: new Map(), products: new Map() };
    }
    const mine = await this.prisma.collection.findMany({
      where: {
        companyId: viewerCompanyId,
        status: { not: CollectionStatus.Archived },
        OR: [
          ...(collectionIds.length > 0
            ? [{ repostSourceCollectionId: { in: collectionIds } }]
            : []),
          ...(productIds.length > 0 ? [{ repostSourceProductId: { in: productIds } }] : []),
        ],
      },
      select: {
        id: true,
        repostSourceCollectionId: true,
        repostSourceProductId: true,
        status: true,
        audience: true,
        repostOrigin: true,
      },
    });
    const collections = new Map<string, string>();
    const products = new Map<string, string>();
    for (const row of mine) {
      if (shouldReuseRepostChild(row)) continue;
      if (row.repostSourceCollectionId) {
        collections.set(row.repostSourceCollectionId, row.id);
      }
      if (row.repostSourceProductId) {
        products.set(row.repostSourceProductId, row.id);
      }
    }
    return { collections, products };
  }

  private memberProductIds(row: CollectionCardRow): string[] {
    return (row.products ?? [])
      .map((entry) => (entry.product as { id?: string }).id)
      .filter((id): id is string => Boolean(id));
  }

  private async allowedProductIdSet(
    viewerCompanyId: string,
    productIds: string[],
    opts?: { sourceCollectionId?: string },
  ): Promise<Set<string>> {
    const unique = [...new Set(productIds.filter(Boolean))];
    if (unique.length === 0) return new Set();
    const check = await this.collectionService.checkCurateProducts(
      viewerCompanyId,
      unique,
      opts?.sourceCollectionId
        ? { sourceCollectionId: opts.sourceCollectionId }
        : undefined,
    );
    return new Set(check.allowedProductIds);
  }

  /** Id-only members — not the preview slice used for thumbs. */
  private async queryMemberIdsByCollection(
    collectionIds: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (collectionIds.length === 0) return map;
    const client = this.prisma.collectionProduct as
      | { findMany?: (args: unknown) => Promise<Array<{ collectionId: string; productId: string }>> }
      | undefined;
    if (!client?.findMany) return map;
    const members = await client.findMany({
      where: { collectionId: { in: collectionIds }, ...publishedCollectionMemberWhere },
      select: { collectionId: true, productId: true },
    });
    for (const row of members) {
      const list = map.get(row.collectionId) ?? [];
      list.push(row.productId);
      map.set(row.collectionId, list);
    }
    return map;
  }

  private membersForCollection(
    row: CollectionCardRow,
    queried: Map<string, string[]>,
  ): string[] {
    const fromQuery = queried.get(row.id);
    return fromQuery && fromQuery.length > 0 ? fromQuery : this.memberProductIds(row);
  }

  private async eligibleCountByCollection(
    viewerCompanyId: string,
    rows: CollectionCardRow[],
  ): Promise<Map<string, number>> {
    const queried = await this.queryMemberIdsByCollection(rows.map((row) => row.id));
    const map = new Map<string, number>();
    // Per pack: widen pack-only Published members (no solo Explore stamp).
    await Promise.all(
      rows.map(async (row) => {
        const members = this.membersForCollection(row, queried);
        const allowed = await this.allowedProductIdSet(viewerCompanyId, members, {
          sourceCollectionId: row.id,
        });
        map.set(row.id, members.filter((id) => allowed.has(id)).length);
      }),
    );
    return map;
  }

  private async eligibleForFeedRows(
    viewerCompanyId: string,
    rows: FeedRow[],
  ): Promise<{ collections: Map<string, number>; products: Map<string, number> }> {
    const collectionRows = rows.flatMap((row) =>
      row.kind === 'collection' && row.collection ? [row.collection] : [],
    );
    const queried = await this.queryMemberIdsByCollection(collectionRows.map((row) => row.id));
    const membersByCollection = new Map<string, string[]>();
    const productIds: string[] = [];
    for (const row of rows) {
      if (row.kind === 'collection' && row.collection) {
        membersByCollection.set(
          row.collection.id,
          this.membersForCollection(row.collection, queried),
        );
      } else if (row.kind === 'product' && row.product) {
        productIds.push(row.product.id);
      }
    }
    const collections = new Map<string, number>();
    await Promise.all(
      [...membersByCollection.entries()].map(async ([id, members]) => {
        const allowed = await this.allowedProductIdSet(viewerCompanyId, members, {
          sourceCollectionId: id,
        });
        collections.set(id, members.filter((memberId) => allowed.has(memberId)).length);
      }),
    );
    // Solo design tiles still need their own market stamp — no pack widen.
    const allowedProducts = await this.allowedProductIdSet(viewerCompanyId, productIds);
    const products = new Map<string, number>();
    for (const id of productIds) {
      products.set(id, allowedProducts.has(id) ? 1 : 0);
    }
    return { collections, products };
  }

  private toExplorePost(
    row: FeedRow,
    stamps: { collections: Map<string, string>; products: Map<string, string> },
    eligible: { collections: Map<string, number>; products: Map<string, number> },
    viewerCompanyId: string,
    sourceHopRows: Map<string, SourceCreditHopRow> = new Map(),
    resolvedBands: Map<string, { rateMin: number | null; rateMax: number | null }> = new Map(),
  ): ExplorePost {
    if (row.kind === 'collection' && row.collection) {
      return {
        kind: 'collection',
        id: row.feedId,
        postedAt: row.postedAt.toISOString(),
        collection: this.discovery.toCollectionCard(row.collection, {
          viewerReposted: stamps.collections.has(row.collection.id),
          viewerRepostCollectionId: stamps.collections.get(row.collection.id) ?? null,
          viewerCompanyId,
          repostEligibleCount: eligible.collections.get(row.collection.id) ?? 0,
          sourceHops: sourceHopsFromRows(
            (row.collection as { repostSourceCollectionId?: string | null })
              .repostSourceCollectionId,
            sourceHopRows,
          ),
          hopRows: sourceHopRows,
          resolvedBand: resolvedBands.get(row.collection.id) ?? null,
        }),
      };
    }
    if (row.kind === 'product' && row.product) {
      return {
        kind: 'product',
        id: row.feedId,
        postedAt: row.postedAt.toISOString(),
        product: this.discovery.toExploreProductCard(row.product, {
          viewerReposted: stamps.products.has(row.product.id),
          viewerRepostCollectionId: stamps.products.get(row.product.id) ?? null,
          repostEligibleCount: eligible.products.get(row.product.id) ?? 0,
        }),
      };
    }
    throw new Error('Invalid feed row');
  }

  private async resolveViewerRankContext(
    viewerCompanyId: string,
    query: ExploreQuery,
  ): Promise<{ interest: ResolvedInterest; city: string | null }> {
    const viewer = await this.prisma.company.findUnique({
      where: { id: viewerCompanyId },
      select: {
        buyCategories: true,
        superCategories: true,
        masterCategories: true,
        city: true,
      },
    });
    const city = viewer?.city?.trim() || null;
    const { categories } = narrowLists(query);
    const fromNarrow = interestFromNarrowCategories(categories);
    if (fromNarrow) {
      return { city, interest: fromNarrow };
    }
    return { interest: resolveInterestFromCompany(viewer ?? {}), city };
  }

  private companyFilter(viewerCompanyId: string, query: ExploreQuery): Prisma.CompanyWhereInput {
    const filter: Prisma.CompanyWhereInput = {
      AND: [
        companyNotBlockedWith(viewerCompanyId),
        discoverableProfileWhere(viewerCompanyId),
      ],
    };
    const { categories, cities } = narrowLists(query);
    Object.assign(filter, cityEqualsWhere(cities), categoryHasSomeWhere(categories, 'sellCategories'));
    if (query.following) {
      filter.followers = { some: { followerCompanyId: viewerCompanyId } };
    }
    return filter;
  }
}
