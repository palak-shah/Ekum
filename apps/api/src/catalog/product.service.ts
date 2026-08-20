import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductStatus,
  type CreateProductDto,
  type ListCatalogQuery,
  type PostProductToMarketDto,
  type ProductView,
  type PublishProductDto,
  type UpdateProductDto,
} from '@ekum/domain-types';
import { createdAtOrderBy, createdAtRangeFilter } from '../common/audit';
import { PrismaService } from '../core/prisma/prisma.service';
import { ensureSellingEnabled } from '../identity/trade-presence';
import { assertCanPublish, grantPublishCapability } from './publish-capability';
import { CatalogSerializer, productActorInclude } from './catalog.serializer';
import { rememberPublishDefaults } from './publish-policy';
import { resolveProductSku } from './sku';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CatalogSerializer,
  ) {}

  async create(
    companyId: string,
    userId: string,
    dto: CreateProductDto,
  ): Promise<ProductView> {
    const sku = await resolveProductSku(this.prisma, companyId, dto.sku);
    const product = await this.prisma.product.create({
      data: {
        companyId,
        name: dto.name,
        sku,
        description: dto.description ?? null,
        moq: dto.moq ?? null,
        rate: dto.rate ?? null,
        unit: dto.unit ?? null,
        categories: dto.categories,
        images: dto.images,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
      include: productActorInclude,
    });
    await ensureSellingEnabled(this.prisma, companyId);
    return this.serializer.toProductView(product);
  }

  async list(companyId: string, query: ListCatalogQuery = { sort: 'newest' }): Promise<ProductView[]> {
    const createdAt = createdAtRangeFilter(query);
    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: [...createdAtOrderBy(query.sort)],
      include: productActorInclude,
    });
    return products.map((product) => this.serializer.toProductView(product));
  }

  async get(companyId: string, id: string): Promise<ProductView> {
    return this.serializer.toProductView(await this.owned(companyId, id));
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductView> {
    const existing = await this.owned(companyId, id);
    // SKU is immutable once set; fill only when still missing.
    let sku = existing.sku;
    if (!sku) {
      sku = await resolveProductSku(this.prisma, companyId, dto.sku, id);
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku,
        description: dto.description,
        ...(dto.moq !== undefined ? { moq: dto.moq } : {}),
        rate: dto.rate,
        unit: dto.unit,
        categories: dto.categories,
        images: dto.images,
        updatedByUserId: userId,
      },
      include: productActorInclude,
    });
    return this.serializer.toProductView(product);
  }

  async setStatus(
    companyId: string,
    userId: string,
    id: string,
    status: (typeof ProductStatus)[keyof typeof ProductStatus],
  ): Promise<ProductView> {
    await this.owned(companyId, id);
    if (status === ProductStatus.Published) {
      await assertCanPublish(this.prisma, companyId);
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        status,
        updatedByUserId: userId,
        ...(status !== ProductStatus.Published ? { postedToMarketAt: null } : {}),
      },
      include: productActorInclude,
    });
    return this.serializer.toProductView(product);
  }

  /** Restore an archived design to draft. */
  async unarchive(companyId: string, userId: string, id: string): Promise<ProductView> {
    const existing = await this.owned(companyId, id);
    if (existing.status !== ProductStatus.Archived) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Only archived designs can be restored.',
      });
    }
    return this.setStatus(companyId, userId, id, ProductStatus.Draft);
  }

  /**
   * Publishes a design to Explore for the chosen audience (Publish = Explore).
   */
  async publish(
    companyId: string,
    userId: string,
    id: string,
    dto: PublishProductDto,
  ): Promise<ProductView> {
    return this.postToMarket(companyId, userId, id, dto);
  }

  /**
   * Updates Explore audience / rate visibility for a design (and ensures published).
   */
  async postToMarket(
    companyId: string,
    userId: string,
    id: string,
    dto: PostProductToMarketDto,
  ): Promise<ProductView> {
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
    let sku = existing.sku;
    if (!sku) {
      sku = await resolveProductSku(this.prisma, companyId, undefined, id);
    }
    const audienceCompanyIds =
      dto.audience === 'selected' ? [...new Set(dto.companyIds ?? [])] : [];
    const audienceGroupIds =
      dto.audience === 'selected'
        ? [...new Set(dto.groupIds?.length ? dto.groupIds : dto.groupId ? [dto.groupId] : [])]
        : [];
    const allowForward = dto.allowForward !== false;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.Published,
        sku,
        audience: dto.audience,
        rateVisibility: dto.rateVisibility,
        audienceCompanyIds,
        audienceGroupIds,
        allowForward,
        postedToMarketAt: new Date(),
        updatedByUserId: userId,
      },
      include: productActorInclude,
    });
    await rememberPublishDefaults(this.prisma, companyId, {
      rateVisibility: dto.rateVisibility,
      allowForward,
    });
    return this.serializer.toProductView(product);
  }

  /** @deprecated Hide/unpublish clears Explore; kept for older clients. */
  async unpostFromMarket(
    companyId: string,
    userId: string,
    id: string,
  ): Promise<ProductView> {
    return this.setStatus(companyId, userId, id, ProductStatus.Draft);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.owned(companyId, id);
    await this.prisma.product.delete({ where: { id } });
  }

  /** Loads a product only if it belongs to the acting company, else 404. */
  private async owned(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
      include: productActorInclude,
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    return product;
  }
}
