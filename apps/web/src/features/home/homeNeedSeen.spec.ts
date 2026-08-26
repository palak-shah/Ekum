import { beforeEach, describe, expect, it } from 'vitest';
import type { HomeNeedItem } from './homeAttention';
import { filterSeenHomeNeeds, markHomeNeedSeen } from './homeNeedSeen';

const COMPANY = 'co-ravi';

function need(id: string, sortAt: string): HomeNeedItem {
  return {
    id,
    kind: 'dispatch',
    title: '2 to dispatch · Jaipur Emporium',
    subtitle: null,
    to: '/orders?filter=needs',
    sortAt,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('homeNeedSeen', () => {
  it('hides a need after it is marked seen at the same activity time', () => {
    const row = need('order-group-jaipur-dispatch', '2026-08-22T08:00:00.000Z');
    markHomeNeedSeen(COMPANY, row.id, row.sortAt);
    expect(filterSeenHomeNeeds(COMPANY, [row])).toEqual([]);
  });

  it('re-shows when the bucket has newer activity', () => {
    const id = 'order-group-jaipur-dispatch';
    markHomeNeedSeen(COMPANY, id, '2026-08-22T08:00:00.000Z');
    const newer = need(id, '2026-08-23T08:00:00.000Z');
    expect(filterSeenHomeNeeds(COMPANY, [newer])).toEqual([newer]);
  });
});
