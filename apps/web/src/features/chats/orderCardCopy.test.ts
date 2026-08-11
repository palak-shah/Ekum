import { describe, expect, it } from 'vitest';
import { OrderChatEvent } from '@ekum/domain-types';
import {
  buildOrderCardCopy,
  dedupeOrderThreadMessages,
  isRichOrderChatMessage,
} from './orderCardCopy';
import { orderCardMessage, orderRef, textMessage } from '@/test/messageFixtures';

describe('dedupeOrderThreadMessages', () => {
  it('keeps only the newest card per order id', () => {
    const older = orderCardMessage({
      id: 'm-old',
      reference: orderRef({ id: 'ord-1', name: 'Order #A', orderLabel: 'Order #A' }),
      metadata: { event: OrderChatEvent.OrderRequested },
    });
    const newer = orderCardMessage({
      id: 'm-new',
      reference: orderRef({ id: 'ord-1', name: 'Order #A', orderLabel: 'Order #A' }),
      metadata: { event: OrderChatEvent.QuoteSent },
    });
    const other = textMessage({ id: 't1', body: 'hi' });
    const out = dedupeOrderThreadMessages([older, other, newer]);
    expect(out.map((m) => m.id)).toEqual(['t1', 'm-new']);
  });
});

describe('isRichOrderChatMessage', () => {
  it('treats rate as rich', () => {
    expect(isRichOrderChatMessage(orderCardMessage({ id: 'r1', type: 'rate' }))).toBe(true);
  });

  it('treats quote_accepted as compact', () => {
    const msg = orderCardMessage({
      id: 'c1',
      metadata: { event: OrderChatEvent.QuoteAccepted },
      reference: orderRef({ id: 'ord-1', event: OrderChatEvent.QuoteAccepted }),
    });
    expect(isRichOrderChatMessage(msg)).toBe(false);
  });
});

describe('buildOrderCardCopy', () => {
  it('uses You for mine, never Seller/Buyer in copy', () => {
    const msg = orderCardMessage({
      id: 'm1',
      mine: true,
      metadata: { event: OrderChatEvent.OrderRequested, actorLabel: 'You' },
      reference: orderRef({
        id: 'ord-1',
        event: OrderChatEvent.OrderRequested,
        actorLabel: 'You',
      }),
    });
    const copy = buildOrderCardCopy(msg, msg.reference);
    expect(copy.headline).toMatch(/^You\b/);
    expect(copy.headline).not.toMatch(/Seller|Buyer/);
    expect(copy.title).not.toMatch(/Seller|Buyer/);
    expect(copy.action).toBe('Requested');
    expect(copy.title).toBe('Order #ECNL · Requested');
    expect(copy.headline).toBe('You requested');
    expect(copy.lines).toEqual([]);
  });
});
