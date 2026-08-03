import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  createComplaintSchema,
  respondComplaintSchema,
  type CreateComplaintDto,
  type RespondComplaintDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { ComplaintService } from './complaint.service';

@Controller({ path: 'complaints', version: '1' })
export class ComplaintController {
  constructor(private readonly complaints: ComplaintService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createComplaintSchema)) dto: CreateComplaintDto,
  ) {
    return this.complaints.create(companyId, dto);
  }

  @Get(':id')
  get(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.complaints.get(companyId, id);
  }

  @Post(':id/respond')
  @HttpCode(200)
  respond(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(respondComplaintSchema)) dto: RespondComplaintDto,
  ) {
    return this.complaints.respond(companyId, id, dto);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  resolve(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.complaints.resolve(companyId, id);
  }
}
