import { describe, expect, it } from 'vitest';
import {
  highlightSearchText,
  messageMatchesSearch,
  searchHitIdsNewestFirst,
} from './threadMessageSearch';
import { textMessage } from '@/test/messageFixtures';

describe('messageMatchesSearch', () => {
  it('returns false for empty query', () => {
    expect(messageMatchesSearch(textMessage({ id: 'm1', body: 'hello' }), '   ')).toBe(false);
  });

  it('matches body case-insensitively', () => {
    expect(messageMatchesSearch(textMessage({ id: 'a', body: 'Banarasi silk' }), 'banarasi')).toBe(
      true,
    );
  });
});

describe('searchHitIdsNewestFirst', () => {
  it('returns hit ids newest-first', () => {
    const messages = [
      textMessage({ id: 'old', body: 'silk', createdAt: '2026-01-01T00:00:00.000Z' }),
      textMessage({ id: 'mid', body: 'cotton', createdAt: '2026-01-02T00:00:00.000Z' }),
      textMessage({ id: 'new', body: 'silk', createdAt: '2026-01-03T00:00:00.000Z' }),
    ];
    expect(searchHitIdsNewestFirst(messages, 'silk')).toEqual(['new', 'old']);
  });
});

describe('highlightSearchText', () => {
  it('wraps matches', () => {
    const node = highlightSearchText('Order #ECNL', 'ecnl');
    expect(node).not.toBe('Order #ECNL');
  });
});
