import { Global, Injectable, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DomainEventName,
  type AccessApprovedEvent,
  type BroadcastSentEvent,
  type MessageSentEvent,
  type OrderCreatedEvent,
  type OrderStatusChangedEvent,
  type PaymentAskEvent,
  type ReturnEvent,
  type CollectionViewGrantedEvent,
  type RelistGrantedEvent,
} from './domain-events';

/**
 * The single publisher for domain events. Feature services depend on this typed
 * surface rather than the raw emitter, so the event contract stays discoverable.
 */
@Injectable()
export class DomainEvents {
  constructor(private readonly emitter: EventEmitter2) {}

  accessApproved(payload: AccessApprovedEvent): void {
    this.emitter.emit(DomainEventName.AccessApproved, payload);
  }

  orderCreated(payload: OrderCreatedEvent): void {
    this.emitter.emit(DomainEventName.OrderCreated, payload);
  }

  orderStatusChanged(payload: OrderStatusChangedEvent): void {
    this.emitter.emit(DomainEventName.OrderStatusChanged, payload);
  }

  messageSent(payload: MessageSentEvent): void {
    this.emitter.emit(DomainEventName.MessageSent, payload);
  }

  returnRequested(payload: ReturnEvent): void {
    this.emitter.emit(DomainEventName.ReturnRequested, payload);
  }

  returnDecided(payload: ReturnEvent): void {
    this.emitter.emit(DomainEventName.ReturnDecided, payload);
  }

  broadcastSent(payload: BroadcastSentEvent): void {
    this.emitter.emit(DomainEventName.BroadcastSent, payload);
  }

  paymentRequested(payload: PaymentAskEvent): void {
    this.emitter.emit(DomainEventName.PaymentRequested, payload);
  }

  paymentSettled(payload: PaymentAskEvent): void {
    this.emitter.emit(DomainEventName.PaymentSettled, payload);
  }

  collectionViewGranted(payload: CollectionViewGrantedEvent): void {
    this.emitter.emit(DomainEventName.CollectionViewGranted, payload);
  }

  relistGranted(payload: RelistGrantedEvent): void {
    this.emitter.emit(DomainEventName.RelistGranted, payload);
  }
}

@Global()
@Module({
  providers: [DomainEvents],
  exports: [DomainEvents],
})
export class EventsModule {}
