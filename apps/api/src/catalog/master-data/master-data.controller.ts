import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  createCompanyCustomTagSchema,
  type CreateCompanyCustomTagDto,
  type MasterOptionKind,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../../auth/decorators/current-company.decorator';
import { RequirePermission } from '../../auth/require-permission';
import { MasterDataService } from './master-data.service';

@Controller({ path: 'catalog/master-categories', version: '1' })
export class MasterCategoriesController {
  constructor(private readonly master: MasterDataService) {}

  @Get()
  list() {
    return this.master.listCategories(true);
  }
}

@Controller({ path: 'catalog/master-taxonomy', version: '1' })
export class MasterTaxonomyController {
  constructor(private readonly master: MasterDataService) {}

  @Get()
  async get(
    @CurrentCompanyId() companyId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    if (!categoryId?.trim()) {
      return { categories: await this.master.listCategories(true) };
    }
    return this.master.taxonomyForCategory(categoryId.trim(), companyId);
  }
}

@Controller({ path: 'catalog/custom-tags', version: '1' })
export class CompanyCustomTagController {
  constructor(private readonly master: MasterDataService) {}

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @Query('kind') kind?: MasterOptionKind,
  ) {
    return this.master.listCustomTags(companyId, kind);
  }

  @Post()
  @RequirePermission('uploads')
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createCompanyCustomTagSchema))
    dto: CreateCompanyCustomTagDto,
  ) {
    return this.master.createCustomTag(companyId, dto);
  }
}
