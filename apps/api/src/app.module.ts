import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { IdentityModule } from './identity/identity.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';

/**
 * Root module. Feature modules map 1:1 to bounded contexts and are registered
 * here as they are built (Discovery, Conversation, Orders, Broadcast,
 * Notifications still to come).
 */
@Module({
  imports: [
    CoreModule,
    AuditModule,
    AuthModule,
    AccessModule,
    IdentityModule,
    CatalogModule,
    SettingsModule,
    HealthModule,
  ],
})
export class AppModule {}
