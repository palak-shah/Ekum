import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, shortOrderLabel } from '@ekum/domain-types';
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
import { PrismaService } from '../core/prisma/prisma.service';
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

  constructor(
    private readonly notifications: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DomainEventName.AccessApproved)
  async onAccessApproved(event: AccessApprovedEvent): Promise<void> {
    const targetName = await this.companyName(event.targetCompanyId);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.requesterCompanyId,
        type: NotificationType.Request,
        title: targetName ? `${targetName} approved your request` : 'Access approved',
        body: null,
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

  @OnEvent(DomainEventName.RelistGranted)
  async onRelistGranted(event: {
    requesterCompanyId: string;
    productIds: string[];
    productNames: string[];
  }): Promise<void> {
    const body =
      event.productNames.length === 1
        ? event.productNames[0]!
        : `${event.productNames.length} designs`;
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.requesterCompanyId,
        type: NotificationType.Collection,
        title: 'You can put this in your pack',
        body,
        refType: 'product',
        refId: event.productIds[0] ?? undefined,
      }),
    );
  }

  @OnEvent(DomainEventName.OrderCreated)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const buyerName = await this.companyName(event.buyerCompanyId);
    const orderLabel = shortOrderLabel(event.orderId);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.sellerCompanyId,
        type: NotificationType.Order,
        title: buyerName ? `${buyerName} · ${orderLabel}` : orderLabel,
        body: 'New order',
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
    const orderLabel = shortOrderLabel(event.orderId);
    const actorName = await this.companyName(event.actorCompanyId);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId,
        type: NotificationType.Order,
        title: `${orderLabel} · ${statusLabel}`,
        body: actorName ? `${actorName} marked it ${statusLabel}.` : `Marked ${statusLabel}.`,
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.MessageSent)
  async onMessageSent(event: MessageSentEvent): Promise<void> {
    const senderName = await this.companyName(event.senderCompanyId);
    await this.guard(() =>
      this.notifications.createForRecipients(event.recipientCompanyIds, event.recipientUserIds, {
        type: NotificationType.Message,
        title: senderName ?? 'New message',
        body: event.preview,
        refType: 'thread',
        refId: event.threadId,
      }),
    );
  }

  @OnEvent(DomainEventName.ReturnRequested)
  async onReturnRequested(event: ReturnEvent): Promise<void> {
    const buyerName = await this.companyName(event.buyerCompanyId);
    const orderLabel = shortOrderLabel(event.orderId);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.sellerCompanyId,
        type: NotificationType.Return,
        title: buyerName
          ? `${buyerName} · return on ${orderLabel}`
          : `Return on ${orderLabel}`,
        body: humanReturnStatus(event.status),
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.ReturnDecided)
  async onReturnDecided(event: ReturnEvent): Promise<void> {
    const sellerName = await this.companyName(event.sellerCompanyId);
    const orderLabel = shortOrderLabel(event.orderId);
    const status = humanReturnStatus(event.status);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.buyerCompanyId,
        type: NotificationType.Return,
        title: sellerName
          ? `${sellerName} · return on ${orderLabel}`
          : `Return on ${orderLabel}`,
        body: status,
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.BroadcastSent)
  async onBroadcastSent(event: BroadcastSentEvent): Promise<void> {
    const senderName = await this.companyName(event.senderCompanyId);
    await this.guard(() =>
      this.notifications.createForMany(event.recipientCompanyIds, {
        type: NotificationType.Broadcast,
        title: event.subject,
        body: senderName ?? 'Broadcast',
        refType: 'broadcast',
        refId: event.broadcastId,
      }),
    );
  }

  @OnEvent(DomainEventName.PaymentRequested)
  async onPaymentRequested(event: PaymentAskEvent): Promise<void> {
    const sellerName = await this.companyName(event.sellerCompanyId);
    const orderLabel = shortOrderLabel(event.orderId);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId: event.buyerCompanyId,
        type: NotificationType.Order,
        title: sellerName
          ? `${sellerName} asked for payment`
          : 'Payment asked',
        body: orderLabel,
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  @OnEvent(DomainEventName.PaymentSettled)
  async onPaymentSettled(event: PaymentAskEvent): Promise<void> {
    const recipientCompanyId =
      event.actorCompanyId === event.sellerCompanyId
        ? event.buyerCompanyId
        : event.sellerCompanyId;
    const counterpartId =
      recipientCompanyId === event.buyerCompanyId
        ? event.sellerCompanyId
        : event.buyerCompanyId;
    const counterpart = await this.companyName(counterpartId);
    const orderLabel = shortOrderLabel(event.orderId);
    await this.guard(() =>
      this.notifications.create({
        recipientCompanyId,
        type: NotificationType.Order,
        title: counterpart ? `${counterpart} marked paid` : 'Payment marked paid',
        body: orderLabel,
        refType: 'order',
        refId: event.orderId,
      }),
    );
  }

  private async companyName(companyId: string): Promise<string | null> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    return company?.name ?? null;
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
  if (status === 'dispatched') return 'Dispatched';
  if (status === 'settled') return 'Settled';
  if (!status) return 'updated';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function humanReturnStatus(status: string): string {
  if (status === 'requested') return 'Raised';
  if (status === 'partially_approved') return 'Partial';
  if (status === 'approved') return 'Approved';
  if (status === 'declined') return 'Declined';
  if (status === 'resolved') return 'Resolved';
  if (!status) return 'Return';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}
