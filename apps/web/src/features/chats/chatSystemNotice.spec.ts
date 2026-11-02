import { describe, expect, it } from 'vitest';
import { textMessage } from '@/test/messageFixtures';
import {
  isChatSystemNotice,
  isOrderTaggedUpdate,
  orderTagQuotePreview,
  orderTaggedUpdateText,
} from './chatSystemNotice';

describe('isChatSystemNotice', () => {
  it('treats leave lines as centered notices', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        body: 'Priya left',
        metadata: { kind: 'member_left' },
      } as never),
    ).toBe(true);
    expect(
      isChatSystemNotice({
        type: 'system',
        metadata: { kind: 'company_left', companyId: 'c1' },
      }),
    ).toBe(true);
  });

  it('keeps company-side and order/ask system cards out', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        metadata: { side: 'company', companyId: 'c1' },
      }),
    ).toBe(false);
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_lines' },
      }),
    ).toBe(false);
  });

  it('does not treat order_lifecycle or notes as centered notices', () => {
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_lifecycle', event: 'lines_decided' },
      }),
    ).toBe(false);
    expect(
      isChatSystemNotice({
        type: 'system',
        referenceId: 'o1',
        metadata: { kind: 'order_note', event: 'noted' },
      }),
    ).toBe(false);
    expect(
      isOrderTaggedUpdate({
        type: 'system',
        metadata: { kind: 'order_lifecycle', event: 'order_dispatched' },
      }),
    ).toBe(true);
  });

  it('rewrites note and dispatch copy with You / shop', () => {
    expect(
      orderTaggedUpdateText(
        textMessage({
          id: 'n1',
          type: 'system',
          mine: true,
          body: 'Buyer added a note',
          metadata: { kind: 'order_note', actorLabel: 'Buyer' },
        }),
      ),
    ).toBe('You added a note');
    expect(
      orderTaggedUpdateText(
        textMessage({
          id: 'd1',
          type: 'system',
          mine: false,
          body: 'Seller dispatched',
          metadata: { kind: 'order_lifecycle', event: 'order_dispatched', actorLabel: 'Ravi' },
          reference: { counterpartName: 'Ravi Silk' } as never,
        }),
      ),
    ).toBe('Ravi dispatched');
  });

  it('order tag preview is Order # not Reply chrome data', () => {
    const preview = orderTagQuotePreview(
      textMessage({
        id: 't1',
        type: 'system',
        metadata: { kind: 'order_lifecycle', event: 'order_dispatched', livingMessageId: 'live' },
        replyTo: {
          id: 'live',
          type: 'order_card',
          bodyPreview: 'Quote',
          available: true,
        },
        reference: {
          kind: 'order',
          id: 'o1',
          name: 'Order #15P1',
          image: null,
          available: true,
          orderLabel: 'Order #15P1',
        },
      }),
    );
    expect(preview?.bodyPreview).toBe('Order #15P1');
    expect(preview?.id).toBe('live');
  });
});
