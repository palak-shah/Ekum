import { describe, expect, it, vi } from 'vitest';
import { OrderChatEvent } from '@ekum/domain-types';
import { orderCardMessage, textMessage } from '@/test/messageFixtures';
import {
  buildChatTradeCard,
  buildCollectionTradeCard,
  buildDesignSetTradeCard,
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

  it('names an ended share No longer available', () => {
    const message = textMessage({
      id: 'c-gone',
      type: 'collection_card',
      mine: false,
      senderCompanyId: 'co-owner',
      reference: {
        id: 'col-1',
        kind: 'collection',
        name: 'Wedding 2026',
        image: null,
        available: false,
        ownerCompanyId: 'co-owner',
      },
    });
    const model = buildCollectionTradeCard(message, message.reference, 'Jaipur Emporium', null);
    expect(model.primary).toBe('No longer available');
    expect(model.action).toBeUndefined();
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

  it('design set card says Designs and View designs (not collection)', () => {
    const message = textMessage({
      id: 'd1',
      type: 'design_album',
      mine: false,
      senderCompanyId: 'co-a',
      reference: {
        id: 'p1',
        kind: 'designs',
        name: '3 designs',
        image: 'https://example.com/a.jpg',
        images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        productIds: ['p1', 'p2', 'p3'],
        itemCount: 3,
        available: true,
        ownerCompanyId: 'co-a',
        ownerCompanyName: 'Surat Silk House',
      },
    });
    const model = buildDesignSetTradeCard(message, message.reference, 'Surat Silk House', {
      designsPath: '/designs/set?ids=p1,p2,p3',
    });
    expect(model.kind).toBe('designs');
    expect(model.primary).toBe('3 designs');
    expect(model.action?.label).toBe('View designs →');
    expect(model.action?.to).toContain('/designs/set');
  });

  it('enquire note sits on the designs card without You asked chrome', () => {
    const message = textMessage({
      id: 'd1',
      type: 'design_album',
      mine: true,
      senderCompanyId: 'me',
      metadata: { enquireNote: 'xyz test', productIds: ['p1', 'p2'] },
      reference: {
        id: 'p1',
        kind: 'designs',
        name: '2 designs',
        image: null,
        images: [],
        productIds: ['p1', 'p2'],
        itemCount: 2,
        available: true,
        ownerCompanyId: 'co-a',
        ownerCompanyName: 'Mill',
      },
    });
    const model = buildDesignSetTradeCard(message, message.reference, 'You', {
      designsPath: '/designs/set?ids=p1,p2',
    });
    expect(model.who).toBeNull();
    expect(model.note).toBe('xyz test');
    expect(model.action?.label).toBe('View designs →');
  });

  it('enquire collection omits Order goes to', () => {
    const message = textMessage({
      id: 'c1',
      type: 'collection_card',
      mine: true,
      senderCompanyId: 'me',
      metadata: { enquireNote: 'abc' },
      reference: {
        id: 'col-1',
        kind: 'collection',
        name: 'New Cut — This week',
        image: null,
        images: [],
        itemCount: 6,
        available: true,
        ownerCompanyId: 'co-a',
        ownerCompanyName: 'Ahmedabad Loom Co',
      },
    });
    const model = buildCollectionTradeCard(
      message,
      message.reference,
      'You',
      'Order goes to you',
      { collectionPath: '/collections/col-1' },
    );
    expect(model.who).toBeNull();
    expect(model.details).toEqual(['6 designs']);
    expect(model.note).toBe('abc');
  });
});

describe('buildChatTradeCard dispatcher', () => {
  it('returns null for non-trade card types', () => {
    expect(
      buildChatTradeCard(textMessage({ id: 't1', type: 'text', body: 'hi', mine: false }), null, 'You'),
    ).toBeNull();
  });

  it('builds a complaint card from subject, More, and attached design thumbs', () => {
    const card = buildChatTradeCard(
      textMessage({ id: 'c1', type: 'complaint', body: 'Late lot', mine: true }),
      {
        kind: 'complaint',
        id: 'cmp-1',
        name: 'Late lot',
        image: 'https://img/a.jpg',
        images: ['https://img/a.jpg', 'https://img/navy.jpg'],
        detail: 'Qty short on 29 Sep',
        available: true,
        orderLabel: 'Navy satin · 29 Sep',
        productIds: ['p-navy'],
        orderId: 'ord-navy',
        designItems: [{ id: 'p-navy', name: 'Navy satin', image: 'https://img/navy.jpg' }],
      },
      'You',
      { actions: { openOrder: () => undefined, designsPath: '/designs/set?ids=p-navy' } },
    );
    expect(card?.kind).toBe('complaint');
    expect(card?.who).toBeNull();
    expect(card?.primary).toBe('Late lot');
    expect(card?.details).toEqual(['Navy satin · 29 Sep']);
    expect(card?.note).toBe('Qty short on 29 Sep');
    expect(card?.thumbs).toEqual(['https://img/a.jpg', 'https://img/navy.jpg']);
    expect(card?.thumbCaptions).toEqual([null, 'Navy satin']);
    expect(card?.action?.label).toBe('View order →');
    expect(card?.action?.to).toBeUndefined();
  });

  it('drops Order # on a complaint and uses More + thumbs from metadata', () => {
    const card = buildChatTradeCard(
      {
        ...textMessage({ id: 'c2', type: 'complaint', body: 'Short qty on grey', mine: false }),
        metadata: {
          detail: 'Need 20 more pieces',
          orderLabel: 'Grey · 29 Sep',
          images: ['https://img/grey.jpg'],
          productIds: ['p-grey'],
          orderId: 'ord-grey',
        },
      },
      {
        kind: 'complaint',
        id: 'cmp-2',
        name: 'Short qty on grey',
        image: null,
        available: true,
        orderLabel: 'Order #RUTW',
      },
      'You',
      { actions: { openOrder: () => undefined, designsPath: '/designs/set?ids=p-grey' } },
    );
    expect(card?.who).toBeNull();
    expect(card?.details).toEqual(['Grey · 29 Sep']);
    expect(card?.note).toBe('Need 20 more pieces');
    expect(card?.thumbs).toEqual(['https://img/grey.jpg']);
    expect(card?.action?.label).toBe('View order →');
  });

  it('offers Resolve and Send to supplier on open inbound complaint', () => {
    const escalate = vi.fn();
    const resolve = vi.fn();
    const card = buildChatTradeCard(
      textMessage({
        id: 'c-esc',
        type: 'complaint',
        body: 'Short qty',
        mine: false,
        referenceId: 'cmp-esc',
      }),
      {
        kind: 'complaint',
        id: 'cmp-esc',
        name: 'Short qty',
        image: null,
        available: true,
        status: 'open',
        orderId: 'ord-1',
        orderLabel: 'Silk · 5 Oct',
      },
      'Buyer',
      { actions: { onEscalateComplaint: escalate, onResolveComplaint: resolve } },
    );
    expect(card?.actionRow?.map((a) => a.label)).toEqual(['Resolve', 'Send to supplier']);
    card?.actionRow?.[0]?.onClick?.();
    expect(resolve).toHaveBeenCalledWith('cmp-esc');
    card?.actionRow?.[1]?.onClick?.();
    expect(escalate).toHaveBeenCalledWith('cmp-esc', 'ord-1', null);
  });

  it('hides Resolve when complaint is already resolved', () => {
    const card = buildChatTradeCard(
      textMessage({
        id: 'c-done',
        type: 'complaint',
        body: 'Done',
        mine: true,
        referenceId: 'cmp-done',
      }),
      {
        kind: 'complaint',
        id: 'cmp-done',
        name: 'Done',
        image: null,
        available: true,
        status: 'resolved',
      },
      'You',
      { actions: { onResolveComplaint: () => undefined } },
    );
    expect(card?.actionRow).toBeUndefined();
  });

  it('has no View designs and no View order when no ticket is attached', () => {
    const card = buildChatTradeCard(
      textMessage({ id: 'c3', type: 'complaint', body: 'Late', mine: true }),
      { kind: 'complaint', id: 'cmp-3', name: 'Late', image: null, available: true },
      'You',
      { actions: { designsPath: '/designs/set?ids=p1', openOrder: () => undefined } },
    );
    expect(card?.action).toBeUndefined();
  });
});
