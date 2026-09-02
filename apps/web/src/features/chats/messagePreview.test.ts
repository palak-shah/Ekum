import { describe, expect, it } from 'vitest';
import type { MessageView } from '@ekum/domain-types';
import {
  inboxPreviewTypeKey,
  messagePreviewText,
  outboundMessageLabel,
  inCardSenderLine,
} from './messagePreview';

function message(partial: Partial<MessageView>): MessageView {
  return {
    id: 'm1',
    threadId: 't1',
    senderCompanyId: 'co-a',
    type: 'text',
    body: 'Hello',
    reference: null,
    metadata: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    mine: true,
    actor: null,
    replyTo: null,
    ...partial,
  };
}

describe('outboundMessageLabel', () => {
  it('shows teammate name when actor is set', () => {
    expect(outboundMessageLabel(message({ actor: { id: 'u1', name: 'Ravi' } }))).toBe('Ravi');
  });

  it('falls back to You for the sender', () => {
    expect(outboundMessageLabel(message({ mine: true, actor: null }))).toBe('You');
  });
});

describe('inCardSenderLine', () => {
  it('shows teammate inside outgoing cards', () => {
    expect(inCardSenderLine(message({ actor: { id: 'u1', name: 'Ravi' } }), 'Surat Silk House')).toBe(
      'Ravi',
    );
  });

  it('omits line for your own messages', () => {
    expect(inCardSenderLine(message({ mine: true, actor: null }), 'Surat Silk House')).toBeNull();
  });

  it('shows business name on incoming cards', () => {
    expect(inCardSenderLine(message({ mine: false }), 'Jaipur Emporium')).toBe('Jaipur Emporium');
  });
});

describe('messagePreviewText actor prefix', () => {
  it('prefixes teammate name on outgoing previews', () => {
    expect(
      messagePreviewText(message({ actor: { id: 'u1', name: 'Ravi' }, body: 'On my way' })),
    ).toBe('Ravi · On my way');
  });

  it('keeps You for own messages', () => {
    expect(messagePreviewText(message({ body: 'On my way' }))).toBe('You · On my way');
  });
});

describe('inboxPreviewTypeKey', () => {
  it('returns null for text messages', () => {
    expect(inboxPreviewTypeKey(message({ type: 'text' }))).toBeNull();
    expect(inboxPreviewTypeKey(null)).toBeNull();
  });

  it('passes card types through unchanged', () => {
    expect(inboxPreviewTypeKey(message({ type: 'collection_card' }))).toBe('collection_card');
    expect(inboxPreviewTypeKey(message({ type: 'product_card' }))).toBe('product_card');
    expect(inboxPreviewTypeKey(message({ type: 'order_card' }))).toBe('order_card');
  });

  it('maps legacy system order notices to order_card', () => {
    expect(
      inboxPreviewTypeKey(
        message({
          type: 'system',
          reference: { id: 'ord-1', kind: 'order', name: 'Order #35RY' },
        }),
      ),
    ).toBe('order_card');
    expect(
      inboxPreviewTypeKey(
        message({
          type: 'system',
          reference: { id: 'ord-2', kind: 'other', name: 'Lines' },
          metadata: { kind: 'order_lines' },
        }),
      ),
    ).toBe('order_card');
  });

  it('keeps non-order system messages as system', () => {
    expect(inboxPreviewTypeKey(message({ type: 'system', body: 'Joined the chat' }))).toBe('system');
  });
});
