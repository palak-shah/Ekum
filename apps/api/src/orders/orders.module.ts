import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { ConversationModule } from '../conversation/conversation.module';
import { OrderController } from './order.controller';
import { OrderInviteController } from './order-invite.controller';
import { BuyForBuyerService } from './buy-for-buyer.service';
import { SampleController } from './sample.controller';
import { ReturnController } from './return.controller';
import { ComplaintController } from './complaint.controller';
import { OrderPaymentController, PaymentRequestController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrderService } from './order.service';
import { SampleService } from './sample.service';
import { ReturnService } from './return.service';
import { ComplaintService } from './complaint.service';
import { OrderSerializer } from './order.serializer';
import { TradeAccess } from './trade-access';

/**
 * Orders & Fulfillment. One Order object read from a buying/selling perspective
 * with immutable line snapshots and a requested -> confirmed -> dispatched ->
 * delivered state machine; Samples, Returns (partial + upstream escalation), and
 * Complaints reuse the same party model. Depends on Access for the trade gate.
 */
@Module({
  imports: [AccessModule, ConversationModule],
  controllers: [
    OrderController,
    OrderInviteController,
    SampleController,
    ReturnController,
    ComplaintController,
    OrderPaymentController,
    PaymentRequestController,
  ],
  providers: [
    OrderService,
    BuyForBuyerService,
    SampleService,
    ReturnService,
    ComplaintService,
    PaymentService,
    OrderSerializer,
    TradeAccess,
  ],
})
export class OrdersModule {}
