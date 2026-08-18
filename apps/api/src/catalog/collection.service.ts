import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CollectionStatus,
  JobType,
  ProductStatus,
  type CollectionDetailView,
  type CollectionView,
  type CreateCollectionDto,
  type ListCatalogQuery,
  type PublishCollectionDto,
  type UpdateCollectionDto,
} from '@ekum/domain-types';
import { createdAtOrderBy, createdAtRangeFilter } from '../common/audit';
import { PrismaService } from '../core/prisma/prisma.service';
import { ensureSellingEnabled } from '../identity/trade-presence';
import { JobQueue } from '../jobs/job-queue.service';
import { assertCanPublish, grantPublishCapability } from './publish-capability';
import { CatalogSerializer, collectionActorInclude, productActorInclude } from './catalog.serializer';
import {
  assertValidLiveWindow,
  parseScheduleInstant,
} from './collection-schedule';
import { rememberPublishDefaults } from './publish-policy';

const listInclude = {
  ...collectionActorInclude,
  _count: { select: { products: true } },
  products: {
    orderBy: { position: 'asc' as const },
    take: 12,
    include: { product: true },
  },
};

@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CatalogSerializer,
    private readonly jobs: JobQueue,
  ) {}

  /**
   * Non-archived packs in a company must have unique names (case-insensitive).
   * Archived packs may reuse a name already used by a live/draft/ready pack.
   */
  private async assertNameAvailable(
    companyId: string,
    rawName: string,
    opts: { excludeId?: string; restoring?: boolean } = {},
  ): Promise<string> {
    const name = rawName.trim();
    if (!name) {
      throw new BadRequestException({
        code: 'INVALID_NAME',
        message: 'Give this collection a name.',
      });
    }
    const clash = await this.prisma.collection.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: 'insensitive' },
        status: { not: CollectionStatus.Archived },
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      },
      select: { id: true, name: true },
    });
    if (clash) {
      throw new ConflictException({
        code: 'COLLECTION_NAME_TAKEN',
        message: opts.restoring
          ? `Restore blocked — a live collection already uses “${clash.name}”.`
          : `You already have a collection named “${clash.name}”. Archive it or pick another name.`,
      });
    }
    return name;
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateCollectionDto,
  ): Promise<CollectionView> {
    const name = await this.assertNameAvailable(companyId, dto.name);
    const startsAt = parseScheduleInstant(dto.startsAt, 'start');
    const endsAt = parseScheduleInstant(dto.endsAt, 'end');
    if (startsAt !== undefined || endsAt !== undefined) {
      assertValidLiveWindow(startsAt ?? null, endsAt ?? null);
    }
    const collection = await this.prisma.collection.create({
      data: {
        companyId,
        name,
        description: dto.description ?? null,
        coverImage: dto.coverImage ?? null,
        startsAt: startsAt === undefined ? null : startsAt,
        endsAt: endsAt === undefined ? null : endsAt,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
      include: listInclude,
    });
    await ensureSellingEnabled(this.prisma, companyId);
    return this.serializer.toCollectionView(collection, 0);
  }

  async list(
    companyId: string,
    query: ListCatalogQuery = { sort: 'newest' },
  ): Promise<CollectionView[]> {
    const createdAt = createdAtRangeFilter(query);
    const collections = await this.prisma.collection.findMany({
      where: {
        companyId,
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: [...createdAtOrderBy(query.sort)],
      include: listInclude,
    });
    return collections.map((collection) => this.serializer.toCollectionView(collection));
  }

  async get(companyId: string, id: string): Promise<CollectionDetailView> {
    await this.owned(companyId, id);
    const collection = await this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: {
        ...collectionActorInclude,
        products: {
          orderBy: { position: 'asc' },
          include: { product: { include: productActorInclude } },
        },
      },
    });
    return this.serializer.toCollectionDetail(collection);
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateCollectionDto,
  ): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
    const startsAt = parseScheduleInstant(dto.startsAt, 'start');
    const endsAt = parseScheduleInstant(dto.endsAt, 'end');
    const nextStarts = startsAt === undefined ? existing.startsAt : startsAt;
    const nextEnds = endsAt === undefined ? existing.endsAt : endsAt;
    assertValidLiveWindow(nextStarts, nextEnds);

    let nextName = dto.name;
    if (dto.name !== undefined && dto.name.trim() !== existing.name) {
      nextName = await this.assertNameAvailable(companyId, dto.name, { excludeId: id });
    }

    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        name: nextName,
        description: dto.description,
        coverImage: dto.coverImage,
        updatedByUserId: userId,
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {}),
      },
      include: listInclude,
    });
    if (endsAt !== undefined) {
      await this.scheduleExpire(id, endsAt);
    }
    return this.serializer.toCollectionView(collection);
  }

  async publish(
    companyId: string,
    userId: string,
    id: string,
    dto: PublishCollectionDto,
  ): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
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
    const audienceCompanyIds =
      dto.audience === 'selected' ? [...new Set(dto.companyIds ?? [])] : [];
    const audienceGroupIds =
      dto.audience === 'selected'
        ? [...new Set(dto.groupIds?.length ? dto.groupIds : dto.groupId ? [dto.groupId] : [])]
        : [];
    const members = await this.prisma.collectionProduct.findMany({
      where: { collectionId: id },
      select: { productId: true },
    });
    if (members.length < 1) {
      throw new BadRequestException({
        code: 'COLLECTION_EMPTY',
        message: 'Add at least one design before publishing this collection.',
      });
    }

    const startsAt = parseScheduleInstant(dto.startsAt, 'start');
    const endsAt = parseScheduleInstant(dto.endsAt, 'end');
    const nextStarts = startsAt === undefined ? existing.startsAt : startsAt;
    const nextEnds = endsAt === undefined ? existing.endsAt : endsAt;
    assertValidLiveWindow(nextStarts, nextEnds);

    // Draft designs in the album become published + Explore-visible with the pack.
    const memberIds = members.map((row) => row.productId);
    const allowForward = dto.allowForward !== false;
    const now = new Date();
    await this.prisma.product.updateMany({
      where: {
        id: { in: memberIds },
        companyId,
        status: ProductStatus.Draft,
      },
      data: {
        status: ProductStatus.Published,
        postedToMarketAt: now,
        audience: dto.audience,
        rateVisibility: dto.rateVisibility,
        audienceCompanyIds,
        audienceGroupIds,
        allowForward,
        updatedByUserId: userId,
      },
    });

    // Audience-only republish must not resurface the album; first publish (and
    // republish after hide/ready) do.
    const bumpExplore = existing.status !== CollectionStatus.Published;

    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        status: CollectionStatus.Published,
        audience: dto.audience,
        rateVisibility: dto.rateVisibility,
        audienceCompanyIds,
        audienceGroupIds,
        allowForward,
        updatedByUserId: userId,
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {}),
        ...(bumpExplore ? { exploreActivityAt: now } : {}),
      },
      include: listInclude,
    });
    await rememberPublishDefaults(this.prisma, companyId, {
      rateVisibility: dto.rateVisibility,
      allowForward,
    });
    await this.scheduleExpire(id, collection.endsAt);
    return this.serializer.toCollectionView(collection);
  }

  async markReady(companyId: string, userId: string, id: string): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
    if (
      existing.status !== CollectionStatus.Draft &&
      existing.status !== CollectionStatus.Ready
    ) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Only draft collections can be marked ready.',
      });
    }
    const members = await this.prisma.collectionProduct.count({ where: { collectionId: id } });
    if (members < 1) {
      throw new BadRequestException({
        code: 'COLLECTION_EMPTY',
        message: 'Add at least one design before marking ready.',
      });
    }
    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        status: CollectionStatus.Ready,
        exploreActivityAt: null,
        updatedByUserId: userId,
      },
      include: listInclude,
    });
    return this.serializer.toCollectionView(collection);
  }

  async unready(companyId: string, userId: string, id: string): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
    if (existing.status !== CollectionStatus.Ready) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Only ready collections can be moved back to draft.',
      });
    }
    return this.setStatus(companyId, userId, id, CollectionStatus.Draft);
  }

  /** Restore an archived pack to draft so it can be edited and published again. */
  async unarchive(companyId: string, userId: string, id: string): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
    if (existing.status !== CollectionStatus.Archived) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Only archived collections can be restored.',
      });
    }
    await this.assertNameAvailable(companyId, existing.name, {
      excludeId: id,
      restoring: true,
    });
    return this.setStatus(companyId, userId, id, CollectionStatus.Draft);
  }

  async setStatus(
    companyId: string,
    userId: string,
    id: string,
    status: (typeof CollectionStatus)[keyof typeof CollectionStatus],
  ): Promise<CollectionView> {
    await this.owned(companyId, id);
    if (status === CollectionStatus.Published) {
      await assertCanPublish(this.prisma, companyId);
    }
    const hideFromMarket =
      status === CollectionStatus.Draft || status === CollectionStatus.Archived;
    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        status,
        updatedByUserId: userId,
        ...(hideFromMarket ? { exploreActivityAt: null } : {}),
      },
      include: listInclude,
    });
    return this.serializer.toCollectionView(collection);
  }

  /**
   * Replaces the collection's ordered product set. Every product must belong to
   * the same company, so a collection can never leak another company's products.
   */
  async setProducts(
    companyId: string,
    userId: string,
    id: string,
    productIds: string[],
  ): Promise<CollectionDetailView> {
    const existing = await this.owned(companyId, id);

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

    const previousRows = await this.prisma.collectionProduct.findMany({
      where: { collectionId: id },
      select: { productId: true },
    });
    const previousIds = new Set(previousRows.map((row) => row.productId));
    const newlyAddedIds = uniqueIds.filter((productId) => !previousIds.has(productId));

    let shouldBumpExplore = false;
    if (existing.status === CollectionStatus.Published && newlyAddedIds.length > 0) {
      const publishedNew = await this.prisma.product.count({
        where: {
          id: { in: newlyAddedIds },
          companyId,
          status: ProductStatus.Published,
        },
      });
      shouldBumpExplore = publishedNew > 0;
    }

    await this.prisma.$transaction([
      this.prisma.collectionProduct.deleteMany({ where: { collectionId: id } }),
      ...(uniqueIds.length > 0
        ? [
            this.prisma.collectionProduct.createMany({
              data: uniqueIds.map((productId, position) => ({
                collectionId: id,
                productId,
                position,
              })),
            }),
          ]
        : []),
      this.prisma.collection.update({
        where: { id },
        data: {
          updatedByUserId: userId,
          ...(shouldBumpExplore ? { exploreActivityAt: new Date() } : {}),
        },
      }),
    ]);

    return this.get(companyId, id);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.owned(companyId, id);
    await this.prisma.collection.delete({ where: { id } });
  }

  private async scheduleExpire(collectionId: string, endsAt: Date | null): Promise<void> {
    if (!endsAt) return;
    if (endsAt.getTime() <= Date.now()) {
      // Already past — hide immediately via the same path as the job.
      await this.prisma.collection.updateMany({
        where: { id: collectionId, status: CollectionStatus.Published },
        data: { status: CollectionStatus.Draft, exploreActivityAt: null },
      });
      return;
    }
    await this.jobs.enqueue(JobType.CollectionExpire, { collectionId }, endsAt);
  }

  private async owned(companyId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({ where: { id, companyId } });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    return collection;
  }
}
