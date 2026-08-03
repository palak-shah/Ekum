import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

/**
 * Referral / vouch links. Depends on AccessModule for the shared company
 * serializer; the actual access request is created through the Access domain
 * with `referredBy` set from the resolved referral.
 */
@Module({
  imports: [AccessModule],
  controllers: [ReferralController],
  providers: [ReferralService],
})
export class ReferralModule {}
