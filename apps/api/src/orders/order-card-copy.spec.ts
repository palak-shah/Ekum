/**
 * Chat order-card actor/title rules (domain helpers used by web orderCardCopy).
 */
import { describe, expect, it } from 'vitest';
import {
  OrderChatEvent,
  linesDecidedEventLabel,
  linesDecidedHeadline,
  orderChatActor,
  orderChatEventHeadline,
  orderChatEventLabel,
  shortOrderLabel,
  stripOrderChatBodyNoise,
} from '@ekum/domain-types';

function chatTitle(orderId: string, event: string, confirmed = 0, declined = 0): string {
  const action =
    event === OrderChatEvent.LinesDecided
      ? linesDecidedEventLabel(confirmed, declined)
      : orderChatEventLabel(event);
  return `${shortOrderLabel(orderId)} · ${action}`;
}

describe('chat order card title shape', () => {
  it('puts Order # first with Confirmed when nothing declined', () => {
    expect(chatTitle('seed-order-xx3ylk', OrderChatEvent.LinesDecided, 2, 0)).toBe(
      'Order #3YLK · Confirmed',
    );
  });

  it('uses Updated only when both confirm and decline happened', () => {
    expect(chatTitle('o1', OrderChatEvent.LinesDecided, 1, 1)).toMatch(/· Updated$/);
  });

  it('labels quote and accepted without Lines updated', () => {
    expect(chatTitle('o1', OrderChatEvent.QuoteSent)).toMatch(/· Quote$/);
    expect(chatTitle('o1', OrderChatEvent.QuoteAccepted)).toMatch(/· Accepted$/);
    expect(chatTitle('o1', OrderChatEvent.OrderRequested)).toMatch(/· Requested$/);
    expect(chatTitle('o1', OrderChatEvent.RateRequested)).toMatch(/· Inquiry$/);
    expect(chatTitle('o1', OrderChatEvent.OrderUpdated)).toMatch(/· Updated$/);
  });

  it('uses Inquiry # for inquiry short labels', () => {
    expect(shortOrderLabel('seed-order-xx3ylk', { inquiry: true })).toBe('Inquiry #3YLK');
    expect(shortOrderLabel('seed-order-xx3ylk')).toBe('Order #3YLK');
  });

  it('headline for inquiry uses asked for rates', () => {
    expect(orderChatEventHeadline('You', OrderChatEvent.RateRequested)).toBe(
      'You asked for rates',
    );
    expect(orderChatEventHeadline('You', OrderChatEvent.OrderUpdated)).toBe('You updated');
  });
});

describe('orderChatActor / headlines — never Seller/Buyer', () => {
  it('says You for mine even when body/legacy said Seller', () => {
    const actor = orderChatActor({ mine: true, actorLabel: 'Surat Silk House' });
    const noise = stripOrderChatBodyNoise(
      'Seller confirmed 1 · declined 2 · Order #3YLK',
      'Surat Silk House',
    );
    const headline = linesDecidedHeadline(actor, 1, 2);
    expect(actor).toBe('You');
    expect(headline).toBe('You confirmed 1 · declined 2');
    expect(headline).not.toMatch(/seller/i);
    expect(noise).not.toMatch(/seller/i);
    expect(noise).not.toMatch(/Order #/i);
  });

  it('uses the other party name when not mine', () => {
    const actor = orderChatActor({ mine: false, actorLabel: 'Jaipur Emporium' });
    expect(linesDecidedHeadline(actor, 1, 2)).toBe(
      'Jaipur Emporium confirmed 1 · declined 2',
    );
    expect(orderChatEventHeadline(actor, OrderChatEvent.QuoteAccepted)).toBe(
      'Jaipur Emporium accepted quote',
    );
  });

  it('omits declined when count is zero', () => {
    expect(linesDecidedHeadline('You', 2, 0)).toBe('You confirmed 2');
    expect(linesDecidedHeadline('You', 2, 0)).not.toMatch(/declined/i);
  });

  it('falls back to partyName when actorLabel is Seller/Buyer/missing', () => {
    expect(
      orderChatActor({
        mine: false,
        actorLabel: 'Seller',
        partyName: 'Surat Silk House',
      }),
    ).toBe('Surat Silk House');
    expect(
      orderChatActor({
        mine: false,
        actorLabel: null,
        partyName: 'Jaipur Emporium',
      }),
    ).toBe('Jaipur Emporium');
    expect(orderChatActor({ mine: false, actorLabel: 'Buyer' })).toBe('They');
  });
});
