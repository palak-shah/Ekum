import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CatalogOrderMode,
  CollectionKind,
  CollectionStatus,
  ConnectionStatus,
  FollowAccessKind,
  JobType,
  ProductStatus,
  type CollectionDetailView,
  type CollectionView,
  type CreateCollectionDto,
  type CurateCheckView,
  type ListCatalogQuery,
  type OtherPackCountsView,
  type PublishCollectionDto,
  type PublishCollectionMembersView,
  type UpdateCollectionDto,
} from '@ekum/domain-types';
import { createdAtOrderBy, createdAtRangeFilter } from '../common/audit';
import { PrismaService } from '../core/prisma/prisma.service';
import { ensureSellingEnabled } from '../identity/trade-presence';
import { JobQueue } from '../jobs/job-queue.service';
import { canDiscoverCollection } from './audience-visibility';
import {
  assertProductsCuratable,
  curatedPublishRateVisibility,
  type CuratableProduct,
} from './curation-ceiling';
import { counterpartCompanyId } from '../access/connection-pair';
import {
  assertCanPublish,
  grantPublishCapability,
  grantRelistCapability,
} from './publish-capability';
import { CatalogSerializer, collectionActorInclude, productActorInclude } from './catalog.serializer';
import {
  assertValidLiveWindow,
  parseScheduleInstant,
} from './collection-schedule';
import { rememberPublishDefaults } from './publish-policy';
import { shouldBumpExploreOnPublish } from './explore-activity-bump';
import { prismaModelHasField, withPrismaField } from '../common/prisma-model-fields';
import { MasterDataService } from './master-data/master-data.service';
import {
  assertNotGeneralMutation,
  ensureGeneralCollection,
  generalMemberJoinRows,
  generalMemberProductWhere,
  isCatalogKind,
  isGeneralKind,
  packNoun,
  qualifyingCollectionWhere,
} from './general-collection';

type ProductCeilingRow = CuratableProduct & {
  audienceCompanyIds: string[];
};

function curateExceptionCode(err: unknown): string {
  if (err instanceof BadRequestException) {
    const body = err.getResponse();
    if (typeof body === 'object' && body && 'code' in body && typeof body.code === 'string') {
      return body.code;
    }
  }
  return 'INVALID_PRODUCTS';
}

const listInclude = {
  ...collectionActorInclude,
  _count: { select: { products: true } },
  products: {
    orderBy: { position: 'asc' as const },
    include: {
      product: { include: { company: { select: { id: true, name: true } } } },
    },
  },
};

