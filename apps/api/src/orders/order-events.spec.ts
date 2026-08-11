import { describe, expect, it } from 'vitest';
import {
  OrderChatEvent,
  inferOrderChatEvent,
  linesDecidedEventLabel,
  nextOrderAction,
  orderChatEventLabel,
  roleLabel,
} from '@ekum/domain-types';

describe('orderChatEventLabel / inferOrderChatEvent', () => {
  it('labels frozen events', () => {
    expect(orderChatEventLabel(OrderChatEvent.LinesDecided)).toBe('Updated');
    expect(orderChatEventLabel(OrderChatEvent.QuoteSent)).toBe('Quote');
    expect(orderChatEventLabel(OrderChatEvent.OrderRequested)).toBe('Requested');
    expect(orderChatEventLabel(OrderChatEvent.OrderCancelled)).toBe('Cancelled');
    expect(orderChatEventLabel(OrderChatEvent.QuoteAccepted)).toBe('Accepted');
    expect(orderChatEventLabel(OrderChatEvent.OrderDispatched)).toBe('Dispatched');
    expect(orderChatEventLabel(OrderChatEvent.OrderDelivered)).toBe('Delivered');
    expect(orderChatEventLabel(OrderChatEvent.OrderDeclined)).toBe('Declined');
  });

  it('picks Confirmed / Declined / Updated from line counts', () => {
    expect(linesDecidedEventLabel(2, 0)).toBe('Confirmed');
    expect(linesDecidedEventLabel(0, 2)).toBe('Declined');
    expect(linesDecidedEventLabel(1, 1)).toBe('Updated');
    expect(
      orderChatEventLabel(OrderChatEvent.LinesDecided, {
        confirmedCount: 2,
        declinedCount: 0,
      }),
    ).toBe('Confirmed');
  });

  it('infers lines_decided from legacy metadata.kind', () => {
    expect(
      inferOrderChatEvent({
        messageType: 'system',
        metadata: { kind: 'order_lines' },
      }),
    ).toBe(OrderChatEvent.LinesDecided);
  });

  it('infers quote_sent from rate messages', () => {
    expect(inferOrderChatEvent({ messageType: 'rate', metadata: {} })).toBe(
      OrderChatEvent.QuoteSent,
    );
  });
});

describe('nextOrderAction', () => {
  it('tells the buyer to accept a quote when open lines are rated', () => {
    expect(
      nextOrderAction({
        status: 'requested',
        direction: 'buying',
        hasOpenQuotedLine: true,
      }),
    ).toBe('Your move: accept quote');
  });

  it('tells the seller to send rates on an inquiry', () => {
    expect(
      nextOrderAction({
        status: 'requested',
        direction: 'selling',
        intent: 'inquiry',
      }),
    ).toBe('Your move: send rates');
  });

  it('tells the buyer waiting on rates for an inquiry', () => {
    expect(
      nextOrderAction({
        status: 'requested',
        direction: 'buying',
        intent: 'inquiry',
      }),
    ).toBe('Waiting on seller rates');
  });

  it('tells the seller to dispatch when confirmed', () => {
    expect(
      nextOrderAction({
        status: 'confirmed',
        direction: 'selling',
        partiallyShipped: false,
      }),
    ).toBe('Your move: dispatch shipment');
  });

  it('tells the buyer to mark delivered when dispatched', () => {
    expect(
      nextOrderAction({
        status: 'dispatched',
        direction: 'buying',
      }),
    ).toBe('Your move: mark delivered');
  });
});

describe('roleLabel', () => {
  it('returns You buy / You sell', () => {
    expect(roleLabel('buying')).toBe('You buy');
    expect(roleLabel('selling')).toBe('You sell');
    expect(roleLabel(null)).toBeNull();
  });
});
