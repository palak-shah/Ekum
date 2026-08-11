import { Injectable } from '@nestjs/common';
import {
  CollectionStatus,
  ConnectionStatus,
  ProductStatus,
  type CollectionCard,
  type CompanyCard,
  type CursorPage,
  type DiscoveryProductCard,
  type SearchQuery,
  type UniversalSearchResults,
} from '@ekum/domain-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { DiscoverySerializer } from './discovery.serializer';
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
          connectionsAsOwner: {
            none: { viewerCompanyId, status: ConnectionStatus.Blocked },
          },
        },
        select: { city: true },
        distinct: ['city'],
        take: 6,
      }),
      this.prisma.company.findMany({
        where: {
          id: { not: viewerCompanyId },
          connectionsAsOwner: {
            none: { viewerCompanyId, status: ConnectionStatus.Blocked },
          },
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
        connectionsAsOwner: { none: { viewerCompanyId, status: ConnectionStatus.Blocked } },
      },
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toCompanyCard(row));
  }

  private async collections(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<CursorPage<CollectionCard>> {
    const rows = await this.prisma.collection.findMany({
      where: {
        status: CollectionStatus.Published,
        companyId: { not: viewerCompanyId },
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { company: { name: { contains: query.q, mode: 'insensitive' } } },
          { company: { city: { contains: query.q, mode: 'insensitive' } } },
        ],
        company: { connectionsAsOwner: { none: { viewerCompanyId, status: ConnectionStatus.Blocked } } },
        AND: [
          {
            OR: [
              { audience: { not: 'selected' } },
              { audience: 'selected', audienceCompanyIds: { has: viewerCompanyId } },
            ],
          },
        ],
      },
      include: collectionCardInclude,
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toCollectionCard(row));
  }

  private async designs(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<CursorPage<DiscoveryProductCard>> {
    const rows = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.Published,
        companyId: { not: viewerCompanyId },
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
          { categories: { has: query.q } },
          { company: { name: { contains: query.q, mode: 'insensitive' } } },
        ],
        company: { connectionsAsOwner: { none: { viewerCompanyId, status: ConnectionStatus.Blocked } } },
      },
      include: { company: true },
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toProductCard(row));
  }
}
