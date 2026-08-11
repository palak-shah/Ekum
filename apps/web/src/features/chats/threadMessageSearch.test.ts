import { describe, expect, it } from 'vitest';
import { messageMatchesSearch } from './threadMessageSearch';

describe('messageMatchesSearch', () => {
  it('returns false for empty query', () => {
    expect(
      messageMatchesSearch(
        {
          id: 'm1',
          threadId: 't1',
          senderCompanyId: 'c1',
          type: 'text',
          body: 'hello',
          reference: null,
          metadata: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          mine: true,
          replyTo: null,
        },
        '   ',
      ),
    ).toBe(false);
  });
});
