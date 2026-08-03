import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { BroadcastListService } from './broadcast-list.service';

/**
 * Broadcast: saved recipient lists and immediate multi-recipient sends. Delivery
 * reuses the access visibility rules; recipients learn of a broadcast through
 * the Notifications feed (via the broadcast.sent domain event).
 */
@Module({
  imports: [AccessModule],
  controllers: [BroadcastController],
  providers: [BroadcastService, BroadcastListService],
})
export class BroadcastModule {}
