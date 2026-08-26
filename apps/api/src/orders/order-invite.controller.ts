import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { BuyForBuyerService } from './buy-for-buyer.service';

@Controller({ path: 'order-invites', version: '1' })
export class OrderInviteController {
  constructor(private readonly forBuyer: BuyForBuyerService) {}

  @Public()
  @Get(':token')
  get(@Param('token') token: string) {
    return this.forBuyer.getInvite(token);
  }

  @Post(':token/accept')
  @HttpCode(200)
  accept(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('token') token: string,
  ) {
    return this.forBuyer.acceptInvite(companyId, user.userId, token);
  }

  @Post(':token/decline')
  @HttpCode(200)
  decline(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('token') token: string,
  ) {
    return this.forBuyer.declineInvite(companyId, user.userId, token);
  }
}
