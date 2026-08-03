import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * Settings. Owner-managed reference data (dispatch addresses, billing firms,
 * trade defaults / return policy / "My Tools" toggles) that feeds order building
 * and dispatch later.
 */
@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
