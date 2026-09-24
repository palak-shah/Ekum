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
  editMessageSchema,
  listCrossChatFindQuerySchema,
  listThreadMessagesQuerySchema,
  listThreadsQuerySchema,
  sendMessageSchema,
  inboxThreadActionSchema,
  setAlertLevelSchema,
  setThreadMembersSchema,
  reactMessageSchema,
  setPinnedMessageSchema,
  setThreadPinnedSchema,
  setThreadTypingSchema,
  startDirectThreadSchema,
  updateGroupProfileSchema,
  type AddParticipantsDto,
  type CreateGroupThreadDto,
  type InboxThreadActionDto,
  type EditMessageDto,
  type ListCrossChatFindQuery,
  type ListThreadMessagesQuery,
  type ListThreadsQuery,
  type SendMessageDto,
  type SetAlertLevelDto,
  type SetThreadMembersDto,
  type ReactMessageDto,
  type SetPinnedMessageDto,
  type SetThreadPinnedDto,
  type SetThreadTypingDto,
  type StartDirectThreadDto,
  type UpdateGroupProfileDto,
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

  /** Our shop only — Archive / Clear / Delete / Unread / Unarchive. Before `:id`. */
  @Post('inbox-actions')
  @HttpCode(200)
  inboxActions(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(inboxThreadActionSchema)) dto: InboxThreadActionDto,
  ) {
    return this.threads.applyInboxActions(companyId, user.role, dto, user.userId);
  }

  @Get('unread-count')
  unreadCount(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
  ) {
    return this.threads.unreadTotal(companyId, user.role, user.userId);
  }

  /** Cross-chat find (Photos / Documents / Collections / Designs). Before `:id`. */
  @Get('messages/find')
  findMessages(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(listCrossChatFindQuerySchema)) query: ListCrossChatFindQuery,
  ) {
    return this.messages.listFind(user, query);
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
    @CurrentCompanyId() _companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(listThreadMessagesQuerySchema)) query: ListThreadMessagesQuery,
  ) {
    return this.messages.list(user, id, query);
  }

  @Post(':id/messages')
  send(
    @CurrentCompanyId() _companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.messages.send(user, id, dto);
  }

  @Patch(':id/messages/:messageId')
  editMessage(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body(new ZodValidationPipe(editMessageSchema)) dto: EditMessageDto,
  ) {
    return this.messages.edit(user, id, messageId, dto.body);
  }

  @Post(':id/messages/:messageId/hide')
  @HttpCode(200)
  hideMessage(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messages.hide(user, id, messageId);
  }

  @Post(':id/messages/:messageId/delete')
  @HttpCode(200)
  deleteMessage(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messages.deleteForEveryone(user, id, messageId);
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

  @Post(':id/typing')
  @HttpCode(200)
  setTyping(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setThreadTypingSchema)) dto: SetThreadTypingDto,
  ) {
    return this.threads.setTyping(companyId, user.role, id, dto, user.userId);
  }

  @Patch(':id/pinned-message')
  setPinnedMessage(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setPinnedMessageSchema)) dto: SetPinnedMessageDto,
  ) {
    return this.threads.setPinnedMessage(companyId, user.role, id, dto, user.userId);
  }

  @Patch(':id/group-profile')
  updateGroupProfile(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGroupProfileSchema)) dto: UpdateGroupProfileDto,
  ) {
    return this.threads.updateGroupProfile(companyId, user.role, id, dto, user.userId);
  }

  @Post(':id/messages/:messageId/react')
  @HttpCode(200)
  react(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body(new ZodValidationPipe(reactMessageSchema)) dto: ReactMessageDto,
  ) {
    return this.messages.react(user, id, messageId, dto);
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
    return this.threads.accept(companyId, user.role, id, user);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.decline(companyId, user.role, id, user.userId);
  }

  @Post(':id/leave')
  @HttpCode(200)
  leave(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.leave(companyId, user.role, id, user.userId);
  }

  @Post(':id/archive')
  @HttpCode(200)
  archiveGroup(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.archiveGroup(companyId, user.role, id, user.userId);
  }

  @Post(':id/members')
  addMembers(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setThreadMembersSchema)) dto: SetThreadMembersDto,
  ) {
    return this.threads.addMembers(companyId, user.role, id, dto, user.userId);
  }

  @Post(':id/members/remove')
  removeMembers(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setThreadMembersSchema)) dto: SetThreadMembersDto,
  ) {
    return this.threads.removeMembers(companyId, user.role, id, dto, user.userId);
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

  @Post(':id/invite-link')
  @HttpCode(200)
  inviteLink(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
  ) {
    return this.threads.ensureInviteLink(companyId, user.role, id, user.userId);
  }
}


