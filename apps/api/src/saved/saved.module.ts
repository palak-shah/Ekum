import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { SavedController } from './saved.controller';
import { SavedService } from './saved.service';

/**
 * Saved references — private bookmarks of discoverable designs and collections.
 * Curate/publish still enforce allowForward separately.
 */
@Module({
  imports: [AccessModule],
  controllers: [SavedController],
  providers: [SavedService],
  exports: [SavedService],
})
export class SavedModule {}
