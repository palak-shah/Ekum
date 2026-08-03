import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  approveReturnSchema,
  createReturnSchema,
  escalateReturnSchema,
  type ApproveReturnDto,
  type CreateReturnDto,
  type EscalateReturnDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { ReturnService } from './return.service';

@Controller({ path: 'returns', version: '1' })
export class ReturnController {
  constructor(private readonly returns: ReturnService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createReturnSchema)) dto: CreateReturnDto,
  ) {
    return this.returns.create(companyId, dto);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.returns.get(companyId, id);
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveReturnSchema)) dto: ApproveReturnDto,
  ) {
    return this.returns.approve(companyId, id, dto);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.returns.decline(companyId, id);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  resolve(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.returns.resolve(companyId, id);
  }

  @Post(':id/escalate')
  @HttpCode(200)
  escalate(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(escalateReturnSchema)) dto: EscalateReturnDto,
  ) {
    return this.returns.escalate(companyId, id, dto);
  }
}
