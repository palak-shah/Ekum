import { describe, expect, it } from 'vitest';
import { OrderChatEvent } from '@ekum/domain-types';
import { orderCardMessage, textMessage } from '@/test/messageFixtures';
import {
  buildChatTradeCard,
  buildCollectionTradeCard,
  buildDesignTradeCard,
  buildOrderTradeCard,
  isRedundantActionDetail,
  stripLeadingParty,
} from './chatTradeCard';

function orderMessage(overrides: Parameters<typeof orderCardMessage>[0] = { id: 'm1' }) {
  return orderCardMessage({
    mine: false,
    reference: {
      id: 'ord-1',
      kind: 'order',
      name: 'Order #J5NS',
      image: null,
      orderLabel: 'Order #J5NS',
      available: true,
      itemCount: 3,
      images: ['https://example.com/a.jpg'],
      event: OrderChatEvent.OrderRequested,
      counterpartName: 'Jaipur Emporium',
    },
    ...overrides,
  });
}

describe('stripLeadingParty / isRedundantActionDetail', () => {
  it('strips party prefix from compact pulse body', () => {
    expect(stripLeadingParty('Jaipur Emporium accepted quote', 'Jaipur Emporium')).toBe(
      'accepted quote',
    );
  });

  it('treats accepted quote as redundant when primary ends with Accepted', () => {
    expect(isRedundantActionDetail('accepted quote', 'Order #N3QJ Accepted')).toBe(true);
    expect(isRedundantActionDetail('3 designs', 'Order #J5NS Requested')).toBe(false);
  });
});

describe('buildOrderTradeCard slots', () => {
  it('maps rich incoming order to uniform slots', () => {
    const message = orderMessage();
    const model = buildOrderTradeCard(message, message.reference, 'Jaipur Emporium', false);
    expect(model.primary).toBe('Order #J5NS Requested');
    expect(model.who).toBe('Jaipur Emporium');
    expect(model.details).toContain('3 designs');
    expect(model.variant).toBe('bubble');
    expect(model.thumbs).toHaveLength(1);
  });

  it('omits redundant who on outgoing rich order without teammate', () => {
    const message = orderMessage({ id: 'm1', mine: true });
    const model = buildOrderTradeCard(message, message.reference, 'You', false);
    expect(model.primary).toBe('Order #J5NS Requested');
    expect(model.who).toBeNull();
    expect(model.details).toContain('3 designs');
  });

  it('compact accepted pulse shows party once without duplicate subtitle', () => {
    const ref = {
      id: 'ord-1',
      kind: 'order' as const,
      name: 'Order #J5NS',
      image: null,
      orderLabel: 'Order #J5NS',
      available: true,
      event: OrderChatEvent.QuoteAccepted,
      counterpartName: 'Jaipur Emporium',
    };
    const message = orderCardMessage({ id: 'm1', mine: false, reference: ref });
    const model = buildOrderTradeCard(message, ref, 'Jaipur Emporium', true);
    expect(model.primary).toBe('Order #J5NS Accepted');
    expect(model.who).toBe('Jaipur Emporium');
    expect(model.details.some((line) => /Jaipur Emporium/i.test(line))).toBe(false);
    expect(model.variant).toBe('pulse');
    expect(model.thumbs).toHaveLength(0);
  });

  it('maps quote mic note from living-card metadata (bubble and pulse)', () => {
    const message = orderMessage({
      id: 'r1',
      type: 'rate',
      body: 'Hold for tomorrow',
      metadata: {
        event: OrderChatEvent.QuoteSent,
        quoted: true,
        noteVoiceUrl: 'https://example.com/q.webm',
        noteVoiceDurationMs: 2100,
      },
    });
    const rich = buildOrderTradeCard(message, message.reference, 'Surat Silk House', false);
    expect(rich.note).toBe('Hold for tomorrow');
    expect(rich.noteVoiceUrl).toBe('https://example.com/q.webm');
    expect(rich.noteVoiceDurationMs).toBe(2100);
    expect(rich.details).not.toContain('Hold for tomorrow');

    const pulse = buildOrderTradeCard(message, message.reference, 'Surat Silk House', true);
    expect(pulse.variant).toBe('pulse');
    expect(pulse.note).toBe('Hold for tomorrow');
    expect(pulse.noteVoiceUrl).toBe('https://example.com/q.webm');
    expect(pulse.noteVoiceDurationMs).toBe(2100);
    expect(pulse.details).not.toContain('Hold for tomorrow');
  });

  it('uses View inquiry → while live intent is inquiry', () => {
    const message = orderMessage({
      reference: {
        id: 'ord-1',
        kind: 'order',
        name: 'Inquiry #J5NS',
        image: null,
        orderLabel: 'Inquiry #J5NS',
        available: true,
        itemCount: 2,
        event: OrderChatEvent.RateRequested,
        intent: 'inquiry',
        counterpartName: 'Jaipur Emporium',
      },
    });
    let opened = false;
    const model = buildOrderTradeCard(message, message.reference, 'Jaipur Emporium', false, {
      openOrder: () => {
        opened = true;
      },
    });
    expect(model.action?.label).toBe('View inquiry →');
    model.action?.onClick?.();
    expect(opened).toBe(true);
  });

  it('uses View order → when intent is order or omitted', () => {
    const asOrder = orderMessage({
      reference: {
        id: 'ord-1',
        kind: 'order',
        name: 'Order #J5NS',
        image: null,
        orderLabel: 'Order #J5NS',
        available: true,
        event: OrderChatEvent.OrderRequested,
        intent: 'order',
        counterpartName: 'Jaipur Emporium',
      },
    });
    expect(
      buildOrderTradeCard(asOrder, asOrder.reference, 'Jaipur Emporium', false, {
        openOrder: () => undefined,
      }).action?.label,
    ).toBe('View order →');

    const omitted = orderMessage();
    expect(
      buildOrderTradeCard(omitted, omitted.reference, 'Jaipur Emporium', false, {
        openOrder: () => undefined,
      }).action?.label,
    ).toBe('View order →');
  });
});

