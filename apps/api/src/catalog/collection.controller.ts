import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CollectionStatus,
  createCollectionSchema,
  listCatalogQuerySchema,
  publishCollectionSchema,
  setCollectionProductsSchema,
  updateCollectionSchema,
  type CreateCollectionDto,
  type ListCatalogQuery,
  type PublishCollectionDto,
  type SetCollectionProductsDto,
  type UpdateCollectionDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { CollectionService } from './collection.service';

@Controller({ path: 'collections', version: '1' })
export class CollectionController {
  constructor(private readonly collections: CollectionService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createCollectionSchema)) dto: CreateCollectionDto,
  ) {
    return this.collections.create(companyId, user.userId, dto);
  }

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(listCatalogQuerySchema)) query: ListCatalogQuery,
  ) {
    return this.collections.list(companyId, query);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.collections.get(companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCollectionSchema)) dto: UpdateCollectionDto,
  ) {
    return this.collections.update(companyId, user.userId, id, dto);
  }

  @Put(':id/products')
  setProducts(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setCollectionProductsSchema)) dto: SetCollectionProductsDto,
  ) {
    return this.collections.setProducts(companyId, user.userId, id, dto.productIds);
  }

  @Post(':id/publish')
  publish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishCollectionSchema)) dto: PublishCollectionDto,
  ) {
    return this.collections.publish(companyId, user.userId, id, dto);
  }

  @Post(':id/ready')
  ready(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.markReady(companyId, user.userId, id);
  }

  @Post(':id/unready')
  unready(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.unready(companyId, user.userId, id);
  }

  @Post(':id/archive')
  archive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.setStatus(
      companyId,
      user.userId,
      id,
      CollectionStatus.Archived,
    );
  }

  @Post(':id/unarchive')
  unarchive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.unarchive(companyId, user.userId, id);
  }

  @Post(':id/unpublish')
  unpublish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.setStatus(companyId, user.userId, id, CollectionStatus.Draft);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.collections.remove(companyId, id);
  }
}
