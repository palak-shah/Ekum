import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  checkRelistAccessSchema,
  createRelistRequestSchema,
  type CheckRelistAccessDto,
  type CreateRelistRequestDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { RelistRequestService } from './relist-request.service';

@Controller({ path: 'relist-requests', version: '1' })
export class RelistRequestController {
  constructor(private readonly requests: RelistRequestService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createRelistRequestSchema))
    dto: CreateRelistRequestDto,
  ) {
    return this.requests.create(companyId, dto);
  }

  @Post('access')
  checkAccess(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(checkRelistAccessSchema))
    dto: CheckRelistAccessDto,
  ) {
    return this.requests.checkAccess(companyId, dto);
  }

  @Get('outgoing')
  outgoing(@CurrentCompanyId() companyId: string) {
    return this.requests.listOutgoingPending(companyId);
  }

  @Get('grants/mine')
  myGrants(@CurrentCompanyId() companyId: string) {
    return this.requests.listMyGrants(companyId);
  }

  @Post(':id/allow')
  allow(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.requests.allow(companyId, id);
  }

  @Post(':id/deny')
  deny(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.requests.deny(companyId, id);
  }
}

@Controller({ path: 'products', version: '1' })
export class ProductRelistGrantController {
  constructor(private readonly requests: RelistRequestService) {}

  @Get(':id/relist-grants')
  listGrants(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.requests.listGrantsForProduct(companyId, id);
  }

  @Delete(':id/relist-grants/:companyId')
  revoke(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Param('companyId') granteeId: string,
  ) {
    return this.requests.revokeGrant(companyId, id, granteeId);
  }
}
