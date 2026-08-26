import { describe, expect, it } from 'vitest';
import type { ThreadSummary } from '@ekum/domain-types';
import { rankShareChats } from './rankShareChats';

function row(id: string, lastMessageAt: string, pinned = false): ThreadSummary {
  return {
    id,
    title: id,
    pinned,
    unreadCount: 0,
    lastMessageAt,
    lastMessage: null,
    counterpart: null,
    state: 'active',
  } as ThreadSummary;
}

describe('rankShareChats', () => {
  it('puts pinned chats first, then the most recent', () => {
    const ranked = rankShareChats([
      row('old-pinned', '2026-08-01T10:00:00.000Z', true),
      row('fresh', '2026-08-22T12:00:00.000Z'),
      row('mid', '2026-08-10T09:00:00.000Z'),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(['old-pinned', 'fresh', 'mid']);
  });
});
