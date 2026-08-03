/**
 * The documented catalog of domain events. Feature modules publish these through
 * DomainEvents; Notifications is a pure consumer and never reaches back into the
 * publishing modules. Keeping names and payloads in one place is the contract.
 */
export const DomainEventName = {
  AccessApproved: 'access.approved',
  OrderCreated: 'order.created',
  OrderStatusChanged: 'order.status_changed',
  MessageSent: 'message.sent',
  ReturnRequested: 'return.requested',
  ReturnDecided: 'return.decided',
  BroadcastSent: 'broadcast.sent',
} as const;

export interface AccessApprovedEvent {
  requestId: string;
  requesterCompanyId: string;
  targetCompanyId: string;
}

export interface OrderCreatedEvent {
  orderId: string;
  buyerCompanyId: string;
  sellerCompanyId: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  buyerCompanyId: string;
  sellerCompanyId: string;
  actorCompanyId: string;
  status: string;
}

export interface MessageSentEvent {
  threadId: string;
  messageId: string;
  senderCompanyId: string;
  recipientCompanyIds: string[];
  preview: string;
}

export interface ReturnEvent {
  returnId: string;
  orderId: string;
  buyerCompanyId: string;
  sellerCompanyId: string;
  actorCompanyId: string;
  status: string;
}

export interface BroadcastSentEvent {
  broadcastId: string;
  senderCompanyId: string;
  recipientCompanyIds: string[];
  subject: string;
}
