import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createReferralSchema, type CreateReferralDto } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { ReferralService } from './referral.service';

@Controller({ path: 'referrals', version: '1' })
export class ReferralController {
  constructor(private readonly referrals: ReferralService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createReferralSchema)) dto: CreateReferralDto,
  ) {
    return this.referrals.create(companyId, dto);
  }

  @Get()
  list(@CurrentCompanyId() companyId: string) {
    return this.referrals.list(companyId);
  }

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.referrals.resolve(token);
  }
}
