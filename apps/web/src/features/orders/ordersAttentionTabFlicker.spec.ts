import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import {
  matchesTradeCompleted,
  matchesTradePending,
  toTradeItems,
} from './tradeList';

/**
 * BM flicker: Pending/Completed must filter from the same status the chip shows.
 * Deferring only the list caused EmptyState ↔ rows flash when one tab was empty.
 */
function filterByAttention(
  items: ReturnType<typeof toTradeItems>,
  status: 'pending' | 'completed',
) {
  return items.filter((item) =>
    status === 'pending' ? matchesTradePending(item) : matchesTradeCompleted(item),
  );
}

function order(partial: Partial<OrderView>): OrderView {
  return {
    id: 'o1',
    status: 'requested',
    direction: 'selling',
    createdAt: '2026-01-01T00:00:00.000Z',
    items: [],
    ...partial,
  } as OrderView;
}

describe('orders attention tab filter (no flicker)', () => {
  it('switches pending ↔ completed without an intermediate empty set when both have rows', () => {
    const items = toTradeItems(
      [
        order({ id: 'open', status: 'requested' }),
        order({ id: 'done', status: 'dispatched' }),
      ],
      [],
      [],
    );
    const pending = filterByAttention(items, 'pending');
    const completed = filterByAttention(items, 'completed');
    expect(pending.map((row) => row.id)).toEqual(['open']);
    expect(completed.map((row) => row.id)).toEqual(['done']);
    // Same input list — both tabs non-empty; UI must not briefly show EmptyState
    // when the chip already moved (regression guard for deferred listStatus).
    expect(pending.length).toBeGreaterThan(0);
    expect(completed.length).toBeGreaterThan(0);
  });

  it('keeps pending/completed split when a direction filter is applied', () => {
    const items = toTradeItems(
      [
        order({ id: 'open-buy', status: 'requested', direction: 'buying' }),
        order({ id: 'open-sell', status: 'requested', direction: 'selling' }),
        order({ id: 'done-buy', status: 'dispatched', direction: 'buying' }),
      ],
      [],
      [],
    );
    const buyPending = items.filter(
      (row) => row.direction === 'buying' && matchesTradePending(row),
    );
    expect(buyPending.map((row) => row.id)).toEqual(['open-buy']);
  });
});
