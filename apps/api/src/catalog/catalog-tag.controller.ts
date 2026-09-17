import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  createCatalogTagSchema,
  type CreateCatalogTagDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { RequirePermission } from '../auth/require-permission';
import { CatalogTagService } from './catalog-tag.service';

@Controller({ path: 'catalog/tags', version: '1' })
export class CatalogTagController {
  constructor(private readonly tags: CatalogTagService) {}

  @Get()
  list(@CurrentCompanyId() companyId: string) {
    return this.tags.list(companyId);
  }

  @Post()
  @RequirePermission('uploads')
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createCatalogTagSchema)) dto: CreateCatalogTagDto,
  ) {
    return this.tags.create(companyId, dto);
  }
}
