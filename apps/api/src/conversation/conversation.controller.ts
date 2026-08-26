import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  addParticipantsSchema,
  createGroupThreadSchema,
  listThreadMessagesQuerySchema,
  listThreadsQuerySchema,
  sendMessageSchema,
  setAlertLevelSchema,
  setThreadPinnedSchema,
  startDirectThreadSchema,
  type AddParticipantsDto,
  type CreateGroupThreadDto,
  type ListThreadMessagesQuery,
  type ListThreadsQuery,
  type SendMessageDto,
  type SetAlertLevelDto,
  type SetThreadPinnedDto,
  type StartDirectThreadDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RequirePermission } from '../auth/require-permission';
import { ThreadService } from './thread.service';
import { MessageService } from './message.service';

@RequirePermission('chats')
@Controller({ path: 'threads', version: '1' })
export class ConversationController {
  constructor(
    private readonly threads: ThreadService,
    private readonly messages: MessageService,
  ) {}

  @Post('direct')
  startDirect(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(startDirectThreadSchema)) dto: StartDirectThreadDto,
  ) {
    return this.threads.startDirect(companyId, user.role, dto, user.userId);
  }

  @Post('group')
  createGroup(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(createGroupThreadSchema)) dto: CreateGroupThreadDto,
  ) {
    return this.threads.createGroup(companyId, user.role, dto, user.userId);
  }

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(listThreadsQuerySchema)) query: ListThreadsQuery,
  ) {
    return this.threads.list(companyId, user.role, query, user.userId);
  }

  @Post('read-all')
  @HttpCode(200)
  markAllRead(@CurrentCompanyId() companyId: string) {
    return this.threads.markAllRead(companyId);
  }

  @Get('unread-count')
  unreadCount(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
  ) {
    return this.threads.unreadTotal(companyId, user.role);
  }

  @Get(':id')
  get(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.get(companyId, user.role, id, user.userId);
  }

  @Get(':id/messages')
  listMessages(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(listThreadMessagesQuerySchema)) query: ListThreadMessagesQuery,
  ) {
    return this.messages.list(user, id, query);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.messages.send(user, id, dto);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.markRead(companyId, user.role, id, user.userId);
  }

  @Patch(':id/alert')
  setAlert(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setAlertLevelSchema)) dto: SetAlertLevelDto,
  ) {
    return this.threads.setAlertLevel(companyId, user.role, id, dto, user.userId);
  }

  @Patch(':id/pin')
  setPin(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setThreadPinnedSchema)) dto: SetThreadPinnedDto,
  ) {
    return this.threads.setPinned(companyId, user.role, id, dto, user.userId);
  }

  @Post(':id/accept')
  @HttpCode(200)
  accept(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.accept(companyId, user.role, id, user.userId);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.decline(companyId, user.role, id);
  }

  @Post(':id/leave')
  @HttpCode(200)
  leave(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.leave(companyId, user.role, id);
  }

  @Post(':id/participants')
  addParticipants(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addParticipantsSchema)) dto: AddParticipantsDto,
  ) {
    return this.threads.addParticipants(companyId, user.role, id, dto, user.userId);
  }
}
