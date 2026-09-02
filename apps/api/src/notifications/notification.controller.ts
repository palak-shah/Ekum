import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  listNotificationsQuerySchema,
  pushSubscriptionSchema,
  unsubscribePushSchema,
  updateNotificationPreferencesSchema,
  type ListNotificationsQuery,
  type PushSubscriptionDto,
  type UnsubscribePushDto,
  type UpdateNotificationPreferencesDto,
} from '@ekum/domain-types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentCompanyId } from '../auth/decorators/current-company.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { NotificationService } from './notification.service';

@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(
    @CurrentCompanyId() companyId: string,
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(listNotificationsQuerySchema)) query: ListNotificationsQuery,
  ) {
    return this.notifications.list(companyId, query, user.userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentCompanyId() companyId: string) {
    return this.notifications.unreadCount(companyId);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthPrincipal) {
    return this.notifications.getPreferences(user.userId);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(updateNotificationPreferencesSchema))
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notifications.updatePreferences(user.userId, dto);
  }

  @Post('read')
  @HttpCode(200)
  markAllRead(@CurrentCompanyId() companyId: string) {
    return this.notifications.markAllRead(companyId);
  }

  @Delete('read')
  @HttpCode(200)
  clearRead(@CurrentCompanyId() companyId: string) {
    return this.notifications.deleteRead(companyId);
  }

  @Delete()
  @HttpCode(200)
  clearAll(@CurrentCompanyId() companyId: string) {
    return this.notifications.deleteAll(companyId);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.notifications.markRead(companyId, id);
  }

  @Delete(':id')
  @HttpCode(200)
  deleteOne(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.notifications.deleteOne(companyId, id);
  }

  @Post('push')
  subscribePush(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(pushSubscriptionSchema)) dto: PushSubscriptionDto,
  ) {
    return this.notifications.subscribePush(user.userId, dto);
  }

  @Delete('push')
  @HttpCode(200)
  unsubscribePush(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(unsubscribePushSchema)) dto: UnsubscribePushDto,
  ) {
    return this.notifications.unsubscribePush(user.userId, dto.endpoint);
  }
}
