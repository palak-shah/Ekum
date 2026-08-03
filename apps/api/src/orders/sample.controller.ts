import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  createSampleSchema,
  cursorPageQuerySchema,
  sampleDispatchSchema,
  type CreateSampleDto,
  type CursorPageQuery,
  type SampleDispatchDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { SampleService } from './sample.service';

@Controller({ path: 'samples', version: '1' })
export class SampleController {
  constructor(private readonly samples: SampleService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createSampleSchema)) dto: CreateSampleDto,
  ) {
    return this.samples.create(companyId, dto);
  }

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(cursorPageQuerySchema)) query: CursorPageQuery,
  ) {
    return this.samples.list(companyId, query);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.samples.get(companyId, id);
  }

  @Post(':id/dispatch')
  @HttpCode(200)
  dispatch(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sampleDispatchSchema)) dto: SampleDispatchDto,
  ) {
    return this.samples.dispatch(companyId, id, dto);
  }

  @Post(':id/receive')
  @HttpCode(200)
  receive(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.samples.receive(companyId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.samples.decline(companyId, id);
  }

  @Post(':id/convert')
  @HttpCode(200)
  convert(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.samples.convert(companyId, id);
  }
}