describe('buildCollectionTradeCard / buildDesignTradeCard', () => {
  it('puts pack name in primary and order goes to in details', () => {
    const message = textMessage({
      id: 'c1',
      type: 'collection_card',
      mine: false,
      senderCompanyId: 'co-owner',
      reference: {
        id: 'col-1',
        kind: 'collection',
        name: 'Mill Lot — March',
        image: null,
        available: true,
        itemCount: 3,
        images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        ownerCompanyId: 'co-owner',
      },
    });
    const model = buildCollectionTradeCard(
      message,
      message.reference,
      'Jaipur Emporium',
      'Order goes to Ahmedabad Loom Co',
    );
    expect(model.primary).toBe('Mill Lot — March');
    expect(model.who).toBe('Jaipur Emporium');
    expect(model.details).toEqual(['Order goes to Ahmedabad Loom Co', '3 designs']);
    expect(model.action?.label).toBe('View collection →');
  });

  it('design card uses design name primary and order goes to detail', () => {
    const message = textMessage({
      id: 'p1',
      type: 'product_card',
      mine: false,
      senderCompanyId: 'co-owner',
      reference: {
        id: 'prod-1',
        kind: 'product',
        name: 'Banarasi Silk Saree',
        image: 'https://example.com/a.jpg',
        available: true,
        ownerCompanyId: 'co-owner',
      },
    });
    const model = buildDesignTradeCard(
      message,
      message.reference,
      'Jaipur Emporium',
      'Order goes to Surat Silk House',
    );
    expect(model.primary).toBe('Banarasi Silk Saree');
    expect(model.who).toBe('Jaipur Emporium');
    expect(model.details).toEqual(['Order goes to Surat Silk House']);
  });
});

describe('buildChatTradeCard dispatcher', () => {
  it('returns null for non-trade card types', () => {
    expect(
      buildChatTradeCard(textMessage({ id: 't1', type: 'text', body: 'hi', mine: false }), null, 'You'),
    ).toBeNull();
  });
});
