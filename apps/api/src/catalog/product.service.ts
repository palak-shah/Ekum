import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductStatus,
  type CreateProductDto,
  type ProductView,
  type UpdateProductDto,
} from '@ekum/domain-types';
import { PrismaService } from '../core/prisma/prisma.service';
import { CatalogSerializer } from './catalog.serializer';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: CatalogSerializer,
  ) {}

  async create(companyId: string, dto: CreateProductDto): Promise<ProductView> {
    const product = await this.prisma.product.create({
      data: {
        companyId,
        name: dto.name,
        sku: dto.sku ?? null,
        description: dto.description ?? null,
        rate: dto.rate ?? null,
        unit: dto.unit ?? null,
        categories: dto.categories,
        images: dto.images,
      },
    });
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
    await this.owned(companyId, id);
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
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
    const product = await this.prisma.product.update({ where: { id }, data: { status } });
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
