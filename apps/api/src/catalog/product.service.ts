import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductStatus,
  PublishAudience,
  RateVisibility,
  type CreateProductDto,
  type PostProductToMarketDto,
  type ProductView,
  type PublishProductDto,
  type UpdateProductDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { ensureSellingEnabled } from '../identity/trade-presence';
import { assertCanPublish, grantPublishCapability } from './publish-capability';
import { CatalogSerializer } from './catalog.serializer';
import { resolveProductSku } from './sku';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CatalogSerializer,
  ) {}

  async create(companyId: string, dto: CreateProductDto): Promise<ProductView> {
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
      },
    });
    await ensureSellingEnabled(this.prisma, companyId);
    return this.serializer.toProductView(product);
  }

  async list(companyId: string): Promise<ProductView[]> {
    const products = await this.prisma.product.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
    return products.map((product) => this.serializer.toProductView(product));
  }

  async get(companyId: string, id: string): Promise<ProductView> {
    return this.serializer.toProductView(await this.owned(companyId, id));
  }

  async update(companyId: string, id: string, dto: UpdateProductDto): Promise<ProductView> {
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
      },
    });
    return this.serializer.toProductView(product);
  }

  async setStatus(
    companyId: string,
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
        ...(status !== ProductStatus.Published ? { postedToMarketAt: null } : {}),
      },
    });
    return this.serializer.toProductView(product);
  }

  /**
   * Publishes a design to the shop and Explore (discoverable without a collection).
   * Audience defaults to connections until updated via post-to-market.
   */
  async publish(
    companyId: string,
    id: string,
    dto: PublishProductDto,
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
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.Published,
        sku,
        postedToMarketAt: existing.postedToMarketAt ?? new Date(),
        audience: existing.audience || PublishAudience.Connections,
        rateVisibility: existing.rateVisibility || RateVisibility.OnRequest,
      },
    });
    return this.serializer.toProductView(product);
  }

  /**
   * Updates Explore audience / rate visibility for a design (and ensures published).
   */
  async postToMarket(
    companyId: string,
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
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.Published,
        sku,
        audience: dto.audience,
        rateVisibility: dto.rateVisibility,
        audienceCompanyIds,
        postedToMarketAt: new Date(),
      },
    });
    return this.serializer.toProductView(product);
  }

  async unpostFromMarket(companyId: string, id: string): Promise<ProductView> {
    await this.owned(companyId, id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { postedToMarketAt: null },
    });
    return this.serializer.toProductView(product);
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.owned(companyId, id);
    await this.prisma.product.delete({ where: { id } });
  }

  /** Loads a product only if it belongs to the acting company, else 404. */
  private async owned(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, companyId } });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    return product;
  }
}
