import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ProductStatus,
  createProductSchema,
  listCatalogQuerySchema,
  postProductToMarketSchema,
  publishProductSchema,
  updateProductSchema,
  type CreateProductDto,
  type ListCatalogQuery,
  type PostProductToMarketDto,
  type PublishProductDto,
  type UpdateProductDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { AbsolutizeProductImagesPipe } from '../media/absolutize-product-images.pipe';
import { ProductService } from './product.service';

@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Post()
  @RequirePermission('uploads')
  create(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(AbsolutizeProductImagesPipe, new ZodValidationPipe(createProductSchema))
    dto: CreateProductDto,
  ) {
    return this.products.create(companyId, user.userId, dto);
  }

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(listCatalogQuerySchema)) query: ListCatalogQuery,
  ) {
    return this.products.list(companyId, query);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.get(companyId, id);
  }

  @Patch(':id')
  @RequirePermission('uploads')
  update(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(AbsolutizeProductImagesPipe, new ZodValidationPipe(updateProductSchema))
    dto: UpdateProductDto,
  ) {
    return this.products.update(companyId, user.userId, id, dto);
  }

  @Post(':id/publish')
  @RequirePermission('uploads')
  publish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishProductSchema)) dto: PublishProductDto,
  ) {
    return this.products.publish(companyId, user.userId, id, dto);
  }

  @Post(':id/post-to-market')
  @RequirePermission('uploads')
  postToMarket(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(postProductToMarketSchema)) dto: PostProductToMarketDto,
  ) {
    return this.products.postToMarket(companyId, user.userId, id, dto);
  }

  @Post(':id/unpost-from-market')
  @RequirePermission('uploads')
  unpostFromMarket(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.unpostFromMarket(companyId, user.userId, id);
  }

  @Post(':id/archive')
  @RequirePermission('uploads')
  archive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.setStatus(companyId, user.userId, id, ProductStatus.Archived);
  }

  @Post(':id/unarchive')
  @RequirePermission('uploads')
  unarchive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.unarchive(companyId, user.userId, id);
  }

  @Post(':id/unpublish')
  @RequirePermission('uploads')
  unpublish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.setStatus(companyId, user.userId, id, ProductStatus.Draft);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('uploads')
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.remove(companyId, id);
  }
}
