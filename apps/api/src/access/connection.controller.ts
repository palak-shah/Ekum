import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { ConnectionService } from './connection.service';
import { AccessService } from './access.service';

@Controller({ path: 'connections', version: '1' })
export class ConnectionController {
  constructor(
    private readonly connections: ConnectionService,
    private readonly access: AccessService,
  ) {}

  @Get()
  list(@CurrentCompanyId() companyId: string) {
    return this.connections.list(companyId);
  }

  @Post('company/:companyId/block')
  blockCompany(
    @CurrentCompanyId() companyId: string,
    @Param('companyId') counterpartId: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.access.blockCounterpart(companyId, counterpartId, actor);
  }

  @Post(':id/pause')
  pause(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.connections.applyOwnerAction(companyId, id, 'pause', actor);
  }

  @Post(':id/resume')
  resume(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.connections.applyOwnerAction(companyId, id, 'resume', actor);
  }

  @Post(':id/block')
  block(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.connections.applyOwnerAction(companyId, id, 'block', actor);
  }

  @Post(':id/unblock')
  unblock(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthPrincipal,
  ) {
    return this.connections.applyOwnerAction(companyId, id, 'unblock', actor);
  }
}
