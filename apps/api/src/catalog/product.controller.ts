import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  ProductStatus,
  createProductSchema,
  updateProductSchema,
  type CreateProductDto,
  type UpdateProductDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { ProductService } from './product.service';

@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
  ) {
    return this.products.create(companyId, dto);
  }

  @Get()
  list(@CurrentCompanyId() companyId: string) {
    return this.products.list(companyId);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.get(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto,
  ) {
    return this.products.update(companyId, id, dto);
  }

  @Post(':id/publish')
  publish(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.setStatus(companyId, id, ProductStatus.Published);
  }

  @Post(':id/archive')
  archive(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.setStatus(companyId, id, ProductStatus.Archived);
  }

  @Post(':id/unpublish')
  unpublish(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.setStatus(companyId, id, ProductStatus.Draft);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.products.remove(companyId, id);
  }
}
