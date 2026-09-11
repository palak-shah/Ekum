import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReferralSchema, type CreateReferralDto } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import type { Env } from '../core/config/config.schema';
import { referralOgHtml } from './referral-og';
import { ReferralService } from './referral.service';

@Controller({ path: 'referrals', version: '1' })
export class ReferralController {
  constructor(
    private readonly referrals: ReferralService,
    private readonly config: ConfigService<Env, true>,
  ) {}

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

  @Public()
  @Get(':token/card')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async card(@Param('token') token: string) {
    const view = await this.referrals.resolve(token);
    const webOrigin = this.config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())[0];
    const mediaBase = this.config.get('PUBLIC_MEDIA_BASE_URL', { infer: true });
    return referralOgHtml({
      view,
      pageUrl: `${webOrigin}/r/${view.token}`,
      mediaBase,
      fallbackImageUrl: `${webOrigin}/brand/app-icon-512.png`,
    });
  }

  /** Public summary for invite landing / OG — redeem still requires auth. */
  @Public()
  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.referrals.resolve(token);
  }

  /** Open invite → pending access request to referrer. Targeted vouch is not redeemable. */
  @Post(':token/redeem')
  redeem(@CurrentCompanyId() companyId: string, @Param('token') token: string) {
    return this.referrals.redeem(companyId, token);
  }
}
