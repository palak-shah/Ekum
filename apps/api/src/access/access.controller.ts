import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createAccessRequestSchema, type CreateAccessRequestDto } from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { AccessService } from './access.service';

@Controller({ path: 'access-requests', version: '1' })
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Post()
  create(
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createAccessRequestSchema)) dto: CreateAccessRequestDto,
  ) {
    return this.access.createRequest(companyId, dto);
  }

  @Get('incoming')
  incoming(@CurrentCompanyId() companyId: string) {
    return this.access.listIncoming(companyId);
  }

  @Get('outgoing')
  outgoing(@CurrentCompanyId() companyId: string) {
    return this.access.listOutgoing(companyId);
  }

  @Post(':id/approve')
  approve(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.access.approve(companyId, id, actor);
  }

  @Post(':id/decline')
  decline(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.access.decline(companyId, id, actor);
  }
}
