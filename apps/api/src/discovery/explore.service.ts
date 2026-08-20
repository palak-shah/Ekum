import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CollectionStatus,
  ConnectionStatus,
  MessageType,
  ProductStatus,
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
import { VisibilityService } from '../access/visibility.service';
import { CatalogSerializer } from '../catalog/catalog.serializer';
import { DiscoverySerializer } from './discovery.serializer';
import {
  canDiscoverCollection,
  canViewCollectionProducts,
} from '../catalog/audience-visibility';
import {
  isCollectionLiveForBuyers,
  liveWindowClauses,
} from '../catalog/collection-schedule';
import { collectionCardInclude } from './collection-preview';
import { cursorArgs, toCursorPage } from './pagination';
import {
  matchesCompanyInterest,
  resolveInterestFromCompany,
  resolveSuperCategoryId,
  type ResolvedInterest,
} from './interest-match';
import { audienceVisibilityOr, curatedSourceExcludeAnd } from '../catalog/audience-visibility';
import { compareByMarketRelevance } from './feed-rank';

/** Posts visible to this viewer by publish audience (everyone/connections/followers/selected). */
function audienceVisibility(viewerCompanyId: string): { OR: object[] } {
  return { OR: audienceVisibilityOr(viewerCompanyId) };
}

/** Audience + curated source auto-exclude for collection rows. */
function collectionAudienceVisibility(viewerCompanyId: string): object {
  return {
    AND: [audienceVisibility(viewerCompanyId), curatedSourceExcludeAnd(viewerCompanyId)],
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
};

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
  ) {}

  /**
   * Sectioned Explore home: opportunity shelves first (no buy/sell mode).
   * Optional category/city Narrow filters apply across sections.
   */
  async home(viewerCompanyId: string, query: ExploreHomeQuery = {}): Promise<ExploreHomeView> {
    const sectionLimit = 8;
    const base: ExploreQuery = {
      limit: sectionLimit,
      ...(query.category ? { category: query.category } : {}),
      ...(query.city ? { city: query.city } : {}),
    };

    const viewer = await this.prisma.company.findUnique({
      where: { id: viewerCompanyId },
      select: {
        sellCategories: true,
        buyCategories: true,
        superCategories: true,
        city: true,
      },
    });
    const sells = (viewer?.sellCategories ?? []).some((tag) => tag.trim().length > 0);
    const interest = query.category
      ? {
          tags: [query.category],
          supers: resolveSuperCategoryId(query.category)
            ? [resolveSuperCategoryId(query.category)!]
            : [],
          preferFine: !resolveSuperCategoryId(query.category),
        }
      : resolveInterestFromCompany(viewer ?? {});

    const [
      networkPage,
      forYouPage,
      networkDesigns,
      forYouDesignsRaw,
      suggestedPage,
      buyersPage,
      connectedRows,
      followedRows,
    ] = await Promise.all([
      this.collections(viewerCompanyId, { ...base, following: true }),
      this.collections(viewerCompanyId, base),
      this.designs(viewerCompanyId, { ...base, following: true, limit: 8 }),
      this.designs(viewerCompanyId, { ...base, limit: 12 }),
      this.companies(viewerCompanyId, { ...base, scope: 'buy' }),
      sells
        ? this.companies(viewerCompanyId, { ...base, scope: 'sell' })
        : Promise.resolve({ results: [] as CompanyCard[], nextCursor: null }),
      this.prisma.connection.findMany({
        where: {
          viewerCompanyId,
          status: ConnectionStatus.Active,
        },
        select: { ownerCompanyId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerCompanyId: viewerCompanyId },
        select: { followedCompanyId: true },
      }),
    ]);

    const connectedIds = new Set(connectedRows.map((row) => row.ownerCompanyId));
    const followedIds = new Set(followedRows.map((row) => row.followedCompanyId));
    const networkIds = new Set(networkPage.results.map((row) => row.id));
    const networkDesignIds = new Set(networkDesigns.results.map((row) => row.id));
    const opportunityCollections = [
      ...networkPage.results,
      ...forYouPage.results.filter((collection) => !networkIds.has(collection.id)),
    ];
    const opportunityDesigns = [
      ...networkDesigns.results,
      ...forYouDesignsRaw.results.filter((product) => !networkDesignIds.has(product.id)),
    ];
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
            select: { id: true, sellCategories: true, superCategories: true },
          })
        : [];
    const tradeById = new Map(tradeRows.map((row) => [row.id, row]));

    const fromNetwork = networkPage.results.map((collection) =>
      this.toOpportunity(collection, interest, connectedIds, followedIds, tradeById.get(collection.company.id)),
    );
    const forYou = forYouPage.results
      .filter((collection) => !networkIds.has(collection.id))
      .map((collection) =>
        this.toOpportunity(
          collection,
          interest,
          connectedIds,
          followedIds,
          tradeById.get(collection.company.id),
        ),
      );

    const designsFromNetwork = networkDesigns.results.map((product) =>
      this.toDesignOpportunity(
        product,
        interest,
        connectedIds,
        followedIds,
        tradeById.get(product.company.id),
      ),
    );
    const designsForYou = forYouDesignsRaw.results
      .filter((product) => !networkDesignIds.has(product.id))
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
    const shopPreviews = await this.shopPreviewsForCompanies(viewerCompanyId, businessIds);

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

    const stories = this.buildStories({
      fromNetwork,
      forYou,
      designsFromNetwork,
      designsForYou,
      suggestedBusinesses,
      lookingForWhatYouSell,
    });

    return {
      forYou,
      fromNetwork,
      designsForYou,
      designsFromNetwork,
      suggestedBusinesses,
      lookingForWhatYouSell,
      stories,
    };
  }

  /** Rank companies by newest visible post for the Stories rail. */
  private buildStories(input: {
    fromNetwork: ExploreHomeView['fromNetwork'];
    forYou: ExploreHomeView['forYou'];
    designsFromNetwork: ExploreHomeView['designsFromNetwork'];
    designsForYou: ExploreHomeView['designsForYou'];
    suggestedBusinesses: ExploreHomeView['suggestedBusinesses'];
    lookingForWhatYouSell: ExploreHomeView['lookingForWhatYouSell'];
  }): ExploreStory[] {
    const latest = new Map<string, ExploreStory>();
    const touch = (company: ExploreStory['company'], at: string | null | undefined) => {
      if (!company?.id || !at) return;
      const prev = latest.get(company.id);
      if (!prev || prev.latestPostedAt < at) {
        latest.set(company.id, { company, latestPostedAt: at });
      }
    };

    for (const row of [...input.fromNetwork, ...input.forYou]) {
      touch(row.collection.company, row.collection.updatedAt);
    }
    for (const row of [...input.designsFromNetwork, ...input.designsForYou]) {
      touch(row.product.company, row.product.postedAt);
    }
    for (const row of [
      ...input.suggestedBusinesses,
      ...(input.lookingForWhatYouSell ?? []),
    ]) {
      touch(row.company, row.latestPostedAt);
    }

    return [...latest.values()]
      .sort((a, b) => (a.latestPostedAt < b.latestPostedAt ? 1 : -1))
      .slice(0, 16);
  }

  /** Published designs on Explore (posted to market), excluding the viewer. */
  async designs(
    viewerCompanyId: string,
    query: ExploreQuery,
  ): Promise<CursorPage<ExploreProductCard>> {
    const baseWhere: Prisma.ProductWhereInput = {
      status: ProductStatus.Published,
      postedToMarketAt: { not: null },
      companyId: { not: viewerCompanyId },
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
      return toCursorPage(rows, query.limit, (row) => this.discovery.toExploreProductCard(row));
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId },
      select: { followedCompanyId: true },
    });
    const followedIds = followed.map((row) => row.followedCompanyId);

    if (followedIds.length === 0) {
      const rows = await this.prisma.product.findMany({
        where: baseWhere,
        include: { company: true },
        ...args,
      });
      return toCursorPage(rows, query.limit, (row) => this.discovery.toExploreProductCard(row));
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
          companyId: { notIn: [...followedIds, viewerCompanyId] },
        },
        include: { company: true },
        orderBy,
        take: query.limit + 1,
      }),
    ]);
    const merged = [...followedRows, ...otherRows];
    const page = pageMerged(merged, query, (row) => row.id);
    return toCursorPage(page, query.limit, (row) => this.discovery.toExploreProductCard(row));
  }

  /**
   * Mixed market feed: published collections and products posted to market.
   * All chip + interests: followed → interest-matched public → rest.
   * Chip hard-filters then followed → public. `following=true` is followed-only.
   */
  async feed(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<ExplorePost>> {
    const companyFilter = this.companyFilter(viewerCompanyId, query);
    const collectionWhere: Prisma.CollectionWhereInput = {
      status: CollectionStatus.Published,
      companyId: { not: viewerCompanyId },
      company: companyFilter,
      AND: [collectionAudienceVisibility(viewerCompanyId), ...liveWindowClauses()],
    };
    const productWhere: Prisma.ProductWhereInput = {
      status: ProductStatus.Published,
      postedToMarketAt: { not: null },
      companyId: { not: viewerCompanyId },
      company: companyFilter,
      AND: [audienceVisibility(viewerCompanyId)],
    };

    if (query.following) {
      const [collections, products] = await Promise.all([
        this.prisma.collection.findMany({
          where: collectionWhere,
          include: collectionCardInclude,
          orderBy: [{ exploreActivityAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        }),
        this.prisma.product.findMany({
          where: productWhere,
          include: { company: true },
          orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
        }),
      ]);
      const merged = [
        ...collections.map((row) => this.toCollectionFeedRow(row)),
        ...products.map((row) => this.toProductFeedRow(row)),
      ].sort(byPostedAtDesc);
      const page = pageMerged(merged, query, (row) => row.feedId);
      return toCursorPage(
        page,
        query.limit,
        (row) => this.toExplorePost(row),
        (row) => row.feedId,
      );
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId },
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
            })
          : Promise.resolve([] as CollectionCardRow[]),
        this.prisma.collection.findMany({
          where: {
            ...collectionWhere,
            ...(followedIds.length > 0
              ? { companyId: { notIn: [...followedIds, viewerCompanyId] } }
              : {}),
          },
          include: collectionCardInclude,
          orderBy: [{ exploreActivityAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        }),
        followedIds.length > 0
          ? this.prisma.product.findMany({
              where: { ...productWhere, companyId: { in: followedIds } },
              include: { company: true },
              orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
            })
          : Promise.resolve([] as ProductFeedRow[]),
        this.prisma.product.findMany({
          where: {
            ...productWhere,
            ...(followedIds.length > 0
              ? { companyId: { notIn: [...followedIds, viewerCompanyId] } }
              : {}),
          },
          include: { company: true },
          orderBy: [{ postedToMarketAt: 'desc' }, { id: 'desc' }],
        }),
      ]);

    const followedRows = [
      ...followedCollections.map((row) => this.toCollectionFeedRow(row)),
      ...followedProducts.map((row) => this.toProductFeedRow(row)),
    ].sort(byPostedAtDesc);
    const otherRows = [
      ...otherCollections.map((row) => this.toCollectionFeedRow(row)),
      ...otherProducts.map((row) => this.toProductFeedRow(row)),
    ].sort(byPostedAtDesc);

    const { interest, city } = await this.resolveViewerRankContext(viewerCompanyId, query);
    const softRank = interest.tags.length > 0 && !query.category;
    const merged = softRank
      ? this.mergeFollowThenInterest(followedRows, otherRows, interest, city)
      : [
          ...followedRows,
          ...[...otherRows].sort((a, b) => compareByMarketRelevance(a, b, interest, city)),
        ];

    const page = pageMerged(merged, query, (row) => row.feedId);
    return toCursorPage(
      page,
      query.limit,
      (row) => this.toExplorePost(row),
      (row) => row.feedId,
    );
  }

  /** Collections-only browse (same ranking rules as feed, without product posts). */
  async collections(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<CollectionCard>> {
    const baseWhere: Prisma.CollectionWhereInput = {
      status: CollectionStatus.Published,
      companyId: { not: viewerCompanyId },
      company: this.companyFilter(viewerCompanyId, query),
      AND: [collectionAudienceVisibility(viewerCompanyId), ...liveWindowClauses()],
    };

    if (query.following) {
      const rows = await this.prisma.collection.findMany({
        where: baseWhere,
        include: collectionCardInclude,
        orderBy: [
          { exploreActivityAt: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      });
      return toCursorPage(rows, query.limit, (row) => this.discovery.toCollectionCard(row));
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId },
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
          })
        : Promise.resolve([] as CollectionCardRow[]),
      this.prisma.collection.findMany({
        where: {
          ...baseWhere,
          ...(followedIds.length > 0
            ? { companyId: { notIn: [...followedIds, viewerCompanyId] } }
            : {}),
        },
        include: collectionCardInclude,
        orderBy,
      }),
    ]);

    const { interest, city } = await this.resolveViewerRankContext(viewerCompanyId, query);
    const softRank = interest.tags.length > 0 && !query.category;
    const followedFeed = followedRows.map((row) => this.toCollectionFeedRow(row));
    const otherFeed = otherRows.map((row) => this.toCollectionFeedRow(row));
    const mergedFeed = softRank
      ? this.mergeFollowThenInterest(followedFeed, otherFeed, interest, city)
      : [
          ...followedFeed,
          ...[...otherFeed].sort((a, b) => compareByMarketRelevance(a, b, interest, city)),
        ];
    const page = pageMerged(mergedFeed, query, (row) => row.collection!.id);
    return toCursorPage(
      page,
      query.limit,
      (row) => this.discovery.toCollectionCard(row.collection!),
      (row) => row.collection!.id,
    );
  }

  async companies(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<CompanyCard>> {
    const lookingForBuyers = query.scope === 'sell';
    const where: Prisma.CompanyWhereInput = {
      id: { not: viewerCompanyId },
      // Buy scope → suppliers; sell scope → businesses that buy (retailers).
      ...(lookingForBuyers
        ? {
            buyCategories: query.category ? { has: query.category } : { isEmpty: false },
          }
        : {
            sellCategories: query.category ? { has: query.category } : { isEmpty: false },
          }),
      connectionsAsOwner: {
        none: { viewerCompanyId, status: ConnectionStatus.Blocked },
      },
    };
    if (query.city) {
      where.city = query.city;
    }
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
      connectionsAsOwner: {
        none: { viewerCompanyId, status: ConnectionStatus.Blocked },
      },
      AND: [postedContent],
      ...(lookingForBuyers
        ? {
            buyCategories: query.category ? { has: query.category } : { isEmpty: false },
          }
        : query.category
          ? (() => {
              const superId = resolveSuperCategoryId(query.category);
              return superId
                ? {
                    OR: [
                      { superCategories: { has: superId } },
                      { sellCategories: { has: query.category } },
                    ],
                  }
                : { sellCategories: { has: query.category } };
            })()
          : {}),
    };
    if (query.city) {
      where.city = query.city;
    }
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
        where: { followerCompanyId: viewerCompanyId },
        select: { followedCompanyId: true },
      }),
      this.prisma.connection.findMany({
        where: { viewerCompanyId, status: ConnectionStatus.Active },
        select: { ownerCompanyId: true },
      }),
      this.resolveViewerRankContext(viewerCompanyId, query),
    ]);
    const followedIds = followed.map((row) => row.followedCompanyId);
    const connectedIds = new Set(connectedRows.map((row) => row.ownerCompanyId));
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
    const collection = await this.prisma.collection.findUnique({
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
      })) != null;
    const audienceCtx = { connected, following };
    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, collection.companyId)) {
        throw notFound();
      }
      if (!isCollectionLiveForBuyers(collection)) {
        throw notFound();
      }
      if (!canDiscoverCollection(viewerCompanyId, collection, audienceCtx)) {
        throw notFound();
      }
    }

    const showProducts = canViewCollectionProducts(
      viewerCompanyId,
      collection,
      audienceCtx,
    );

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

      products = collection.products.map((entry) => {
        const view = this.catalog.toProductView(entry.product);
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

    return {
      ...this.discovery.toCollectionCard(collection),
      connected,
      products,
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
      })) != null;
    const audienceCtx = { connected, following };
    const onMarket =
      Boolean(product.postedToMarketAt) &&
      canDiscoverCollection(viewerCompanyId, product, audienceCtx);
    const sharedInChat =
      !isOwner &&
      (await this.wasSharedInChat(viewerCompanyId, id, MessageType.ProductCard));

    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, product.companyId)) {
        throw notFound();
      }
      if (product.status !== ProductStatus.Published) {
        throw notFound();
      }
      // Market post, active connection, or an intentional chat share all unlock a view.
      if (!connected && !onMarket && !sharedInChat) {
        throw notFound();
      }
    }

    const showBody =
      isOwner ||
      sharedInChat ||
      canViewCollectionProducts(viewerCompanyId, product, audienceCtx);
    const card = this.discovery.toExploreProductCard(product);
    const extras = {
      connected,
      description: product.description,
      moq: product.moq ?? null,
      categories: product.categories,
    };
    if (!showBody) {
      return { ...card, ...extras, rate: null, visible: false };
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
            AND: liveWindowClauses(),
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
          parts.push(`Matches ${hit}`);
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
          parts.push(`Matches ${hit}`);
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
      if (sell) parts.push(`Sells ${sell}`);
    } else {
      const match = viewerSell.find((tag) => company.buyCategories.includes(tag));
      if (match) {
        parts.push(`May want your ${match}`);
      } else {
        const buy = company.buyCategories.filter(Boolean)[0];
        // Avoid “May want… · Buys…” double phrasing — one clear clause.
        parts.push(buy ? `Buys ${buy}` : 'May want what you sell');
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

  private toExplorePost(row: FeedRow): ExplorePost {
    if (row.kind === 'collection' && row.collection) {
      return {
        kind: 'collection',
        id: row.feedId,
        postedAt: row.postedAt.toISOString(),
        collection: this.discovery.toCollectionCard(row.collection),
      };
    }
    if (row.kind === 'product' && row.product) {
      return {
        kind: 'product',
        id: row.feedId,
        postedAt: row.postedAt.toISOString(),
        product: this.discovery.toExploreProductCard(row.product),
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
      select: { buyCategories: true, superCategories: true, city: true },
    });
    const city = viewer?.city?.trim() || null;
    if (query.category) {
      const superId = resolveSuperCategoryId(query.category);
      return {
        city,
        interest: {
          tags: [query.category],
          supers: superId ? [superId] : [],
          preferFine: !superId,
        },
      };
    }
    return { interest: resolveInterestFromCompany(viewer ?? {}), city };
  }

  private companyFilter(viewerCompanyId: string, query: ExploreQuery): Prisma.CompanyWhereInput {
    const filter: Prisma.CompanyWhereInput = {
      connectionsAsOwner: {
        none: { viewerCompanyId, status: ConnectionStatus.Blocked },
      },
    };
    if (query.city) {
      filter.city = query.city;
    }
    if (query.category) {
      const superId = resolveSuperCategoryId(query.category);
      if (superId) {
        filter.OR = [
          { superCategories: { has: superId } },
          { sellCategories: { has: query.category } },
        ];
      } else {
        filter.sellCategories = { has: query.category };
      }
    }
    if (query.following) {
      filter.followers = { some: { followerCompanyId: viewerCompanyId } };
    }
    return filter;
  }
}
