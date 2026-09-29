import { describe, expect, it } from 'vitest';
import {
  chatsInboxChipBadge,
  chatsInboxChipCount,
  chatsInboxFromSearch,
  chatsInboxHref,
  filterActiveInbox,
  rememberChatsInbox,
} from './chatsInboxFilter';

describe('filterActiveInbox', () => {
  const rows = [
    { id: '1', unreadCount: 2, type: 'direct' },
    { id: '2', unreadCount: 0, type: 'group' },
    { id: '3', unreadCount: 1, type: 'group' },
  ];

  it('keeps all, unread, or groups', () => {
    expect(filterActiveInbox(rows, 'all').map((row) => row.id)).toEqual(['1', '2', '3']);
    expect(filterActiveInbox(rows, 'unread').map((row) => row.id)).toEqual(['1', '3']);
    expect(filterActiveInbox(rows, 'groups').map((row) => row.id)).toEqual(['2', '3']);
  });

  it('badges Unread chats, unread Groups, and Requests', () => {
    const counts = {
      active: rows,
      pendingCount: 4,
      askCount: 2,
    };
    expect(chatsInboxChipCount('all', counts)).toBe(0);
    expect(chatsInboxChipCount('unread', counts)).toBe(2);
    expect(chatsInboxChipCount('groups', counts)).toBe(1);
    expect(chatsInboxChipCount('requests', counts)).toBe(6);
    expect(chatsInboxChipBadge(0)).toBeNull();
    expect(chatsInboxChipBadge(100)).toBe('99+');
  });

  it('opens Requests from ?inbox=requests', () => {
    expect(chatsInboxFromSearch('inbox=requests')).toBe('requests');
    expect(chatsInboxFromSearch('?inbox=unread')).toBe('unread');
    expect(chatsInboxFromSearch('')).toBe('all');
  });

  it('keeps Groups on the inbox href after leaving a thread', () => {
    rememberChatsInbox('all');
    expect(chatsInboxHref()).toBe('/chats');
    rememberChatsInbox('groups');
    expect(chatsInboxHref()).toBe('/chats?inbox=groups');
    rememberChatsInbox('all');
  });
});
