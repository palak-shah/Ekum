import { Controller, Get, Query } from '@nestjs/common';
import { searchQuerySchema, type SearchQuery } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { SearchService } from './search.service';

@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  run(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQuery,
  ) {
    return this.search.search(companyId, query);
  }
}
