import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@ekum/domain-types';
import {
  DomainEventName,
  type AccessApprovedEvent,
  type BroadcastSentEvent,
  type MessageSentEvent,
  type OrderCreatedEvent,
  type OrderStatusChangedEvent,
  type PaymentAskEvent,
  type ReturnEvent,
} from '../events/domain-events';
import { NotificationService } from './notification.service';

/**
 * The Notifications domain is a pure consumer: it listens to documented domain
 * events and projects each into feed entries. It never calls back into the
 * publishing modules. Handlers are best-effort so a projection failure never
 * rolls back the business action that already committed.
 */
@Injectable()
export class NotificationListeners {
  private readonly logger = new Logger(NotificationListeners.name);

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent(DomainEventName.AccessApproved)
  async onAccessApproved(event: AccessApprovedEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.requesterCompanyId,
        type: NotificationType.Request,
        title: 'Access approved',
        body: 'A business approved your access request.',
        refType: 'company',
        refId: event.targetCompanyId,
      }),
    );
  }

  @OnEvent(DomainEventName.CollectionViewGranted)
  async onCollectionViewGranted(event: {
    requesterCompanyId: string;
    collectionId: string;
    collectionName: string;
  }): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.requesterCompanyId,
        type: NotificationType.Collection,
        title: 'You can view a collection',
        body: event.collectionName,
        refType: 'collection',
        refId: event.collectionId,
      }),
    );
  }

  @OnEvent(DomainEventName.OrderCreated)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.sellerCompanyId,
        type: NotificationType.Order,
        title: 'New order request',
        body: 'A buyer placed an order request.',
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.OrderStatusChanged)
  async onOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    const recipientCompanyId =
      event.actorCompanyId === event.buyerCompanyId ? event.sellerCompanyId : event.buyerCompanyId;
    const statusLabel = humanOrderStatus(event.status);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId,
        type: NotificationType.Order,
        title: `Order · ${statusLabel}`,
        body: `Order marked ${statusLabel}.`,
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.MessageSent)
  async onMessageSent(event: MessageSentEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.createForRecipients(event.recipientCompanyIds, event.recipientUserIds, {
        type: NotificationType.Message,
        title: 'New message',
        body: event.preview,
        refType: 'thread',
        refId: event.threadId,
      }),
    );
  }

  @OnEvent(DomainEventName.ReturnRequested)
  async onReturnRequested(event: ReturnEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.sellerCompanyId,
        type: NotificationType.Return,
        title: 'Return requested',
        body: 'A buyer raised a return.',
        refType: 'return',
        refId: event.returnId,
      }),
    );
  }

  @OnEvent(DomainEventName.ReturnDecided)
  async onReturnDecided(event: ReturnEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.buyerCompanyId,
        type: NotificationType.Return,
        title: `Return ${event.status}`,
        body: `Your return was ${event.status}.`,
        refType: 'return',
        refId: event.returnId,
      }),
    );
  }

  @OnEvent(DomainEventName.BroadcastSent)
  async onBroadcastSent(event: BroadcastSentEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.createForMany(event.recipientCompanyIds, {
        type: NotificationType.Broadcast,
        title: event.subject,
        body: 'New broadcast from a business you follow.',
        refType: 'broadcast',
        refId: event.broadcastId,
      }),
    );
  }

  @OnEvent(DomainEventName.PaymentRequested)
  async onPaymentRequested(event: PaymentAskEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.buyerCompanyId,
        type: NotificationType.Order,
        title: 'Payment asked',
        body: 'A business asked for payment on an order.',
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.PaymentSettled)
  async onPaymentSettled(event: PaymentAskEvent): Promise<void> {
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId:
          event.actorCompanyId === event.sellerCompanyId
            ? event.buyerCompanyId
            : event.sellerCompanyId,
        type: NotificationType.Order,
        title: 'Payment marked paid',
        body: 'A payment ask was marked paid.',
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  private async guard(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.logger.error(
        `Notification projection failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function humanOrderStatus(status: string): string {
  if (status === 'part_shipped') return 'Part shipped';
  if (!status) return 'updated';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}
