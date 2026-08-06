import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CollectionStatus,
  ConnectionStatus,
  MessageType,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  type CollectionCard,
  type CollectionPreviewView,
  type CompanyCard,
  type CursorPage,
  type ExplorePost,
  type ExploreProductPreviewView,
  type ExploreQuery,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { CatalogSerializer } from '../catalog/catalog.serializer';
import { DiscoverySerializer } from './discovery.serializer';
import {
  canDiscoverCollection,
  canViewCollectionProducts,
} from '../catalog/audience-visibility';
import { collectionCardInclude } from './collection-preview';
import { cursorArgs, toCursorPage } from './pagination';
import {
  matchesCompanyInterest,
  resolveInterestFromCompany,
  resolveSuperCategoryId,
  type ResolvedInterest,
} from './interest-match';
import { compareByMarketRelevance } from './feed-rank';

/** Hide `selected`-audience items from viewers who aren't on the list. */
function audienceVisibility(viewerCompanyId: string): {
  OR: Array<
    | { audience: { not: string } }
    | { audience: string; audienceCompanyIds: { has: string } }
  >;
} {
  return {
    OR: [
      { audience: { not: PublishAudience.Selected } },
      {
        audience: PublishAudience.Selected,
        audienceCompanyIds: { has: viewerCompanyId },
      },
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
      AND: [audienceVisibility(viewerCompanyId)],
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
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
      AND: [audienceVisibility(viewerCompanyId)],
    };

    if (query.following) {
      const rows = await this.prisma.collection.findMany({
        where: baseWhere,
        include: collectionCardInclude,
        ...cursorArgs(query),
      });
      return toCursorPage(rows, query.limit, (row) => this.discovery.toCollectionCard(row));
    }

    const followed = await this.prisma.follow.findMany({
      where: { followerCompanyId: viewerCompanyId },
      select: { followedCompanyId: true },
    });
    const followedIds = followed.map((row) => row.followedCompanyId);
    const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
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
   * Cross-company collection view. Non-connected viewers get a preview
   * (products null); only a connection unlocks the full product list. Draft,
   * blocked, and missing collections are all indistinguishable 404s.
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
    if (!isOwner) {
      if (await this.visibility.isBlocked(viewerCompanyId, collection.companyId)) {
        throw notFound();
      }
      if (collection.status !== CollectionStatus.Published) {
        throw notFound();
      }
      if (!canDiscoverCollection(viewerCompanyId, collection)) {
        throw notFound();
      }
    }

    const connected =
      isOwner || (await this.visibility.canViewCatalog(viewerCompanyId, collection.companyId));
    const showProducts = canViewCollectionProducts(viewerCompanyId, collection, connected);

    const products = showProducts
      ? collection.products.map((entry) => {
          const view = this.catalog.toProductView(entry.product);
          // Rates stay "on request" until connected when the collection says so.
          if (
            !isOwner &&
            !connected &&
            collection.rateVisibility === RateVisibility.OnRequest
          ) {
            return { ...view, rate: null };
          }
          return view;
        })
      : null;

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
    const onMarket =
      Boolean(product.postedToMarketAt) && canDiscoverCollection(viewerCompanyId, product);
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
      canViewCollectionProducts(viewerCompanyId, product, connected);
    const card = this.discovery.toExploreProductCard(product);
    const extras = {
      connected,
      description: product.description,
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

  private toCollectionFeedRow(row: CollectionCardRow): FeedRow {
    return {
      feedId: `c:${row.id}`,
      postedAt: row.createdAt,
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
