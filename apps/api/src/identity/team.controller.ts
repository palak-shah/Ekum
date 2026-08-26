import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createTeamInviteSchema,
  updateTeamMemberSchema,
  type CreateTeamInviteDto,
  type UpdateTeamMemberDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/require-permission';
import type { AuthPrincipal } from '../auth/auth.types';
import { TeamService } from './team.service';

@Controller({ path: 'team', version: '1' })
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get('members')
  listMembers(@CurrentCompanyId() companyId: string) {
    return this.team.listMembers(companyId);
  }

  @Post('invites')
  @RequirePermission('team')
  createInvite(
    @CurrentUser() actor: AuthPrincipal,
    @CurrentCompanyId() companyId: string,
    @Body(new ZodValidationPipe(createTeamInviteSchema)) dto: CreateTeamInviteDto,
  ) {
    return this.team.createInvite(actor, companyId, dto);
  }

  @Public()
  @Get('invites/:token')
  resolveInvite(@Param('token') token: string) {
    return this.team.resolveInvite(token);
  }

  @Post('invites/:token/join')
  joinInvite(@CurrentUser() actor: AuthPrincipal, @Param('token') token: string) {
    return this.team.joinInvite(actor, token);
  }

  @Patch('members/:userId')
  @RequirePermission('team')
  updateMember(
    @CurrentUser() actor: AuthPrincipal,
    @CurrentCompanyId() companyId: string,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateTeamMemberSchema)) dto: UpdateTeamMemberDto,
  ) {
    return this.team.updateMember(actor, companyId, userId, dto);
  }

  @Delete('members/:userId')
  @RequirePermission('team')
  removeMember(
    @CurrentUser() actor: AuthPrincipal,
    @CurrentCompanyId() companyId: string,
    @Param('userId') userId: string,
  ) {
    return this.team.removeMember(actor, companyId, userId);
  }
}
