import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

/**
 * Identity & Onboarding. Owns Company profiles and memberships. Depends on Auth
 * (to reissue tokens on onboarding) and Access (visibility + contact-safe
 * serialization).
 */
@Module({
  imports: [AuthModule, AccessModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class IdentityModule {}
