import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CollectionStatus,
  MessageType,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  VerificationStatus,
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
import { CatalogSerializer } from '../catalog/catalog.serializer';
import { CollectionService } from '../catalog/collection.service';
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
import { collectionSourceShopNames, DiscoverySerializer } from './discovery.serializer';
import {
  canDiscoverCollection,
  canViewCollectionProducts,
} from '../catalog/audience-visibility';
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
  interestHitLabel,
  matchesCompanyInterest,
  resolveInterestFromCompany,
  type ResolvedInterest,
} from './interest-match';
import { audienceVisibilityOr, curatedSourceExcludeAnd } from '../catalog/audience-visibility';
import { productAccessibleViaCollection } from '../catalog/product-viewer-access';
import { compareByMarketRelevance } from './feed-rank';
import { viewerPackTicket } from '../orders/viewer-pack-ticket';
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
    const eligible = await this.eligibleCountByCollection(viewerCompanyId, live);
    const stamps = await this.viewerRepostStamps(viewerCompanyId, {
      collectionIds: live.map((row) => row.id),
      productIds: [],
    });
    return live.map((row) => {
      const card = this.discovery.toCollectionCard(row, {
        viewerCompanyId,
        viewerReposted: stamps.collections.has(row.id),
        repostEligibleCount: eligible.get(row.id) ?? 0,
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
      const merged = await this.hideDesignsCoveredByPacks(
        diversifyNewestThenFill(
          [
            ...withLiveDesigns(collections).map((row) => this.toCollectionFeedRow(row)),
            ...products.map((row) => this.toProductFeedRow(row)),
          ].sort(byPostedAtDesc),
          (row) => row.company.id,
          windowTake,
        ),
      );
      const page = pageMerged(merged, query, (row) => row.feedId);
      const stamps = await this.viewerRepostStampsForFeed(viewerCompanyId, page);
      const eligible = await this.eligibleForFeedRows(viewerCompanyId, page);
      return toCursorPage(
        page,
        query.limit,
        (row) => this.toExplorePost(row, stamps, eligible, viewerCompanyId),
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

    const page = pageMerged(await this.hideDesignsCoveredByPacks(merged), query, (row) => row.feedId);
    const stamps = await this.viewerRepostStampsForFeed(viewerCompanyId, page);
    const eligible = await this.eligibleForFeedRows(viewerCompanyId, page);
    return toCursorPage(
      page,
      query.limit,
      (row) => this.toExplorePost(row, stamps, eligible, viewerCompanyId),
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

    const merged = await this.hideDesignsCoveredByPacks(
      [
        ...withLiveDesigns(collections).map((row) => this.toCollectionFeedRow(row)),
        ...products.map((row) => this.toProductFeedRow(row)),
      ].sort(byPostedAtDesc),
    );
    const page = merged.slice(0, take);
    const stamps = await this.viewerRepostStampsForFeed(viewerCompanyId, page);
    const eligible = await this.eligibleForFeedRows(viewerCompanyId, page);
    return toCursorPage(
      page,
      query.limit,
      (row) => this.toExplorePost(row, stamps, eligible, viewerCompanyId),
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
      ...companyNotBlockedWith(viewerCompanyId),
      ...cityEqualsWhere(cities),
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
      AND: [postedContent, companyNotBlockedWith(viewerCompanyId)],
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
        previewImages: previewImages.slice(0, 4),
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
        _count: { select: { products: true } },
        products: { orderBy: { position: 'asc' }, include: { product: true } },
      },
    });

    const notFound = () =>
      new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    if (!collection) {
      throw notFound();
    }

    const isOwner = collection.companyId === viewerCompanyId;
    if (isOwner && isGeneralKind((collection as { kind?: string }).kind)) {
      const members = await this.prisma.product.findMany({
        where: generalMemberProductWhere(viewerCompanyId),
        orderBy: { createdAt: 'desc' },
      });
      const collectionId = collection.id;
      collection = {
        ...collection,
        products: generalMemberJoinRows(collectionId, members),
        _count: { ...collection._count, products: members.length },
      };
    }
    collection = {
      ...collection,
      products: presentCollectionProducts(collection.products),
    };
    const connected =
      isOwner || (await this.visibility.canViewCatalog(viewerCompanyId, collection.companyId));
    const following =
      isOwner ||
      (await this.prisma.follow.findUnique({
        where: {
          followerCompanyId_followedCompanyId: {
            followerCompanyId: viewerCompanyId,
            followedCompanyId: collection.companyId,
          },
        },
        select: { status: true },
      }))?.status === 'allowed';
    const audienceCtx = { connected, following };
    // Forward free: a chat share unlocks the album shell. Designs stay gated —
    // if audience is not enough, products is null and the UI shows Ask (owner).
    const sharedInChat =
      !isOwner &&
      (await this.wasSharedInChat(viewerCompanyId, id, MessageType.CollectionCard));
    const hasViewGrant =
      !isOwner &&
      (await this.prisma.collectionViewGrant.findUnique({
        where: {
          collectionId_companyId: { collectionId: id, companyId: viewerCompanyId },
        },
        select: { id: true },
      })) != null;
    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, collection.companyId)) {
        throw notFound();
      }
      if (!isCollectionLiveForBuyers(collection)) {
        throw notFound();
      }
      if (
        !sharedInChat &&
        !hasViewGrant &&
        !canDiscoverCollection(viewerCompanyId, collection, audienceCtx)
      ) {
        throw notFound();
      }
    }

    const showProducts =
      isOwner ||
      canViewCollectionProducts(viewerCompanyId, collection, audienceCtx, hasViewGrant);

    let products: ProductView[] | null = null;
    if (showProducts) {
      const foreignSourceIds = [
        ...new Set(
          collection.products
            .map((entry) => entry.product.companyId)
            .filter((sourceId) => sourceId !== collection.companyId),
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
        ...new Set(collection.products.map((entry) => entry.product.companyId)),
      ];
      const ownerRows = await this.prisma.company.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true },
      });
      const ownerName = new Map(ownerRows.map((row) => [row.id, row.name]));

      const packOwnerName = collection.company.name;
      const creditMills = collection.showSourceShops === true;
      products = collection.products
        .filter((entry) =>
          isOwner
            ? entry.product.status !== ProductStatus.Archived
            : entry.product.status === ProductStatus.Published,
        )
        .map((entry) => {
        const millName = ownerName.get(entry.product.companyId) ?? null;
        const isForeign = entry.product.companyId !== collection.companyId;
        // Buyers: mill credit only when the pack opts in; else pack shop name.
        const companyName =
          isOwner || creditMills || !isForeign
            ? millName
            : packOwnerName;
        const view = {
          ...this.catalog.toProductView(entry.product),
          companyName,
        };
        if (isOwner) {
          return view;
        }
        // Rates stay "on request" until connected when the collection says so.
        if (!connected && collection.rateVisibility === RateVisibility.OnRequest) {
          return { ...view, rate: null };
        }
        // Foreign members: apply the source product's rate ceiling for this viewer.
        const sourceId = entry.product.companyId;
        if (
          sourceId !== collection.companyId &&
          entry.product.rateVisibility === RateVisibility.OnRequest &&
          !connectedToSource.get(sourceId)
        ) {
          return { ...view, rate: null };
        }
        return view;
      });
    }

    const millCompanyIds = [
      ...new Set(
        collection.products
          .map((entry) => entry.product.companyId)
          .filter((sourceId) => sourceId !== collection.companyId),
      ),
    ];
    let viewerTicket: 'me' | 'mill' | null = null;
    let directMillCompanyIds: string[] = [];
    if (!isOwner && millCompanyIds.length > 0) {
      const lanes = await this.prisma.tradeLane.findMany({
        where: {
          traderCompanyId: collection.companyId,
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
      directMillCompanyIds = millCompanyIds.filter((millId) => {
        const lane = laneByMill.get(millId);
        return laneRoutesDirect({ ticket: lane?.ticket, behaviors: lane?.behaviors });
      });
    }

    const card = this.discovery.toCollectionCard(collection, { viewerCompanyId });
    const sourceShopNames =
      card.sourceShopNames.length > 0
        ? card.sourceShopNames
        : collectionSourceShopNames(
            collection.companyId,
            collection.showSourceShops === true,
            (products ?? []).map((row) => ({
              product: {
                companyId: row.companyId,
                company: { name: row.companyName?.trim() || '' },
              },
            })),
          );
    const generalAlbum = isGeneralKind((collection as { kind?: string }).kind);
    // Album facts: pack rate first; else min–max priced designs. Owner always
    // sees the band; on_request hides it from other users only.
    // General Collection is leftover storage — not a pack ₹ band.
    const albumRate = generalAlbum
      ? { rateMin: null, rateMax: null, rateUnit: null }
      : collectionCardRateFields({
          rateVisibility: collectionCardRateVisibility({
            rateVisibility: collection.rateVisibility,
            packCompanyId: collection.companyId,
            viewerCompanyId,
          }),
          rate: collection.rate,
          rateMax: collection.rateMax,
          catalogRateUnit: (collection as { catalogRateUnit?: string | null }).catalogRateUnit,
          products: collection.products,
        });
    const description = collection.description?.trim() || null;
    // Locked pack: name + shop for Ask — no cover/design thumbs (or chat open is pointless).
    if (!showProducts) {
      return {
        ...card,
        sourceShopNames,
        rateMin: albumRate.rateMin,
        rateMax: albumRate.rateMax,
        rateUnit: albumRate.rateUnit,
        description,
        coverImage: null,
        previewImages: [],
        imageCount: 0,
        connected,
        products: null,
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
      (await this.wasSharedInChat(viewerCompanyId, id, MessageType.ProductCard));

    let viaOpenCollection = false;
    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, product.companyId)) {
        throw notFound();
      }
      if (product.status !== ProductStatus.Published) {
        throw notFound();
      }
      // Market post, connection, chat share, or still visible in an openable album.
      if (!connected && !onMarket && !sharedInChat) {
        viaOpenCollection = await productAccessibleViaCollection(
          this.prisma,
          this.visibility,
          viewerCompanyId,
          id,
          { wasSharedInChat: (viewer, ref, type) => this.wasSharedInChat(viewer, ref, type) },
        );
        if (!viaOpenCollection) {
          throw notFound();
        }
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
    if (!isOwner && !connected && product.rateVisibility === RateVisibility.OnRequest) {
      return { ...card, ...extras, rate: null, visible: true };
    }
    return { ...card, ...extras, visible: true };
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
        previewImages: previewImages.slice(0, 4),
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
      where: { collectionId: { in: collectionIds } },
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
    const eligible = await this.eligibleCountByCollection(viewerCompanyId, rows);
    return toCursorPage(rows, limit, (row) =>
      this.discovery.toCollectionCard(row, {
        viewerReposted: stamps.collections.has(row.id),
        viewerCompanyId,
        repostEligibleCount: eligible.get(row.id) ?? 0,
      }),
    );
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
        repostEligibleCount: allowed.has(row.id) ? 1 : 0,
      }),
    );
  }

  private async viewerRepostStampsForFeed(
    viewerCompanyId: string,
    rows: FeedRow[],
  ): Promise<{ collections: Set<string>; products: Set<string> }> {
    return this.viewerRepostStamps(viewerCompanyId, {
      collectionIds: rows.flatMap((row) =>
        row.kind === 'collection' && row.collection ? [row.collection.id] : [],
      ),
      productIds: rows.flatMap((row) =>
        row.kind === 'product' && row.product ? [row.product.id] : [],
      ),
    });
  }

  private async viewerRepostStamps(
    viewerCompanyId: string,
    ids: { collectionIds: string[]; productIds: string[] },
  ): Promise<{ collections: Set<string>; products: Set<string> }> {
    const collectionIds = [...new Set(ids.collectionIds)];
    const productIds = [...new Set(ids.productIds)];
    if (collectionIds.length === 0 && productIds.length === 0) {
      return { collections: new Set(), products: new Set() };
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
        repostSourceCollectionId: true,
        repostSourceProductId: true,
        status: true,
        audience: true,
        repostOrigin: true,
      },
    });
    const collections = new Set<string>();
    const products = new Set<string>();
    for (const row of mine) {
      if (shouldReuseRepostChild(row)) continue;
      if (row.repostSourceCollectionId) collections.add(row.repostSourceCollectionId);
      if (row.repostSourceProductId) products.add(row.repostSourceProductId);
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
  ): Promise<Set<string>> {
    const unique = [...new Set(productIds.filter(Boolean))];
    if (unique.length === 0) return new Set();
    const check = await this.collectionService.checkCurateProducts(viewerCompanyId, unique);
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
    const allowed = await this.allowedProductIdSet(
      viewerCompanyId,
      rows.flatMap((row) => this.membersForCollection(row, queried)),
    );
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(
        row.id,
        this.membersForCollection(row, queried).filter((id) => allowed.has(id)).length,
      );
    }
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
    const allowed = await this.allowedProductIdSet(viewerCompanyId, [
      ...[...membersByCollection.values()].flat(),
      ...productIds,
    ]);
    const collections = new Map<string, number>();
    for (const [id, members] of membersByCollection) {
      collections.set(id, members.filter((memberId) => allowed.has(memberId)).length);
    }
    const products = new Map<string, number>();
    for (const id of productIds) {
      products.set(id, allowed.has(id) ? 1 : 0);
    }
    return { collections, products };
  }

  private toExplorePost(
    row: FeedRow,
    stamps: { collections: Set<string>; products: Set<string> },
    eligible: { collections: Map<string, number>; products: Map<string, number> },
    viewerCompanyId: string,
  ): ExplorePost {
    if (row.kind === 'collection' && row.collection) {
      return {
        kind: 'collection',
        id: row.feedId,
        postedAt: row.postedAt.toISOString(),
        collection: this.discovery.toCollectionCard(row.collection, {
          viewerReposted: stamps.collections.has(row.collection.id),
          viewerCompanyId,
          repostEligibleCount: eligible.collections.get(row.collection.id) ?? 0,
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
      ...companyNotBlockedWith(viewerCompanyId),
    };
    const { categories, cities } = narrowLists(query);
    Object.assign(filter, cityEqualsWhere(cities), categoryHasSomeWhere(categories, 'sellCategories'));
    if (query.following) {
      filter.followers = { some: { followerCompanyId: viewerCompanyId } };
    }
    return filter;
  }
}
