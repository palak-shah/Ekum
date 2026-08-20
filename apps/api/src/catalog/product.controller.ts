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
import { ProductService } from './product.service';

@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
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
  update(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto,
  ) {
    return this.products.update(companyId, user.userId, id, dto);
  }

  @Post(':id/publish')
  publish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishProductSchema)) dto: PublishProductDto,
  ) {
    return this.products.publish(companyId, user.userId, id, dto);
  }

  @Post(':id/post-to-market')
  postToMarket(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(postProductToMarketSchema)) dto: PostProductToMarketDto,
  ) {
    return this.products.postToMarket(companyId, user.userId, id, dto);
  }

  @Post(':id/unpost-from-market')
  unpostFromMarket(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.unpostFromMarket(companyId, user.userId, id);
  }

  @Post(':id/archive')
  archive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.setStatus(companyId, user.userId, id, ProductStatus.Archived);
  }

  @Post(':id/unarchive')
  unarchive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.unarchive(companyId, user.userId, id);
  }

  @Post(':id/unpublish')
  unpublish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.products.setStatus(companyId, user.userId, id, ProductStatus.Draft);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.remove(companyId, id);
  }
}
