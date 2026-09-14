import { describe, expect, it } from 'vitest';
import { MessageType, type CrossChatFindItemView } from '@ekum/domain-types';
import { expandFindPhotoCells } from './ChatFindPage';

describe('expandFindPhotoCells', () => {
  it('expands album messages into one cell per url', () => {
    const rows: CrossChatFindItemView[] = [
      {
        threadId: 't1',
        threadTitle: null,
        counterpartName: 'Ravi',
        message: {
          id: 'm1',
          threadId: 't1',
          senderCompanyId: 'c1',
          type: MessageType.Photo,
          body: null,
          reference: null,
          metadata: { urls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] },
          createdAt: '2026-09-01T10:00:00.000Z',
          mine: true,
          actor: null,
          replyTo: null,
        },
      },
    ];
    const cells = expandFindPhotoCells(rows);
    expect(cells).toHaveLength(2);
    expect(cells[0]?.messageId).toBe('m1');
    expect(cells[1]?.url).toContain('b.jpg');
  });
});
