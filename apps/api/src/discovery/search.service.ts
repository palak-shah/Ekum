import { Injectable } from '@nestjs/common';
import {
  CollectionStatus,
  ProductStatus,
  type CollectionCard,
  type CompanyCard,
  type CursorPage,
  type DiscoveryProductCard,
  type SearchQuery,
  type UniversalSearchResults,
} from '@ekum/domain-types';
import { Prisma } from '@prisma/client';
import { companyNotBlockedWith } from '../access/connection-pair';
import { audienceVisibilityOr } from '../catalog/audience-visibility';
import { PrismaService } from '../core/prisma/prisma.service';
import { idsMatchingCategoryLabel } from './categories-match';
import {
  DiscoverySerializer,
  sourceHopsFromRows,
} from './discovery.serializer';
import type { SourceCreditHopRow } from './source-shop-credit';
import { discoverableProfileWhere } from './follow-access';
import { collectionCardInclude } from './collection-preview';
import { cursorArgs, toCursorPage } from './pagination';

type SearchResults =
  | CursorPage<CompanyCard>
  | CursorPage<CollectionCard>
  | CursorPage<DiscoveryProductCard>
  | UniversalSearchResults;

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoverySerializer,
  ) {}

  search(viewerCompanyId: string, query: SearchQuery): Promise<SearchResults> {
    if (!query.type) {
      return this.universal(viewerCompanyId, query);
    }
    switch (query.type) {
      case 'company':
        return this.companies(viewerCompanyId, query);
      case 'collection':
        return this.collections(viewerCompanyId, query);
      case 'design':
        return this.designs(viewerCompanyId, query);
    }
  }

  private async universal(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<UniversalSearchResults> {
    const limit = Math.min(query.limit, 8);
    const pageQuery = { ...query, limit };
    const [companies, collections, designs, cityRows, categorySeed] = await Promise.all([
      this.companies(viewerCompanyId, pageQuery),
      this.collections(viewerCompanyId, pageQuery),
      this.designs(viewerCompanyId, pageQuery),
      this.prisma.company.findMany({
        where: {
          id: { not: viewerCompanyId },
          city: { contains: query.q, mode: 'insensitive' },
          ...companyNotBlockedWith(viewerCompanyId),
        },
        select: { city: true },
        distinct: ['city'],
        take: 6,
      }),
      this.prisma.company.findMany({
        where: {
          id: { not: viewerCompanyId },
          ...companyNotBlockedWith(viewerCompanyId),
          OR: [
            { sellCategories: { hasSome: [query.q] } },
            { buyCategories: { hasSome: [query.q] } },
          ],
        },
        select: { sellCategories: true, buyCategories: true },
        take: 40,
      }),
    ]);

    const needle = query.q.toLowerCase();
    const categories = [
      ...new Set(
        categorySeed
          .flatMap((row) => [...row.sellCategories, ...row.buyCategories])
          .filter((tag) => tag.toLowerCase().includes(needle)),
      ),
    ].slice(0, 8);

    return {
      companies: companies.results,
      collections: collections.results,
      designs: designs.results,
      cities: cityRows.map((row) => row.city),
      categories,
    };
  }

  private async companies(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<CursorPage<CompanyCard>> {
    const q = query.q.trim();
    const phoneDigits = q.replace(/\D/g, '');
    const or: Prisma.CompanyWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { gstNumber: { contains: q, mode: 'insensitive' } },
      {
        memberships: {
          some: {
            user: { name: { contains: q, mode: 'insensitive' } },
          },
        },
      },
    ];
    if (phoneDigits.length >= 7) {
      or.push({
        memberships: {
          some: {
            OR: [
              { user: { phone: { contains: phoneDigits } } },
              { showPhone: true, displayPhone: { contains: phoneDigits } },
            ],
          },
        },
      });
    }

    const rows = await this.prisma.company.findMany({
      where: {
        id: { not: viewerCompanyId },
        OR: or,
        AND: [
          companyNotBlockedWith(viewerCompanyId),
          discoverableProfileWhere(viewerCompanyId),
        ],
      },
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toCompanyCard(row));
  }

  private async collections(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<CursorPage<CollectionCard>> {
    const categoryIds = await idsMatchingCategoryLabel(this.prisma, 'Collection', query.q);
    const or: Prisma.CollectionWhereInput[] = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { company: { name: { contains: query.q, mode: 'insensitive' } } },
      { company: { city: { contains: query.q, mode: 'insensitive' } } },
    ];
    if (categoryIds.length > 0) {
      or.push({ id: { in: categoryIds } });
    }

    const rows = await this.prisma.collection.findMany({
      where: {
        status: CollectionStatus.Published,
        kind: { not: 'general' },
        companyId: { not: viewerCompanyId },
        OR: or,
        company: { ...companyNotBlockedWith(viewerCompanyId) },
        AND: [
          { OR: audienceVisibilityOr(viewerCompanyId) },
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          { products: { some: { product: { status: ProductStatus.Published } } } },
        ],
      },
      include: collectionCardInclude,
      ...cursorArgs(query),
    });
    const sourceHopRows = await this.loadSourceCreditHopRows(
      rows.map(
        (row) =>
          (row as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
      ),
    );
    return toCursorPage(rows, query.limit, (row) =>
      this.discovery.toCollectionCard(row, {
        viewerCompanyId,
        sourceHops: sourceHopsFromRows(
          (row as { repostSourceCollectionId?: string | null }).repostSourceCollectionId,
          sourceHopRows,
        ),
      }),
    );
  }

  private async loadSourceCreditHopRows(
    sourceIds: Array<string | null | undefined>,
  ): Promise<Map<string, SourceCreditHopRow>> {
    const byId = new Map<string, SourceCreditHopRow>();
    let pending = [
      ...new Set(sourceIds.filter((id): id is string => Boolean(id))),
    ];
    for (let depth = 0; depth < 4 && pending.length > 0; depth += 1) {
      const hopRows = await this.prisma.collection.findMany({
        where: { id: { in: pending } },
        select: {
          id: true,
          companyId: true,
          showSourceShops: true,
          repostSourceCollectionId: true,
          company: { select: { name: true } },
        },
      });
      const next: string[] = [];
      for (const row of hopRows) {
        byId.set(row.id, {
          companyId: row.companyId,
          companyName: row.company.name,
          showSourceShops: row.showSourceShops === true,
          repostSourceCollectionId: row.repostSourceCollectionId,
        });
        if (
          row.repostSourceCollectionId &&
          !byId.has(row.repostSourceCollectionId)
        ) {
          next.push(row.repostSourceCollectionId);
        }
      }
      pending = next;
    }
    return byId;
  }

  private async designs(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<CursorPage<DiscoveryProductCard>> {
    const categoryIds = await idsMatchingCategoryLabel(this.prisma, 'Product', query.q);
    const or: Prisma.ProductWhereInput[] = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { company: { name: { contains: query.q, mode: 'insensitive' } } },
    ];
    if (categoryIds.length > 0) {
      or.push({ id: { in: categoryIds } });
    }

    const rows = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.Published,
        postedToMarketAt: { not: null },
        companyId: { not: viewerCompanyId },
        OR: or,
        company: { ...companyNotBlockedWith(viewerCompanyId) },
        AND: [{ OR: audienceVisibilityOr(viewerCompanyId) }],
      },
      include: { company: true },
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toProductCard(row));
  }
}
