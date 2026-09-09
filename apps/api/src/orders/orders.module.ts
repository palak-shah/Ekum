import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { ConversationModule } from '../conversation/conversation.module';
import { OrderController } from './order.controller';
import { TradeLaneController } from './trade-lane.controller';
import { OrderInviteController } from './order-invite.controller';
import { BuyForBuyerService } from './buy-for-buyer.service';
import { SampleController } from './sample.controller';
import { ReturnController } from './return.controller';
import { ComplaintController } from './complaint.controller';
import { OrderPaymentController, PaymentRequestController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrderService } from './order.service';
import { TradeLaneService } from './trade-lane.service';
import { SampleService } from './sample.service';
import { ReturnService } from './return.service';
import { ComplaintService } from './complaint.service';
import { OrderSerializer } from './order.serializer';
import { OrderTrailService } from './order-trail.service';
import { TradeAccess } from './trade-access';

/**
 * Orders & Fulfillment. One Order object read from a buying/selling perspective
 * with immutable line snapshots and requested → confirmed → ship → settled;
 * Samples, Returns, and Complaints reuse the same party model.
 */
@Module({
  imports: [AccessModule, ConversationModule],
  controllers: [
    OrderController,
    TradeLaneController,
    OrderInviteController,
    SampleController,
    ReturnController,
    ComplaintController,
    OrderPaymentController,
    PaymentRequestController,
  ],
  providers: [
    OrderService,
    TradeLaneService,
    BuyForBuyerService,
    SampleService,
    ReturnService,
    ComplaintService,
    PaymentService,
    OrderSerializer,
    OrderTrailService,
    TradeAccess,
  ],
})
export class OrdersModule {}
