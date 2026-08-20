import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

/**
 * Referral / vouch links. Open invites redeem into access requests to the
 * referrer; targeted vouch attributes access requests via `referredBy`.
 */
@Module({
  imports: [AccessModule],
  controllers: [ReferralController],
  providers: [ReferralService],
})
export class ReferralModule {}
