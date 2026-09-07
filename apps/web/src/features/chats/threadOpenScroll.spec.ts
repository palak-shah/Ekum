import { describe, expect, it } from 'vitest';
import { firstUnreadMessageId, unreadDividerLabel } from './threadOpenScroll';

describe('firstUnreadMessageId', () => {
  const msgs = [
    { id: 'a', createdAt: '2026-01-01T10:00:00.000Z', senderCompanyId: 'them' },
    { id: 'b', createdAt: '2026-01-01T11:00:00.000Z', senderCompanyId: 'me' },
    { id: 'c', createdAt: '2026-01-01T12:00:00.000Z', senderCompanyId: 'them' },
  ];

  it('returns first other-party after lastReadAt', () => {
    expect(
      firstUnreadMessageId(msgs, {
        lastReadAt: '2026-01-01T10:30:00.000Z',
        viewerCompanyId: 'me',
      }),
    ).toBe('c');
  });

  it('skips own messages', () => {
    expect(
      firstUnreadMessageId(msgs, {
        lastReadAt: '2026-01-01T09:00:00.000Z',
        viewerCompanyId: 'me',
      }),
    ).toBe('a');
  });

  it('returns null when none', () => {
    expect(
      firstUnreadMessageId(msgs, {
        lastReadAt: '2026-01-01T13:00:00.000Z',
        viewerCompanyId: 'me',
      }),
    ).toBeNull();
  });
});

describe('unreadDividerLabel', () => {
  it('singular and plural', () => {
    expect(unreadDividerLabel(1)).toBe('1 unread message');
    expect(unreadDividerLabel(3)).toBe('3 unread messages');
  });
});
