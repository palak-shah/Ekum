import { describe, expect, it } from 'vitest';
import { OrderChatEvent, type MessageView, type ThreadSummary } from '@ekum/domain-types';
import {
  filterThreadsBySearch,
  threadDisplayTitle,
  threadSearchHaystack,
} from './chatsListSearch';

function thread(partial: Partial<ThreadSummary>): ThreadSummary {
  return {
    id: 't1',
    type: 'direct',
    visibility: 'shared',
    title: null,
    state: 'active',
    alertLevel: 'all',
    pinned: false,
    unreadCount: 0,
    lastMessage: null,
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    counterpart: {
      id: 'c1',
      name: 'Ahmedabad Loom Co',
      city: 'Ahmedabad',
      verification: 'verified',
      logoUrl: null,
    },
    participantCount: 2,
    ...partial,
  };
}

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

describe('threadDisplayTitle', () => {
  it('falls back to counterpart when title is empty or whitespace', () => {
    expect(threadDisplayTitle(thread({ title: '' }))).toBe('Ahmedabad Loom Co');
    expect(threadDisplayTitle(thread({ title: '   ' }))).toBe('Ahmedabad Loom Co');
  });

  it('uses trimmed custom title for groups', () => {
    expect(threadDisplayTitle(thread({ title: '  Ahmedabad trio  ' }))).toBe('Ahmedabad trio');
  });
});

describe('filterThreadsBySearch', () => {
  it('matches business name case-insensitively', () => {
    const rows = [thread({})];
    expect(filterThreadsBySearch(rows, 'AHMEDABAD')).toHaveLength(1);
    expect(filterThreadsBySearch(rows, 'loom co')).toHaveLength(1);
  });

  it('matches order ref in last-message preview case-insensitively', () => {
    const rows = [
      thread({
        lastMessage: message({
          type: 'order_card',
          reference: {
            kind: 'order',
            id: 'o1',
            name: null,
            image: null,
            available: true,
            orderLabel: 'Order #OKYD',
            event: OrderChatEvent.OrderRequested,
            eventLabel: 'Requested',
          },
        }),
      }),
    ];
    expect(filterThreadsBySearch(rows, 'okyd')).toHaveLength(1);
    expect(filterThreadsBySearch(rows, 'REQUESTED')).toHaveLength(1);
  });

  it('matches counterpart city', () => {
    const rows = [
      thread({
        title: 'Ring Road Silks',
        counterpart: {
          id: 'c2',
          name: 'Ring Road Silks',
          city: 'Surat',
          verification: 'verified',
          logoUrl: null,
        },
      }),
    ];
    expect(filterThreadsBySearch(rows, 'surat')).toHaveLength(1);
  });

  it('matches counterpart name when group title is set', () => {
    const rows = [
      thread({
        title: 'Ahmedabad trio',
        counterpart: {
          id: 'c1',
          name: 'Ahmedabad Loom Co',
          city: 'Ahmedabad',
          verification: 'verified',
          logoUrl: null,
        },
      }),
    ];
    expect(filterThreadsBySearch(rows, 'loom')).toHaveLength(1);
  });
});

describe('threadSearchHaystack', () => {
  it('normalizes to lowercase', () => {
    expect(threadSearchHaystack(thread({}))).toContain('ahmedabad loom co');
  });
});
