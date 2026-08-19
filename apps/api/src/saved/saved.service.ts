import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConnectionStatus,
  ProductStatus,
  type CreateSavedItemDto,
  type SavedItemView,
  type SavedListView,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { CompanySerializer } from '../access/company.serializer';
import { canDiscoverCollection } from '../catalog/audience-visibility';
import { isCollectionLiveForBuyers } from '../catalog/collection-schedule';

type AudienceTarget = {
  id: string;
  companyId: string;
  audience: string;
  audienceCompanyIds: string[];
};

type ProductRow = AudienceTarget & {
  name: string;
  images: string[];
  status: string;
  postedToMarketAt: Date | null;
  company: {
    id: string;
    name: string;
    city: string | null;
    verification: string;
    logoUrl: string | null;
  };
};

type CollectionRow = AudienceTarget & {
  name: string;
  coverImage: string | null;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  company: {
    id: string;
    name: string;
    city: string | null;
    verification: string;
    logoUrl: string | null;
  };
  products: Array<{ product: { images: string[] } }>;
};

const companySelect = {
  id: true,
  name: true,
  city: true,
  verification: true,
  logoUrl: true,
} as const;

const listInclude = {
  product: { include: { company: { select: companySelect } } },
  collection: {
    include: {
      company: { select: companySelect },
      products: {
        orderBy: { position: 'asc' as const },
        take: 1,
        include: { product: { select: { images: true } } },
      },
    },
  },
};

/**
 * Private bookmark shortlist for designs and collections.
 * Discoverability required; allowForward is NOT required (unlike curate/publish).
 */
@Injectable()
export class SavedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompanySerializer,
  ) {}

  async list(companyId: string): Promise<SavedListView> {
    const rows = await this.prisma.savedItem.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: listInclude,
    });
    return rows.map((row) => this.toView(row));
  }

  async create(companyId: string, dto: CreateSavedItemDto): Promise<SavedItemView> {
    const hasProduct = Boolean(dto.productId);
    const hasCollection = Boolean(dto.collectionId);
    if (hasProduct === hasCollection) {
      throw new BadRequestException({
        code: 'INVALID_SAVED_TARGET',
        message: 'Save exactly one design or collection.',
      });
    }

    if (dto.productId) {
      return this.saveProduct(companyId, dto.productId);
    }
    return this.saveCollection(companyId, dto.collectionId!);
  }

  async remove(companyId: string, id: string): Promise<void> {
    const existing = await this.prisma.savedItem.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Saved item not found.' });
    }
    await this.prisma.savedItem.delete({ where: { id } });
  }

  private async saveProduct(companyId: string, productId: string): Promise<SavedItemView> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { company: { select: companySelect } },
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Design not found.' });
    }
    if (!(await this.canDiscoverProduct(companyId, product))) {
      throw new BadRequestException({
        code: 'NOT_DISCOVERABLE',
        message: 'This design is not visible to you.',
      });
    }

    const row = await this.prisma.savedItem.upsert({
      where: { companyId_productId: { companyId, productId } },
      create: { companyId, productId },
      update: {},
      include: listInclude,
    });
    return this.toView(row);
  }

  private async saveCollection(
    companyId: string,
    collectionId: string,
  ): Promise<SavedItemView> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        company: { select: companySelect },
        products: {
          orderBy: { position: 'asc' },
          take: 1,
          include: { product: { select: { images: true } } },
        },
      },
    });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    if (!(await this.canDiscoverSavedCollection(companyId, collection))) {
      throw new BadRequestException({
        code: 'NOT_DISCOVERABLE',
        message: 'This collection is not visible to you.',
      });
    }

    const row = await this.prisma.savedItem.upsert({
      where: { companyId_collectionId: { companyId, collectionId } },
      create: { companyId, collectionId },
      update: {},
      include: listInclude,
    });
    return this.toView(row);
  }

  /**
   * Same rules as collection.service discoverableProductIds: published + on market
   * + audience/block/follow context. Own-company always allowed.
   */
  private async canDiscoverProduct(
    viewerCompanyId: string,
    product: ProductRow,
  ): Promise<boolean> {
    if (product.companyId === viewerCompanyId) {
      return true;
    }
    if (product.status !== ProductStatus.Published || !product.postedToMarketAt) {
      return false;
    }
    const ctx = await this.audienceContext(viewerCompanyId, product.companyId);
    if (ctx.blocked) {
      return false;
    }
    return canDiscoverCollection(viewerCompanyId, product, {
      connected: ctx.connected,
      following: ctx.following,
    });
  }

  private async canDiscoverSavedCollection(
    viewerCompanyId: string,
    collection: CollectionRow,
  ): Promise<boolean> {
    if (collection.companyId === viewerCompanyId) {
      return true;
    }
    if (!isCollectionLiveForBuyers(collection)) {
      return false;
    }
    const ctx = await this.audienceContext(viewerCompanyId, collection.companyId);
    if (ctx.blocked) {
      return false;
    }
    return canDiscoverCollection(viewerCompanyId, collection, {
      connected: ctx.connected,
      following: ctx.following,
    });
  }

  private async audienceContext(
    viewerCompanyId: string,
    ownerCompanyId: string,
  ): Promise<{ connected: boolean; following: boolean; blocked: boolean }> {
    const [connection, follow] = await Promise.all([
      this.prisma.connection.findMany({
        where: { ownerCompanyId, viewerCompanyId },
        select: { ownerCompanyId: true, status: true },
      }),
      this.prisma.follow.findMany({
        where: { followerCompanyId: viewerCompanyId, followedCompanyId: ownerCompanyId },
        select: { followedCompanyId: true },
      }),
    ]);
    const status = connection[0]?.status;
    return {
      connected: status === ConnectionStatus.Active,
      following: follow.length > 0,
      blocked: status === ConnectionStatus.Blocked,
    };
  }

  private toView(row: {
    id: string;
    productId: string | null;
    collectionId: string | null;
    createdAt: Date;
    product: ProductRow | null;
    collection: CollectionRow | null;
  }): SavedItemView {
    if (row.productId && row.product) {
      return {
        id: row.id,
        kind: 'product',
        productId: row.productId,
        company: this.companies.toPublicSummary(row.product.company as never),
        name: row.product.name,
        thumbUrl: row.product.images[0] ?? null,
        createdAt: row.createdAt.toISOString(),
      };
    }
    if (row.collectionId && row.collection) {
      const cover =
        row.collection.coverImage ||
        row.collection.products.flatMap((entry) => entry.product.images)[0] ||
        null;
      return {
        id: row.id,
        kind: 'collection',
        collectionId: row.collectionId,
        company: this.companies.toPublicSummary(row.collection.company as never),
        name: row.collection.name,
        thumbUrl: cover,
        createdAt: row.createdAt.toISOString(),
      };
    }
    throw new BadRequestException({
      code: 'INVALID_SAVED_ITEM',
      message: 'Saved item is missing its target.',
    });
  }
}
