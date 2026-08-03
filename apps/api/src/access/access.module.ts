import { Module, forwardRef } from '@nestjs/common';
import { ConversationModule } from '../conversation/conversation.module';
import { AccessController } from './access.controller';
import { ConnectionController } from './connection.controller';
import { AccessService } from './access.service';
import { ConnectionService } from './connection.service';
import { VisibilityService } from './visibility.service';
import { CompanySerializer } from './company.serializer';

/**
 * Access & Trust. The most architecturally central domain: it owns the access
 * gate, the connection state machine (with silent pause/block), the shared
 * VisibilityService, and the contact-safe CompanySerializer. Other domains
 * depend on the exported services rather than reimplementing visibility.
 */
@Module({
  imports: [forwardRef(() => ConversationModule)],
  controllers: [AccessController, ConnectionController],
  providers: [AccessService, ConnectionService, VisibilityService, CompanySerializer],
  exports: [VisibilityService, CompanySerializer],
})
export class AccessModule {}
