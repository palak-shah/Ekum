import { Module, forwardRef } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { ConversationController } from './conversation.controller';
import { ThreadService } from './thread.service';
import { MessageService } from './message.service';
import { ConversationSerializer } from './conversation.serializer';
import { ReferenceResolver } from './reference-resolver';

/**
 * Conversation. Company-to-company threads (direct + group) with a requests
 * inbox for unconnected outreach, per-thread read state and mute level, and
 * messages that reference trade objects by id (never a copy). Depends on Access
 * for visibility and contact-safe company summaries.
 */
@Module({
  imports: [forwardRef(() => AccessModule)],
  controllers: [ConversationController],
  providers: [ThreadService, MessageService, ConversationSerializer, ReferenceResolver],
  exports: [ThreadService],
})
export class ConversationModule {}
