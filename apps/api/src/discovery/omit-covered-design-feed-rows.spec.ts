import { describe, expect, it } from 'vitest';
import { omitCoveredDesignFeedRows } from './omit-covered-design-feed-rows';

describe('omitCoveredDesignFeedRows', () => {
  it('drops a design that is already on a live pack in the same feed', () => {
    const rows = [
      { kind: 'collection', feedId: 'c:pack' },
      { kind: 'product', feedId: 'p:d1', product: { id: 'd1' } },
      { kind: 'product', feedId: 'p:d2', product: { id: 'd2' } },
    ];
    expect(omitCoveredDesignFeedRows(rows, new Set(['d1']))).toEqual([
      { kind: 'collection', feedId: 'c:pack' },
      { kind: 'product', feedId: 'p:d2', product: { id: 'd2' } },
    ]);
  });

  it('keeps solo designs when no pack on this feed covers them', () => {
    const rows = [{ kind: 'product', product: { id: 'd1' } }];
    expect(omitCoveredDesignFeedRows(rows, new Set())).toEqual(rows);
  });
});
