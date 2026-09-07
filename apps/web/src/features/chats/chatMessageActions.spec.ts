import { describe, expect, it } from 'vitest';
import type { MessageView } from '@ekum/domain-types';
import {
  MAX_FORWARD_BATCH,
  canCopyMessage,
  canDeleteForEveryone,
  canEditMessage,
  canForwardMessage,
  copyTextForMessage,
  forwardPayload,
} from './chatMessageActions';

function base(partial: Partial<MessageView> & Pick<MessageView, 'type'>): MessageView {
  return {
    id: 'm1',
    threadId: 't1',
    senderCompanyId: 'c1',
    body: null,
    mine: false,
    createdAt: new Date().toISOString(),
    actor: null,
    replyTo: null,
    reference: null,
    metadata: null,
    ...partial,
  } as MessageView;
}

describe('canForwardMessage', () => {
  it('allows text with body', () => {
    expect(canForwardMessage(base({ type: 'text', body: 'hi' }))).toBe(true);
  });

  it('allows available order cards', () => {
    expect(
      canForwardMessage(
        base({
          type: 'order_card',
          reference: {
            kind: 'order',
            id: 'o1',
            name: 'Order #ABCD',
            image: null,
            available: true,
          },
        }),
      ),
    ).toBe(true);
  });

  it('blocks unavailable orders', () => {
    expect(
      canForwardMessage(
        base({
          type: 'order_card',
          reference: {
            kind: 'order',
            id: 'o1',
            name: 'Unavailable',
            image: null,
            available: false,
          },
        }),
      ),
    ).toBe(false);
  });

  it('blocks deleted for everyone', () => {
    expect(canForwardMessage(base({ type: 'text', body: 'x', deletedForEveryone: true }))).toBe(
      false,
    );
  });
});

describe('forwardPayload', () => {
  it('forwards text body', () => {
    expect(forwardPayload(base({ type: 'text', body: 'hello' }))).toEqual({
      type: 'text',
      body: 'hello',
    });
  });
});

describe('copy', () => {
  it('copies text', () => {
    const msg = base({ type: 'text', body: 'copy me' });
    expect(canCopyMessage(msg)).toBe(true);
    expect(copyTextForMessage(msg)).toBe('copy me');
  });
});

describe('MAX_FORWARD_BATCH', () => {
  it('caps at 10', () => {
    expect(MAX_FORWARD_BATCH).toBe(10);
  });
});

describe('edit / delete windows', () => {
  it('allows edit on own recent text', () => {
    const msg = base({
      type: 'text',
      body: 'hi',
      mine: true,
      createdAt: new Date().toISOString(),
    });
    expect(canEditMessage(msg)).toBe(true);
  });

  it('rejects edit after 15 minutes', () => {
    const msg = base({
      type: 'text',
      body: 'hi',
      mine: true,
      createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    });
    expect(canEditMessage(msg)).toBe(false);
  });

  it('allows delete for everyone within 1 hour', () => {
    const msg = base({
      type: 'text',
      body: 'hi',
      mine: true,
      createdAt: new Date().toISOString(),
    });
    expect(canDeleteForEveryone(msg)).toBe(true);
  });

  it('rejects delete for everyone after 1 hour', () => {
    const msg = base({
      type: 'text',
      body: 'hi',
      mine: true,
      createdAt: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
    });
    expect(canDeleteForEveryone(msg)).toBe(false);
  });
});
