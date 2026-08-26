import { describe, expect, it } from 'vitest';
import { ConversationSerializer } from './conversation.serializer';
import type { CompanySerializer } from '../access/company.serializer';

function serializer() {
  return new ConversationSerializer({} as CompanySerializer);
}

describe('ConversationSerializer.toMessageView actor', () => {
  const base = {
    id: 'm1',
    threadId: 't1',
    senderCompanyId: 'co-a',
    type: 'text',
    body: 'Hi',
    referenceId: null,
    metadata: null,
    replyToMessageId: null,
    createdAt: new Date('2026-01-01'),
  };

  it('hides actor from the other company', () => {
    const view = serializer().toMessageView(
      { ...base, senderUserId: 'u-ravi', senderName: 'Ravi' },
      'co-b',
      'u-meena',
      null,
    );
    expect(view.mine).toBe(false);
    expect(view.actor).toBeNull();
  });

  it('shows teammate actor to staff on the same company', () => {
    const view = serializer().toMessageView(
      { ...base, senderUserId: 'u-ravi', senderName: 'Ravi' },
      'co-a',
      'u-amit',
      null,
    );
    expect(view.mine).toBe(true);
    expect(view.actor).toEqual({ id: 'u-ravi', name: 'Ravi' });
  });

  it('omits actor for the sender themself', () => {
    const view = serializer().toMessageView(
      { ...base, senderUserId: 'u-ravi', senderName: 'Ravi' },
      'co-a',
      'u-ravi',
      null,
    );
    expect(view.mine).toBe(true);
    expect(view.actor).toBeNull();
  });
});
