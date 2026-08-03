import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyDto,
  type UpdateCompanyDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { CompanyService } from './company.service';

@Controller({ path: 'companies', version: '1' })
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}

  @Post()
  create(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createCompanySchema)) dto: CreateCompanyDto,
  ) {
    return this.companies.create(user, dto);
  }

  @Get('me')
  me(@CurrentCompanyId() companyId: string) {
    return this.companies.getOwnProfile(companyId);
  }

  @Patch('me')
  update(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(updateCompanySchema)) dto: UpdateCompanyDto,
  ) {
    return this.companies.updateOwnProfile(companyId, dto);
  }

  @Get(':id')
  profile(@CurrentCompanyId() viewerCompanyId: string, @Param('id') id: string) {
    return this.companies.getPublicProfile(viewerCompanyId, id);
  }

  @Get(':id/contact')
  contact(@CurrentCompanyId() viewerCompanyId: string, @Param('id') id: string) {
    return this.companies.getContactPoints(viewerCompanyId, id);
  }
}
