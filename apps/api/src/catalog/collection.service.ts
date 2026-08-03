import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionStatus,
  type CollectionDetailView,
  type CollectionView,
  type CreateCollectionDto,
  type PublishCollectionDto,
  type UpdateCollectionDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { assertCanPublish, grantPublishCapability } from './publish-capability';
import { CatalogSerializer } from './catalog.serializer';

@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CatalogSerializer,
  ) {}

  async create(companyId: string, dto: CreateCollectionDto): Promise<CollectionView> {
    const collection = await this.prisma.collection.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description ?? null,
        coverImage: dto.coverImage ?? null,
      },
    });
    return this.serializer.toCollectionView(collection, 0);
  }

  async list(companyId: string): Promise<CollectionView[]> {
    const collections = await this.prisma.collection.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { products: true } } },
    });
    return collections.map((collection) => this.serializer.toCollectionView(collection));
  }

  async get(companyId: string, id: string): Promise<CollectionDetailView> {
    await this.owned(companyId, id);
    const collection = await this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: {
        products: { orderBy: { position: 'asc' }, include: { product: true } },
      },
    });
    return this.serializer.toCollectionDetail(collection);
  }

  async update(companyId: string, id: string, dto: UpdateCollectionDto): Promise<CollectionView> {
    await this.owned(companyId, id);
    const collection = await this.prisma.collection.update({
      where: { id },
      data: { name: dto.name, description: dto.description, coverImage: dto.coverImage },
      include: { _count: { select: { products: true } } },
    });
    return this.serializer.toCollectionView(collection);
  }

  async publish(
    companyId: string,
    id: string,
    dto: PublishCollectionDto,
  ): Promise<CollectionView> {
    await this.owned(companyId, id);
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { canPublish: true },
    });
    if (!company.canPublish) {
      if (!dto.consentToSell) {
        await assertCanPublish(this.prisma, companyId);
      } else {
        await grantPublishCapability(this.prisma, companyId);
      }
    }
    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        status: CollectionStatus.Published,
        audience: dto.audience,
        rateVisibility: dto.rateVisibility,
      },
      include: { _count: { select: { products: true } } },
    });
    return this.serializer.toCollectionView(collection);
  }

  async setStatus(
    companyId: string,
    id: string,
    status: (typeof CollectionStatus)[keyof typeof CollectionStatus],
  ): Promise<CollectionView> {
    await this.owned(companyId, id);
    if (status === CollectionStatus.Published) {
      await assertCanPublish(this.prisma, companyId);
    }
    const collection = await this.prisma.collection.update({
      where: { id },
      data: { status },
      include: { _count: { select: { products: true } } },
    });
    return this.serializer.toCollectionView(collection);
  }

  /**
   * Replaces the collection's ordered product set. Every product must belong to
   * the same company, so a collection can never leak another company's products.
   */
  async setProducts(
    companyId: string,
    id: string,
    productIds: string[],
  ): Promise<CollectionDetailView> {
    await this.owned(companyId, id);

    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length > 0) {
      const owned = await this.prisma.product.count({
        where: { id: { in: uniqueIds }, companyId },
      });
      if (owned !== uniqueIds.length) {
        throw new BadRequestException({
          code: 'INVALID_PRODUCTS',
          message: 'One or more products do not belong to your business.',
        });
      }
    }

    await this.prisma.$transaction([
      this.prisma.collectionProduct.deleteMany({ where: { collectionId: id } }),
      this.prisma.collectionProduct.createMany({
        data: uniqueIds.map((productId, position) => ({ collectionId: id, productId, position })),
      }),
    ]);

    return this.get(companyId, id);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.owned(companyId, id);
    await this.prisma.collection.delete({ where: { id } });
  }

  private async owned(companyId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({ where: { id, companyId } });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    return collection;
  }
}
