import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  affectedTradeLanesQuerySchema,
  createTradeLaneSchema,
  listTradeLanesQuerySchema,
  updateTradeLaneSchema,
  type AffectedTradeLanesQuery,
  type CreateTradeLaneDto,
  type ListTradeLanesQuery,
  type UpdateTradeLaneDto,
} from '@ekum/domain-types';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TradeLaneService } from './trade-lane.service';

@Controller('trade-lanes')
export class TradeLaneController {
  constructor(private readonly lanes: TradeLaneService) {}

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(listTradeLanesQuerySchema)) query: ListTradeLanesQuery,
  ) {
    return this.lanes.list(companyId, query);
  }

  @Get('affected')
  affected(
    @CurrentCompanyId() companyId: string,
    @Query(new ZodValidationPipe(affectedTradeLanesQuerySchema)) query: AffectedTradeLanesQuery,
  ) {
    return this.lanes.previewAffected(companyId, query.companyId);
  }

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createTradeLaneSchema)) dto: CreateTradeLaneDto,
  ) {
    return this.lanes.create(companyId, dto);
  }

  @Patch(':id')
  update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTradeLaneSchema)) dto: UpdateTradeLaneDto,
  ) {
    return this.lanes.update(companyId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.lanes.remove(companyId, id);
  }
}
