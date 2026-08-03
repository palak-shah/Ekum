import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CollectionStatus,
  ConnectionStatus,
  PublishAudience,
  RateVisibility,
  type CollectionCard,
  type CollectionPreviewView,
  type CompanyCard,
  type CursorPage,
  type ExploreQuery,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { VisibilityService } from '../access/visibility.service';
import { CatalogSerializer } from '../catalog/catalog.serializer';
import { DiscoverySerializer } from './discovery.serializer';
import { collectionCardInclude } from './collection-preview';
import { cursorArgs, toCursorPage } from './pagination';

@Injectable()
export class ExploreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly catalog: CatalogSerializer,
    private readonly discovery: DiscoverySerializer,
  ) {}

  /**
   * Market feed: published collections from others. Default order is followed
   * sellers first (by recency), then the rest of the market (by recency) —
   * never engagement ranking. `following=true` keeps the Home "Followed" slice.
   */
  async collections(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<CollectionCard>> {
    const baseWhere: Prisma.CollectionWhereInput = {
      status: CollectionStatus.Published,
      companyId: { not: viewerCompanyId },
      company: this.companyFilter(viewerCompanyId, query),
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
        : Promise.resolve([]),
      this.prisma.collection.findMany({
        where: {
          ...baseWhere,
          ...(followedIds.length > 0 ? { companyId: { notIn: [...followedIds, viewerCompanyId] } } : {}),
        },
        include: collectionCardInclude,
        orderBy,
      }),
    ]);

    const merged = [...followedRows, ...otherRows];
    let start = 0;
    if (query.cursor) {
      const index = merged.findIndex((row) => row.id === query.cursor);
      start = index >= 0 ? index + 1 : 0;
    }
    const page = merged.slice(start, start + query.limit + 1);
    return toCursorPage(page, query.limit, (row) => this.discovery.toCollectionCard(row));
  }

  async companies(viewerCompanyId: string, query: ExploreQuery): Promise<CursorPage<CompanyCard>> {
    const where: Prisma.CompanyWhereInput = {
      id: { not: viewerCompanyId },
      // Only selling businesses appear in the company browse.
      sellCategories: query.category ? { has: query.category } : { isEmpty: false },
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
    }

    const connected =
      isOwner || (await this.visibility.canViewCatalog(viewerCompanyId, collection.companyId));
    const openToEveryone = collection.audience === PublishAudience.Everyone;
    const showProducts = isOwner || connected || openToEveryone;

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
      filter.sellCategories = { has: query.category };
    }
    if (query.following) {
      filter.followers = { some: { followerCompanyId: viewerCompanyId } };
    }
    return filter;
  }
}
