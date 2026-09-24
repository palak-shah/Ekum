import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { ThreadService } from './thread.service';

@Controller({ path: 'group-invites', version: '1' })
export class GroupInviteController {
  constructor(private readonly threads: ThreadService) {}

  @Public()
  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.threads.resolveGroupInvite(token);
  }

  @Post(':token/join')
  @HttpCode(200)
  @RequirePermission('chats')
  join(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('token') token: string,
  ) {
    return this.threads.joinGroupByToken(companyId, user.role, token, user.userId);
  }
}
