import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { IdentityModule } from './identity/identity.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { ConversationModule } from './conversation/conversation.module';
import { OrdersModule } from './orders/orders.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { ReferralModule } from './referral/referral.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { MediaModule } from './media/media.module';
import { HealthModule } from './health/health.module';

/**
 * Root module. Feature modules map 1:1 to bounded contexts. EventsModule is the
 * shared domain-event backbone; NotificationsModule consumes those events.
 */
@Module({
  imports: [
    CoreModule,
    EventsModule,
    AuditModule,
    AuthModule,
    AccessModule,
    IdentityModule,
    CatalogModule,
    SettingsModule,
    DiscoveryModule,
    ConversationModule,
    OrdersModule,
    BroadcastModule,
    ReferralModule,
    NotificationsModule,
    JobsModule,
    MediaModule,
    HealthModule,
  ],
})
export class AppModule {}
