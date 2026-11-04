import { describe, expect, it } from 'vitest';
import {
  diversifyNewestThenFill,
  olderThanActivityWhere,
  parseFeedCursor,
} from './explore-feed-page';

describe('diversifyNewestThenFill', () => {
  it('keeps one newest row per company before filling', () => {
    const rows = [
      { id: 'a1', companyId: 'ss' },
      { id: 'a2', companyId: 'ss' },
      { id: 'b1', companyId: 'al' },
      { id: 'a3', companyId: 'ss' },
      { id: 'b2', companyId: 'al' },
    ];
    expect(
      diversifyNewestThenFill(rows, (row) => row.companyId, 4).map((row) => row.id),
    ).toEqual(['a1', 'b1', 'a2', 'a3']);
  });

  it('returns empty when limit is zero', () => {
    expect(diversifyNewestThenFill([{ id: '1', companyId: 'x' }], (r) => r.companyId, 0)).toEqual(
      [],
    );
  });
});

describe('parseFeedCursor', () => {
  it('parses collection and product cursors', () => {
    expect(parseFeedCursor('c:pack-1')).toEqual({ kind: 'collection', entityId: 'pack-1' });
    expect(parseFeedCursor('p:design-9')).toEqual({ kind: 'product', entityId: 'design-9' });
    expect(parseFeedCursor('x:nope')).toBeNull();
  });
});

describe('olderThanActivityWhere', () => {
  it('builds activity then id keyset', () => {
    const at = new Date('2026-11-01T00:00:00.000Z');
    expect(olderThanActivityWhere(at, 'id-9', 'exploreActivityAt')).toEqual({
      OR: [
        { exploreActivityAt: { lt: at } },
        { AND: [{ exploreActivityAt: at }, { id: { lt: 'id-9' } }] },
      ],
    });
  });
});
