import { Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  listStarredMessagesQuerySchema,
  type ListStarredMessagesQuery,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { MessageService } from './message.service';

@RequirePermission('chats')
@Controller({ path: 'messages', version: '1' })
export class MessagesController {
  constructor(private readonly messages: MessageService) {}

  @Get('starred')
  listStarred(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(listStarredMessagesQuerySchema))
    query: ListStarredMessagesQuery,
  ) {
    return this.messages.listStarred(user, query);
  }

  @Post(':id/star')
  @HttpCode(200)
  star(@CurrentUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.messages.star(user, id);
  }

  @Delete(':id/star')
  @HttpCode(200)
  unstar(@CurrentUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.messages.unstar(user, id);
  }
}
