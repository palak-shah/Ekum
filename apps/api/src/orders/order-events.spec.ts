import { describe, expect, it } from 'vitest';
import {
  OrderChatEvent,
  inferOrderChatEvent,
  linesDecidedEventLabel,
  nextOrderAction,
  orderChatEventLabel,
  orderLifecycleTagCopy,
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
    expect(orderChatEventLabel(OrderChatEvent.OrderDispatchEdited)).toBe('Dispatch edited');
    expect(orderChatEventLabel(OrderChatEvent.OrderDelivered)).toBe('Delivered');
    expect(orderChatEventLabel(OrderChatEvent.OrderDeclined)).toBe('Declined');
    expect(orderChatEventLabel(OrderChatEvent.ReturnRaised)).toBe('Returned');
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
        counterpartName: 'Surat Silk House',
      }),
    ).toBe('Waiting on Surat Silk House for rates');
  });

  it('falls back to them when counterpart name is missing', () => {
    expect(
      nextOrderAction({
        status: 'confirmed',
        direction: 'buying',
        partiallyShipped: false,
      }),
    ).toBe('Waiting on them to dispatch');
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

  it('names the counterpart when the buyer waits on dispatch', () => {
    expect(
      nextOrderAction({
        status: 'confirmed',
        direction: 'buying',
        partiallyShipped: false,
        counterpartName: 'Surat Silk House',
      }),
    ).toBe('Waiting on Surat Silk House to dispatch');
  });

  it('uses part_shipped as the main status for remaining dispatch', () => {
    expect(
      nextOrderAction({
        status: 'part_shipped',
        direction: 'selling',
      }),
    ).toBe('Your move: dispatch remaining');
    expect(
      nextOrderAction({
        status: 'part_shipped',
        direction: 'buying',
        counterpartName: 'Surat Silk House',
      }),
    ).toBe('Part shipped — waiting on Surat Silk House for the rest');
  });

  it('tells the buyer dispatched is complete', () => {
    expect(
      nextOrderAction({
        status: 'dispatched',
        direction: 'buying',
      }),
    ).toBe('Dispatched · complete');
  });
});

describe('roleLabel', () => {
  it('returns You buy / You sell', () => {
    expect(roleLabel('buying')).toBe('You buy');
    expect(roleLabel('selling')).toBe('You sell');
    expect(roleLabel(null)).toBeNull();
  });
});

describe('orderLifecycleTagCopy', () => {
  it('uses You/shop confirm and can’t-supply, never Seller/Buyer', () => {
    expect(
      orderLifecycleTagCopy({ event: OrderChatEvent.LinesDecided, actor: 'You' }),
    ).toBe('You confirmed');
    expect(
      orderLifecycleTagCopy({
        event: OrderChatEvent.LinesDecided,
        actor: 'Surat Silk House',
        confirmedCount: 2,
        declinedCount: 1,
      }),
    ).toBe('Surat Silk House confirmed 2 · can’t supply 1');
    expect(
      orderLifecycleTagCopy({ event: OrderChatEvent.OrderDeclined, actor: 'You' }),
    ).toBe('You declined');
  });

  it('names the design and order unit on qty after lock', () => {
    expect(
      orderLifecycleTagCopy({
        event: OrderChatEvent.OrderUpdated,
        actor: 'Surat Silk House',
        qtyChange: { count: 1, name: 'HANDLE', before: 3, after: 2, unit: 'pc' },
      }),
    ).toBe('Surat Silk House changed 1 design · HANDLE: 3 → 2 pcs');
  });

  it('rewrites buyer amend summaries with You', () => {
    expect(
      orderLifecycleTagCopy({
        event: OrderChatEvent.OrderUpdated,
        actor: 'You',
        amendSummary: 'Updated qty · 20 → 12',
      }),
    ).toBe('You updated qty · 20 → 12');
  });
});
