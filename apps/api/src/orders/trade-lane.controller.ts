import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  listTradeLanesQuerySchema,
  updateTradeLaneSchema,
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

  @Patch(':id')
  update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTradeLaneSchema)) dto: UpdateTradeLaneDto,
  ) {
    return this.lanes.update(companyId, id, dto);
  }
}
