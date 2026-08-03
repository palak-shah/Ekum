import { Controller, Get, Param, Query } from '@nestjs/common';
import { exploreQuerySchema, type ExploreQuery } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { ExploreService } from './explore.service';

@Controller({ path: 'explore', version: '1' })
export class ExploreController {
  constructor(private readonly explore: ExploreService) {}

  @Get('collections')
  collections(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(exploreQuerySchema)) query: ExploreQuery,
  ) {
    return this.explore.collections(companyId, query);
  }

  @Get('collections/:id')
  collectionDetail(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.explore.collectionDetail(companyId, id);
  }

  @Get('companies')
  companies(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(exploreQuerySchema)) query: ExploreQuery,
  ) {
    return this.explore.companies(companyId, query);
  }
}
