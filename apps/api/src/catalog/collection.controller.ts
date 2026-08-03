import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  CollectionStatus,
  createCollectionSchema,
  publishCollectionSchema,
  setCollectionProductsSchema,
  updateCollectionSchema,
  type CreateCollectionDto,
  type PublishCollectionDto,
  type SetCollectionProductsDto,
  type UpdateCollectionDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CollectionService } from './collection.service';

@Controller({ path: 'collections', version: '1' })
export class CollectionController {
  constructor(private readonly collections: CollectionService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createCollectionSchema)) dto: CreateCollectionDto,
  ) {
    return this.collections.create(companyId, dto);
  }

  @Get()
  list(@CurrentCompanyId() companyId: string) {
    return this.collections.list(companyId);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.collections.get(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCollectionSchema)) dto: UpdateCollectionDto,
  ) {
    return this.collections.update(companyId, id, dto);
  }

  @Put(':id/products')
  setProducts(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setCollectionProductsSchema)) dto: SetCollectionProductsDto,
  ) {
    return this.collections.setProducts(companyId, id, dto.productIds);
  }

  @Post(':id/publish')
  publish(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishCollectionSchema)) dto: PublishCollectionDto,
  ) {
    return this.collections.publish(companyId, id, dto);
  }

  @Post(':id/archive')
  archive(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.collections.setStatus(companyId, id, CollectionStatus.Archived);
  }

  @Post(':id/unpublish')
  unpublish(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.collections.setStatus(companyId, id, CollectionStatus.Draft);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.collections.remove(companyId, id);
  }
}
