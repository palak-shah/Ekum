import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationListeners } from './notification.listeners';
import { WebPushService } from './web-push.service';

/**
 * Notifications. A pure consumer of documented domain events, projecting each
 * into a company-scoped feed and (when configured) web push. Owns per-user
 * delivery preferences and push subscriptions.
 */
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationListeners, WebPushService],
  exports: [NotificationService],
})
export class NotificationsModule {}
