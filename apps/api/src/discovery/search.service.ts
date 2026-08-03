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
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { DiscoverySerializer } from './discovery.serializer';
import { collectionCardInclude } from './collection-preview';
import { cursorArgs, toCursorPage } from './pagination';

type SearchResults =
  | CursorPage<CompanyCard>
  | CursorPage<CollectionCard>
  | CursorPage<DiscoveryProductCard>;

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoverySerializer,
  ) {}

  search(viewerCompanyId: string, query: SearchQuery): Promise<SearchResults> {
    switch (query.type) {
      case 'company':
        return this.companies(viewerCompanyId, query);
      case 'collection':
        return this.collections(viewerCompanyId, query);
      case 'design':
        return this.designs(viewerCompanyId, query);
    }
  }

  private async companies(
    viewerCompanyId: string,
    query: SearchQuery,
  ): Promise<CursorPage<CompanyCard>> {
    const rows = await this.prisma.company.findMany({
      where: {
        id: { not: viewerCompanyId },
        name: { contains: query.q, mode: 'insensitive' },
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
        name: { contains: query.q, mode: 'insensitive' },
        company: { connectionsAsOwner: { none: { viewerCompanyId, status: ConnectionStatus.Blocked } } },
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
        name: { contains: query.q, mode: 'insensitive' },
        company: { connectionsAsOwner: { none: { viewerCompanyId, status: ConnectionStatus.Blocked } } },
      },
      include: { company: true },
      ...cursorArgs(query),
    });
    return toCursorPage(rows, query.limit, (row) => this.discovery.toProductCard(row));
  }
}