@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CatalogSerializer,
    private readonly jobs: JobQueue,
    private readonly masterData: MasterDataService,
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
    // Drafts may be saved before a name. Publish still requires one.
    if (!name) return '';
    const clash = await this.prisma.collection.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: 'insensitive' },
        status: { not: CollectionStatus.Archived },
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      },
      select: { id: true, name: true, kind: true },
    });
    if (clash) {
      const noun = packNoun((clash as { kind?: string }).kind);
      throw new ConflictException({
        code: 'COLLECTION_NAME_TAKEN',
        message: opts.restoring
          ? `Restore blocked — a live ${noun} already uses “${clash.name}”.`
          : `You already have a ${noun} named “${clash.name}”.`,
        details: {
          collectionId: clash.id,
          name: clash.name,
          kind: (clash as { kind?: string }).kind ?? null,
        },
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
    const repostSource = await this.resolveRepostSource(companyId, dto);
    const masterCategoryId =
      prismaModelHasField('Collection', 'masterCategoryId') && this.masterData
        ? await this.masterData.resolveCategoryIdForCompany(companyId, dto.masterCategoryId, {
            // Draft create does not require a category. Publish checks it.
            // Peer Repost still has no picker — supplier already categorized.
            required: false,
          })
        : null;
    try {
      const collection = await this.prisma.collection.create({
        data: withPrismaField(
          'Collection',
          'rateMax',
          withPrismaField(
            'Collection',
            'rate',
            {
              companyId,
              name,
              description: dto.description ?? null,
              coverImage: dto.coverImage ?? null,
              categories: dto.categories ?? [],
              ...(masterCategoryId !== null && prismaModelHasField('Collection', 'masterCategoryId')
                ? { masterCategoryId }
                : {}),
              ...(dto.unit !== undefined && prismaModelHasField('Collection', 'unit')
                ? { unit: dto.unit }
                : {}),
              ...(dto.dispatchUnit !== undefined &&
              prismaModelHasField('Collection', 'dispatchUnit')
                ? { dispatchUnit: dto.dispatchUnit }
                : {}),
              ...(dto.catalogRateUnit !== undefined &&
              prismaModelHasField('Collection', 'catalogRateUnit')
                ? { catalogRateUnit: dto.catalogRateUnit }
                : {}),
              ...(dto.piecesPerPack !== undefined &&
              prismaModelHasField('Collection', 'piecesPerPack')
                ? { piecesPerPack: dto.piecesPerPack }
                : {}),
              startsAt: startsAt === undefined ? null : startsAt,
              endsAt: endsAt === undefined ? null : endsAt,
              createdByUserId: userId,
              updatedByUserId: userId,
              ...(prismaModelHasField('Collection', 'kind')
                ? {
                    kind:
                      dto.kind === CollectionKind.Catalog
                        ? CollectionKind.Catalog
                        : CollectionKind.Regular,
                  }
                : {}),
              ...(prismaModelHasField('Collection', 'orderMode')
                ? {
                    orderMode:
                      dto.kind === CollectionKind.Catalog
                        ? (dto.orderMode ?? CatalogOrderMode.Pick)
                        : null,
                  }
                : {}),
              ...repostSource,
            },
            dto.rate ?? null,
          ),
          dto.rateMax ?? null,
        ),
        include: listInclude,
      });
      await ensureSellingEnabled(this.prisma, companyId);
      return this.serializer.toCollectionView(collection, 0);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'ALREADY_REPOSTED',
          message: 'You already reposted this.',
        });
      }
      throw err;
    }
  }

  /** Explore Repost stamps — validate peer source + once-per-owner. */
  private async resolveRepostSource(
    companyId: string,
    dto: CreateCollectionDto,
  ): Promise<{
    repostSourceCollectionId?: string | null;
    repostSourceProductId?: string | null;
  }> {
    if (!dto.repostSourceCollectionId && !dto.repostSourceProductId) {
      return {};
    }
    if (dto.repostSourceCollectionId && dto.repostSourceProductId) {
      throw new BadRequestException({
        code: 'INVALID_REPOST_SOURCE',
        message: 'Pick one source post to repost.',
      });
    }
    if (dto.repostSourceCollectionId) {
      const source = await this.prisma.collection.findUnique({
        where: { id: dto.repostSourceCollectionId },
        select: { id: true, companyId: true, status: true },
      });
      if (!source || source.status !== CollectionStatus.Published) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'That pack is not available to repost.',
        });
      }
      if (source.companyId === companyId) {
        throw new BadRequestException({
          code: 'OWN_POST',
          message: 'You can’t repost your own pack.',
        });
      }
      const existing = await this.prisma.collection.findFirst({
        where: {
          companyId,
          repostSourceCollectionId: source.id,
        },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException({
          code: 'ALREADY_REPOSTED',
          message: 'You already reposted this.',
        });
      }
      return { repostSourceCollectionId: source.id, repostSourceProductId: null };
    }
    const productId = dto.repostSourceProductId!;
    const source = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, companyId: true, status: true, postedToMarketAt: true },
    });
    if (!source || source.status !== ProductStatus.Published || !source.postedToMarketAt) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'That design is not available to repost.',
      });
    }
    if (source.companyId === companyId) {
      throw new BadRequestException({
        code: 'OWN_POST',
        message: 'You can’t repost your own design.',
      });
    }
    const existing = await this.prisma.collection.findFirst({
      where: {
        companyId,
        repostSourceProductId: source.id,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_REPOSTED',
        message: 'You already reposted this.',
      });
    }
    return { repostSourceCollectionId: null, repostSourceProductId: source.id };
  }

  async list(
    companyId: string,
    query: ListCatalogQuery = { sort: 'newest' },
  ): Promise<CollectionView[]> {
    await ensureGeneralCollection(this.prisma, companyId);
    const createdAt = createdAtRangeFilter(query);
    const collections = await this.prisma.collection.findMany({
      where: {
        companyId,
        ...(createdAt ? { createdAt } : {}),
        ...(query.kind ? { kind: query.kind } : {}),
      },
      orderBy: [...createdAtOrderBy(query.sort)],
      include: listInclude,
    });
    collections.sort((a, b) => {
      const ag = isGeneralKind((a as { kind?: string }).kind) ? 0 : 1;
      const bg = isGeneralKind((b as { kind?: string }).kind) ? 0 : 1;
      return ag - bg;
    });
    const general = collections.find((row) => isGeneralKind((row as { kind?: string }).kind));
    const generalMembers = general
      ? await this.prisma.product.findMany({
          where: generalMemberProductWhere(companyId),
          include: { company: { select: { id: true, name: true } } },
          orderBy: { updatedAt: 'desc' },
        })
      : [];
    return collections.map((collection) => {
      if (!isGeneralKind((collection as { kind?: string }).kind)) {
        return this.serializer.toCollectionView(collection);
      }
      const products = generalMemberJoinRows(collection.id, generalMembers);
      return this.serializer.toCollectionView(
        { ...collection, products, _count: { products: products.length } },
        products.length,
      );
    });
  }

  async get(companyId: string, id: string): Promise<CollectionDetailView> {
    await this.owned(companyId, id);
    const collection = await this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: {
        ...collectionActorInclude,
        products: {
          orderBy: { position: 'asc' },
          include: {
            product: {
              include: {
                ...productActorInclude,
                company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (isGeneralKind((collection as { kind?: string }).kind)) {
      const members = await this.prisma.product.findMany({
        where: generalMemberProductWhere(companyId),
        include: {
          ...productActorInclude,
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return this.serializer.toCollectionDetail({
        ...collection,
        products: generalMemberJoinRows(collection.id, members),
      });
    }
    return this.serializer.toCollectionDetail(collection);
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateCollectionDto,
  ): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
    if (isGeneralKind((existing as { kind?: string }).kind)) {
      if (
        dto.categories?.length ||
        dto.masterCategoryId ||
        dto.rate !== undefined ||
        dto.kind === CollectionKind.Catalog
      ) {
        assertNotGeneralMutation('general', 'has no tags, category, or rate');
      }
      const name =
        dto.name !== undefined && dto.name.trim() !== existing.name
          ? await this.assertNameAvailable(companyId, dto.name, { excludeId: id })
          : existing.name;
      const collection = await this.prisma.collection.update({
        where: { id },
        data: { name, updatedByUserId: userId },
        include: listInclude,
      });
      const generalCount = await this.prisma.product.count({
        where: generalMemberProductWhere(companyId),
      });
      return this.serializer.toCollectionView(collection, generalCount);
    }
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
        ...(dto.rate !== undefined && prismaModelHasField('Collection', 'rate')
          ? { rate: dto.rate }
          : {}),
        ...(dto.rateMax !== undefined && prismaModelHasField('Collection', 'rateMax')
          ? { rateMax: dto.rateMax }
          : {}),
        ...(dto.unit !== undefined && prismaModelHasField('Collection', 'unit')
          ? { unit: dto.unit }
          : {}),
        ...(dto.dispatchUnit !== undefined && prismaModelHasField('Collection', 'dispatchUnit')
          ? { dispatchUnit: dto.dispatchUnit }
          : {}),
        ...(dto.catalogRateUnit !== undefined &&
        prismaModelHasField('Collection', 'catalogRateUnit')
          ? { catalogRateUnit: dto.catalogRateUnit }
          : {}),
        ...(dto.piecesPerPack !== undefined && prismaModelHasField('Collection', 'piecesPerPack')
          ? { piecesPerPack: dto.piecesPerPack }
          : {}),
        ...(dto.categories !== undefined ? { categories: dto.categories } : {}),
        ...(dto.masterCategoryId !== undefined &&
        prismaModelHasField('Collection', 'masterCategoryId')
          ? {
              masterCategoryId: await this.masterData.resolveCategoryIdForCompany(
                companyId,
                dto.masterCategoryId,
              ),
            }
          : {}),
        ...(dto.orderMode !== undefined &&
        isCatalogKind((existing as { kind?: string }).kind) &&
        prismaModelHasField('Collection', 'orderMode') &&
        (dto.orderMode === CatalogOrderMode.Whole || dto.orderMode === CatalogOrderMode.Pick)
          ? { orderMode: dto.orderMode }
          : {}),
        updatedByUserId: userId,
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {}),
      },
      include: listInclude,
    });
    if (endsAt !== undefined) {
      await this.scheduleExpire(id, endsAt);
      // Reload: scheduleExpire may have drafted immediately when endsAt is past.
      return this.toLatestCollectionView(id);
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
    assertNotGeneralMutation((existing as { kind?: string }).kind, 'is not published to Explore');
    if (typeof existing.name === 'string' && !existing.name.trim()) {
      throw new BadRequestException({
        code: 'INVALID_NAME',
        message: `Give this ${packNoun((existing as { kind?: string }).kind)} a name.`,
      });
    }
    if (this.masterData && prismaModelHasField('Collection', 'masterCategoryId')) {
      await this.masterData.resolveCategoryIdForCompany(companyId, existing.masterCategoryId, {
        required: true,
      });
    }
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
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            companyId: true,
            audience: true,
            audienceCompanyIds: true,
            allowForward: true,
            status: true,
            postedToMarketAt: true,
            rateVisibility: true,
          },
        },
      },
    });
    if (members.length < 1) {
      throw new BadRequestException({
        code: 'COLLECTION_EMPTY',
        message: `Add at least one design before publishing this ${packNoun((existing as { kind?: string }).kind)}.`,
      });
    }

    const products = members.map((row) => row.product);
    const discoverableIds = await this.discoverableProductIds(companyId, products);
    const relistGrantedIds = await this.relistGrantedProductIds(companyId, products);
    const lookOnlyOwnerIds = await this.lookOnlyOwnerIds(companyId, products);
    assertProductsCuratable({
      curatorCompanyId: companyId,
      products,
      publishAudience: dto.audience,
      discoverableIds,
      relistGrantedIds,
      lookOnlyOwnerIds,
    });

    const rateVisibility = curatedPublishRateVisibility({
      curatorCompanyId: companyId,
      requested: dto.rateVisibility,
      products,
    });

    const startsAt = parseScheduleInstant(dto.startsAt, 'start');
    const endsAt = parseScheduleInstant(dto.endsAt, 'end');
    const nextStarts = startsAt === undefined ? existing.startsAt : startsAt;
    const nextEnds = endsAt === undefined ? existing.endsAt : endsAt;
    assertValidLiveWindow(nextStarts, nextEnds);

    // Pack alone on Explore. Own drafts become Published for Order/Share/Curate
    // inside the pack, but postedToMarketAt stays null (no design-tile flood).
    const memberIds = members.map((row) => row.productId);
    const allowForward = dto.allowForward !== false;
    const allowDownload = dto.allowDownload === true;
    const showSourceShops = dto.showSourceShops === true;
    const now = new Date();
    await this.prisma.product.updateMany({
      where: {
        id: { in: memberIds },
        companyId,
        status: ProductStatus.Draft,
      },
      data: {
        status: ProductStatus.Published,
        audience: dto.audience,
        rateVisibility,
        audienceCompanyIds,
        audienceGroupIds,
        allowForward,
        allowDownload,
        updatedByUserId: userId,
      },
    });
    // Cascade download gate onto all own members (including already published).
    await this.prisma.product.updateMany({
      where: { id: { in: memberIds }, companyId },
      data: { allowDownload, updatedByUserId: userId },
    });

    // First publish / widen to Followers·Everyone·Connections resurfaces.
    // Selected-list-only tweaks on an already-live pack do not.
    const bumpExplore = shouldBumpExploreOnPublish({
      priorStatus: existing.status,
      priorAudience: existing.audience,
      nextAudience: dto.audience,
      exploreActivityAt: existing.exploreActivityAt,
    });

    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        status: CollectionStatus.Published,
        audience: dto.audience,
        rateVisibility,
        audienceCompanyIds,
        audienceGroupIds,
        allowForward,
        allowDownload,
        showSourceShops,
        updatedByUserId: userId,
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {}),
        ...(bumpExplore
          ? { exploreActivityAt: now, exploreNewDesignCount: 0 }
          : {}),
      },
      include: listInclude,
    });
    await rememberPublishDefaults(this.prisma, companyId, {
      rateVisibility,
      allowForward,
      allowDownload,
    });
    const hasForeignMember = products.some((product) => product.companyId !== companyId);
    if (hasForeignMember) {
      await grantRelistCapability(this.prisma, companyId);
    }
    await this.scheduleExpire(id, collection.endsAt);
    // Reload: scheduleExpire may have drafted immediately when endsAt is past.
    return this.toLatestCollectionView(id);
  }

  async markReady(companyId: string, userId: string, id: string): Promise<CollectionView> {
    void companyId;
    void userId;
    void id;
    throw new BadRequestException({
      code: 'NOT_ALLOWED',
      message: 'Collections are Draft or Published — there is no Ready step.',
    });
  }

  async unready(companyId: string, userId: string, id: string): Promise<CollectionView> {
    return this.setStatus(companyId, userId, id, CollectionStatus.Draft);
  }

  /** Deleted packs cannot be restored. */
  async unarchive(_companyId: string, _userId: string, _id: string): Promise<CollectionView> {
    throw new BadRequestException({
      code: 'NOT_ALLOWED',
      message: 'Deleted collections cannot be restored.',
    });
  }

  async setStatus(
    companyId: string,
    userId: string,
    id: string,
    status: (typeof CollectionStatus)[keyof typeof CollectionStatus],
    opts: { alsoArchiveDesigns?: boolean; alsoDraftDesigns?: boolean } = {},
  ): Promise<CollectionView> {
    const existing = await this.owned(companyId, id);
    assertNotGeneralMutation((existing as { kind?: string }).kind, 'cannot change status');
    if (status === CollectionStatus.Ready) {
      throw new BadRequestException({
        code: 'NOT_ALLOWED',
        message: 'Collections are Draft or Published — there is no Ready step.',
      });
    }
    if (status === CollectionStatus.Published) {
      await assertCanPublish(this.prisma, companyId);
    }
    if (status === CollectionStatus.Draft && opts.alsoDraftDesigns) {
      await this.draftOwnMembers(companyId, userId, id);
    }
    if (status === CollectionStatus.Archived && opts.alsoArchiveDesigns) {
      await this.deleteOwnUnsharedMembers(companyId, userId, id);
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

  async checkCurateProducts(companyId: string, productIds: string[]): Promise<CurateCheckView> {
    const uniqueIds = [...new Set(productIds)];
    const allowedProductIds: string[] = [];
    const blocked: CurateCheckView['blocked'] = [];
    if (uniqueIds.length === 0) {
      return { allowedProductIds, blocked };
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        companyId: true,
        audience: true,
        audienceCompanyIds: true,
        allowForward: true,
        status: true,
        postedToMarketAt: true,
      },
    });
    const found = new Set(products.map((product) => product.id));
    for (const productId of uniqueIds) {
      if (!found.has(productId)) {
        blocked.push({ productId, code: 'INVALID_PRODUCTS' });
      }
    }

    const discoverableIds = await this.discoverableProductIds(companyId, products);
    const relistGrantedIds = await this.relistGrantedProductIds(companyId, products);
    const lookOnlyOwnerIds = await this.lookOnlyOwnerIds(companyId, products);
    for (const product of products) {
      try {
        assertProductsCuratable({
          curatorCompanyId: companyId,
          products: [product],
          discoverableIds,
          relistGrantedIds,
          lookOnlyOwnerIds,
        });
        allowedProductIds.push(product.id);
      } catch (err) {
        blocked.push({ productId: product.id, code: curateExceptionCode(err) });
      }
    }
    return { allowedProductIds, blocked };
  }

  /**
   * For each product id, how many other non-archived packs of this company
   * also include it (excludes `collectionId`). Used by Delete confirm.
   */
  async otherPackCounts(
    companyId: string,
    collectionId: string,
    productIds: string[],
  ): Promise<OtherPackCountsView> {
    await this.owned(companyId, collectionId);
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length === 0) {
      return { counts: [] };
    }

    const rows = await this.prisma.collectionProduct.findMany({
      where: {
        productId: { in: uniqueIds },
        collectionId: { not: collectionId },
        collection: {
          companyId,
          status: { not: CollectionStatus.Archived },
        },
      },
      select: { productId: true },
    });

    const tally = new Map<string, number>();
    for (const id of uniqueIds) tally.set(id, 0);
    for (const row of rows) {
      tally.set(row.productId, (tally.get(row.productId) ?? 0) + 1);
    }

    return {
      counts: uniqueIds.map((productId) => ({
        productId,
        otherPackCount: tally.get(productId) ?? 0,
      })),
    };
  }

  /**
   * Own draft members go live in this pack (Order / Share). No Explore tile —
   * postedToMarketAt stays null. Audience follows the pack, not a second Who.
   */
  async publishMembers(
    companyId: string,
    userId: string,
    id: string,
    productIds: string[],
  ): Promise<PublishCollectionMembersView> {
    const existing = await this.owned(companyId, id);
    await assertCanPublish(this.prisma, companyId);
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCTS',
        message: 'Pick a draft design of yours.',
      });
    }

    let memberIds: string[];
    if (isGeneralKind((existing as { kind?: string }).kind)) {
      const leftovers = await this.prisma.product.findMany({
        where: {
          ...generalMemberProductWhere(companyId),
          id: { in: uniqueIds },
          status: ProductStatus.Draft,
        },
        select: { id: true },
      });
      memberIds = leftovers.map((row) => row.id);
    } else {
      const rows = await this.prisma.collectionProduct.findMany({
        where: {
          collectionId: id,
          productId: { in: uniqueIds },
          product: { companyId, status: ProductStatus.Draft },
        },
        select: { productId: true },
      });
      memberIds = rows.map((row) => row.productId);
    }
    if (memberIds.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCTS',
        message: 'Pick a draft design of yours.',
      });
    }

    const pack = existing as {
      audience: string;
      rateVisibility: string;
      audienceCompanyIds: string[];
      audienceGroupIds: string[];
      allowForward: boolean;
      allowDownload: boolean;
    };
    const result = await this.prisma.product.updateMany({
      where: { id: { in: memberIds }, companyId, status: ProductStatus.Draft },
      data: {
        status: ProductStatus.Published,
        audience: pack.audience,
        rateVisibility: pack.rateVisibility,
        audienceCompanyIds: pack.audienceCompanyIds,
        audienceGroupIds: pack.audienceGroupIds,
        allowForward: pack.allowForward !== false,
        allowDownload: pack.allowDownload === true,
        updatedByUserId: userId,
      },
    });
    return { published: result.count };
  }

  /**
   * Replaces the collection's ordered product set. Own-company products are
   * always allowed; foreign products must pass the curation ceiling
   * (discoverable + allowForward).
   */
  async setProducts(
    companyId: string,
    userId: string,
    id: string,
    productIds: string[],
  ): Promise<CollectionDetailView> {
    const existing = await this.owned(companyId, id);
    assertNotGeneralMutation(
      (existing as { kind?: string }).kind,
      'membership is automatic — designs cannot be added or removed by hand',
    );

    const uniqueIds = [...new Set(productIds)];
    const products =
      uniqueIds.length === 0
        ? []
        : await this.prisma.product.findMany({
            where: { id: { in: uniqueIds } },
            select: {
              id: true,
              companyId: true,
              audience: true,
              audienceCompanyIds: true,
              allowForward: true,
              status: true,
              postedToMarketAt: true,
              catalogCollectionId: true,
            },
          });
    if (uniqueIds.length > 0) {
      if (products.length !== uniqueIds.length) {
        throw new BadRequestException({
          code: 'INVALID_PRODUCTS',
          message: 'One or more products could not be found.',
        });
      }
      if (products.some((product) => product.status === ProductStatus.Archived)) {
        throw new BadRequestException({
          code: 'INVALID_PRODUCTS',
          message: 'Deleted designs cannot be added to a collection.',
        });
      }
    }

    const previousRows = await this.prisma.collectionProduct.findMany({
      where: { collectionId: id },
      select: { productId: true },
    });
    const previousIds = new Set(previousRows.map((row) => row.productId));
    const newlyAddedIds = uniqueIds.filter((productId) => !previousIds.has(productId));
    const addedProducts = products.filter((product) => newlyAddedIds.includes(product.id));
    if (addedProducts.length > 0) {
      const discoverableIds = await this.discoverableProductIds(companyId, addedProducts);
      const relistGrantedIds = await this.relistGrantedProductIds(companyId, addedProducts);
      const lookOnlyOwnerIds = await this.lookOnlyOwnerIds(companyId, addedProducts);
      assertProductsCuratable({
        curatorCompanyId: companyId,
        products: addedProducts,
        discoverableIds,
        relistGrantedIds,
        lookOnlyOwnerIds,
      });
    }

    const ownIds = products.filter((product) => product.companyId === companyId).map((p) => p.id);
    const otherQualifying =
      ownIds.length === 0
        ? []
        : await this.prisma.collectionProduct.findMany({
            where: {
              productId: { in: ownIds },
              collectionId: { not: id },
              collection: qualifyingCollectionWhere(companyId),
            },
            select: { productId: true },
          });
    const otherQualifyingIds = new Set(otherQualifying.map((row) => row.productId));
    const catalogKind = isCatalogKind((existing as { kind?: string }).kind);
    const newlyAddedOwn = products.filter(
      (product) => product.companyId === companyId && newlyAddedIds.includes(product.id),
    );
    if (catalogKind) {
      const blocked = newlyAddedOwn.find(
        (product) =>
          otherQualifyingIds.has(product.id) ||
          (product.catalogCollectionId && product.catalogCollectionId !== id),
      );
      if (blocked) {
        throw new ConflictException({
          code: 'CATALOG_EXCLUSIVE',
          message: 'A catalog design cannot also sit in another of your collections or catalogs.',
        });
      }
    } else {
      const blocked = newlyAddedOwn.find(
        (product) => product.catalogCollectionId && product.catalogCollectionId !== id,
      );
      if (blocked) {
        throw new ConflictException({
          code: 'CATALOG_EXCLUSIVE',
          message: 'That design is already in a catalog. Remove it from the catalog first.',
        });
      }
    }

    let shouldBumpExplore = false;
    let exploreNewDesignCount = 0;
    if (existing.status === CollectionStatus.Published && newlyAddedIds.length > 0) {
      const publishedNew = await this.prisma.product.count({
        where: {
          id: { in: newlyAddedIds },
          status: ProductStatus.Published,
        },
      });
      if (publishedNew > 0) {
        shouldBumpExplore = true;
        exploreNewDesignCount = publishedNew;
      }
    }

    const stampOwnIds = catalogKind
      ? newlyAddedOwn.map((product) => product.id)
      : [];

    if (catalogKind) {
      await this.prisma.$transaction(async (tx) => {
        if (stampOwnIds.length > 0) {
          await tx.$executeRawUnsafe(
            `SELECT id FROM "Product" WHERE id = ANY($1::text[]) FOR UPDATE`,
            stampOwnIds,
          );
          const claimed = await tx.product.updateMany({
            where: {
              id: { in: stampOwnIds },
              companyId,
              OR: [{ catalogCollectionId: null }, { catalogCollectionId: id }],
            },
            data: { catalogCollectionId: id },
          });
          if (claimed.count !== stampOwnIds.length) {
            throw new ConflictException({
              code: 'CATALOG_EXCLUSIVE',
              message:
                'A catalog design cannot also sit in another of your collections or catalogs.',
            });
          }
        }
        await tx.collectionProduct.deleteMany({ where: { collectionId: id } });
        if (uniqueIds.length > 0) {
          await tx.collectionProduct.createMany({
            data: uniqueIds.map((productId, position) => ({
              collectionId: id,
              productId,
              position,
            })),
          });
        }
        await tx.collection.update({
          where: { id },
          data: {
            updatedByUserId: userId,
            ...(shouldBumpExplore
              ? { exploreActivityAt: new Date(), exploreNewDesignCount }
              : {}),
          },
        });
        const keepOwn = new Set(ownIds);
        await tx.product.updateMany({
          where: {
            catalogCollectionId: id,
            ...(keepOwn.size > 0 ? { id: { notIn: [...keepOwn] } } : {}),
          },
          data: { catalogCollectionId: null },
        });
        if (stampOwnIds.length > 0) {
          await tx.product.updateMany({
            where: { id: { in: stampOwnIds }, companyId },
            data: {
              rate: existing.rate ?? null,
              rateMax: existing.rateMax ?? null,
              unit: existing.unit ?? null,
              dispatchUnit: existing.dispatchUnit ?? null,
              catalogRateUnit: existing.catalogRateUnit ?? null,
              piecesPerPack: existing.piecesPerPack ?? null,
              updatedByUserId: userId,
            },
          });
        }
      });
    } else {
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
            ...(shouldBumpExplore
              ? { exploreActivityAt: new Date(), exploreNewDesignCount }
              : {}),
          },
        }),
      ]);
    }

    return this.get(companyId, id);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.setStatus(companyId, '', id, CollectionStatus.Archived);
  }

  private async draftOwnMembers(companyId: string, userId: string, collectionId: string) {
    const rows = await this.prisma.collectionProduct.findMany({
      where: { collectionId, product: { companyId } },
      select: { productId: true },
    });
    const ids = rows.map((row) => row.productId);
    if (ids.length === 0) return;
    await this.prisma.product.updateMany({
      where: { id: { in: ids }, companyId, status: { not: ProductStatus.Archived } },
      data: { status: ProductStatus.Draft, postedToMarketAt: null, updatedByUserId: userId },
    });
  }

  private async deleteOwnUnsharedMembers(
    companyId: string,
    userId: string,
    collectionId: string,
  ) {
    const rows = await this.prisma.collectionProduct.findMany({
      where: { collectionId, product: { companyId } },
      select: { productId: true },
    });
    for (const row of rows) {
      const others = await this.prisma.collectionProduct.count({
        where: {
          productId: row.productId,
          collectionId: { not: collectionId },
          collection: qualifyingCollectionWhere(companyId),
        },
      });
      if (others > 0) continue;
      await this.prisma.product.updateMany({
        where: { id: row.productId, companyId },
        data: {
          status: ProductStatus.Archived,
          postedToMarketAt: null,
          catalogCollectionId: null,
          updatedByUserId: userId,
        },
      });
    }
  }

  /**
   * Builds the set of product ids the curator may discover (Explore/shop rules).
   * Always pass this into `assertProductsCuratable` — own-company ids are skipped
   * there, but foreign ids must be present.
   */
  private async discoverableProductIds(
    viewerCompanyId: string,
    products: ProductCeilingRow[],
  ): Promise<Set<string>> {
    const discoverable = new Set<string>();
    const foreign = products.filter((product) => product.companyId !== viewerCompanyId);
    if (foreign.length === 0) {
      return discoverable;
    }

    const ownerIds = [...new Set(foreign.map((product) => product.companyId))];
    const [connections, follows] = await Promise.all([
      this.prisma.connection.findMany({
        where: {
          OR: [
            { companyLowId: viewerCompanyId, companyHighId: { in: ownerIds } },
            { companyHighId: viewerCompanyId, companyLowId: { in: ownerIds } },
          ],
        },
        select: { companyLowId: true, companyHighId: true, status: true },
      }),
      this.prisma.follow.findMany({
        where: {
          followerCompanyId: viewerCompanyId,
          followedCompanyId: { in: ownerIds },
          status: 'allowed',
        },
        select: { followedCompanyId: true, accessKind: true },
      }),
    ]);

    const connectionByOwner = new Map(
      connections.map(
        (row) => [counterpartCompanyId(viewerCompanyId, row), row.status] as const,
      ),
    );
    const followingOwners = new Set(follows.map((row) => row.followedCompanyId));

    for (const product of foreign) {
      if (product.status !== ProductStatus.Published || !product.postedToMarketAt) {
        continue;
      }
      const status = connectionByOwner.get(product.companyId);
      if (status === ConnectionStatus.Blocked) {
        continue;
      }
      const connected = status === ConnectionStatus.Active;
      const following = followingOwners.has(product.companyId);
      if (
        canDiscoverCollection(viewerCompanyId, product, {
          connected,
          following,
        })
      ) {
        discoverable.add(product.id);
      }
    }

    return discoverable;
  }

  /** Allowed look follow and not Connected — cannot curate that seller. */
  private async lookOnlyOwnerIds(
    curatorCompanyId: string,
    products: ProductCeilingRow[],
  ): Promise<Set<string>> {
    const ownerIds = [
      ...new Set(
        products.filter((p) => p.companyId !== curatorCompanyId).map((p) => p.companyId),
      ),
    ];
    if (ownerIds.length === 0) return new Set();

    const [follows, connections] = await Promise.all([
      this.prisma.follow.findMany({
        where: {
          followerCompanyId: curatorCompanyId,
          followedCompanyId: { in: ownerIds },
          status: 'allowed',
          accessKind: FollowAccessKind.Look,
        },
        select: { followedCompanyId: true },
      }),
      this.prisma.connection.findMany({
        where: {
          status: ConnectionStatus.Active,
          OR: [
            { companyLowId: curatorCompanyId, companyHighId: { in: ownerIds } },
            { companyHighId: curatorCompanyId, companyLowId: { in: ownerIds } },
          ],
        },
        select: { companyLowId: true, companyHighId: true },
      }),
    ]);
    const connected = new Set(
      connections.map((row) => counterpartCompanyId(curatorCompanyId, row)),
    );
    return new Set(
      follows.map((row) => row.followedCompanyId).filter((id) => !connected.has(id)),
    );
  }

  /** Product ids with a ProductRelistGrant OR open via another company's pack allow. */
  private async relistGrantedProductIds(
    curatorCompanyId: string,
    products: ProductCeilingRow[],
  ): Promise<Set<string>> {
    const foreignLocked = products.filter(
      (product) => product.companyId !== curatorCompanyId && !product.allowForward,
    );
    if (foreignLocked.length === 0) {
      return new Set();
    }
    const lockedIds = foreignLocked.map((p) => p.id);
    const [grants, packOpen] = await Promise.all([
      this.prisma.productRelistGrant.findMany({
        where: {
          companyId: curatorCompanyId,
          productId: { in: lockedIds },
        },
        select: { productId: true },
      }),
      this.prisma.collectionProduct.findMany({
        where: {
          productId: { in: lockedIds },
          collection: {
            status: CollectionStatus.Published,
            allowForward: true,
            companyId: { not: curatorCompanyId },
          },
        },
        select: { productId: true },
      }),
    ]);
    return new Set([
      ...grants.map((g) => g.productId),
      ...packOpen.map((row) => row.productId),
    ]);
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

  /** Fresh row after mutations that may race with immediate expire. */
  private async toLatestCollectionView(id: string): Promise<CollectionView> {
    const collection = await this.prisma.collection.findUniqueOrThrow({
      where: { id },
      include: listInclude,
    });
    return this.serializer.toCollectionView(collection);
  }

  private async owned(companyId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({ where: { id, companyId } });
    if (!collection) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    return collection;
  }
}
