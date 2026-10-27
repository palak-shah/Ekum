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
  archiveCollectionSchema,
  createCollectionSchema,
  curateCheckSchema,
  draftCollectionSchema,
  listCatalogQuerySchema,
  otherPackCountsSchema,
  publishCollectionMembersSchema,
  publishCollectionSchema,
  setCollectionProductsSchema,
  updateCollectionSchema,
  type ArchiveCollectionDto,
  type CreateCollectionDto,
  type CurateCheckDto,
  type DraftCollectionDto,
  type ListCatalogQuery,
  type OtherPackCountsDto,
  type PublishCollectionDto,
  type PublishCollectionMembersDto,
  type SetCollectionProductsDto,
  type UpdateCollectionDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { CollectionService } from './collection.service';

@Controller({ path: 'collections', version: '1' })
export class CollectionController {
  constructor(private readonly collections: CollectionService) {}

  @Post()
  @RequirePermission('uploads')
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
  @RequirePermission('uploads')
  update(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCollectionSchema)) dto: UpdateCollectionDto,
  ) {
    return this.collections.update(companyId, user.userId, id, dto);
  }

  @Post('curate-check')
  @RequirePermission('uploads')
  curateCheck(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(curateCheckSchema)) dto: CurateCheckDto,
  ) {
    return this.collections.checkCurateProducts(companyId, dto.productIds);
  }

  @Post(':id/other-pack-counts')
  @RequirePermission('uploads')
  otherPackCounts(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(otherPackCountsSchema)) dto: OtherPackCountsDto,
  ) {
    return this.collections.otherPackCounts(companyId, id, dto.productIds);
  }

  @Put(':id/products')
  @RequirePermission('uploads')
  setProducts(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setCollectionProductsSchema)) dto: SetCollectionProductsDto,
  ) {
    return this.collections.setProducts(companyId, user.userId, id, dto.productIds);
  }

  @Post(':id/publish-members')
  @RequirePermission('uploads')
  publishMembers(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishCollectionMembersSchema))
    dto: PublishCollectionMembersDto,
  ) {
    return this.collections.publishMembers(companyId, user.userId, id, dto.productIds);
  }

  @Post(':id/publish')
  @RequirePermission('uploads')
  publish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishCollectionSchema)) dto: PublishCollectionDto,
  ) {
    return this.collections.publish(companyId, user.userId, id, dto);
  }

  @Post(':id/ready')
  @RequirePermission('uploads')
  ready(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.markReady(companyId, user.userId, id);
  }

  @Post(':id/unready')
  @RequirePermission('uploads')
  unready(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.unready(companyId, user.userId, id);
  }

  @Post(':id/archive')
  @RequirePermission('uploads')
  archive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(archiveCollectionSchema)) dto: ArchiveCollectionDto,
  ) {
    return this.collections.setStatus(
      companyId,
      user.userId,
      id,
      CollectionStatus.Archived,
      { alsoArchiveDesigns: dto.alsoArchiveDesigns },
    );
  }

  @Post(':id/unarchive')
  @RequirePermission('uploads')
  unarchive(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.unarchive(companyId, user.userId, id);
  }

  @Post(':id/unpublish')
  @RequirePermission('uploads')
  unpublish(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(draftCollectionSchema)) dto: DraftCollectionDto,
  ) {
    return this.collections.setStatus(companyId, user.userId, id, CollectionStatus.Draft, {
      alsoDraftDesigns: dto.alsoDraftDesigns,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('uploads')
  remove(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.collections.remove(companyId, user.userId, id);
  }
}
