import { describe, expect, it } from 'vitest';
import { kindFacetFromNeedle, tradeMatchesFind, type TradeFindState } from './tradeFind';
import type { TradeListItem } from './tradeList';

const emptyFind = (): TradeFindState => ({
  needle: '',
  kindFacet: null,
  statusFacet: null,
  dateFacet: null,
});

function orderItem(partial: { tradeMode: string; direction: string }): TradeListItem {
  return {
    kind: 'order',
    id: 'ord-1',
    createdAt: '2026-09-07T00:00:00.000Z',
    direction: partial.direction,
    order: {
      id: 'ord-1',
      tradeMode: partial.tradeMode,
      direction: partial.direction,
      intent: 'order',
      status: 'requested',
      counterpart: { name: 'Jaipur Emporium' },
      items: [{ name: 'Silk', sku: 's1' }],
    },
  } as TradeListItem;
}

describe('kindFacetFromNeedle', () => {
  it('treats linked as Trading', () => {
    expect(kindFacetFromNeedle('linked')).toBe('trading');
    expect(kindFacetFromNeedle('Trading')).toBe('trading');
    expect(kindFacetFromNeedle('sample')).toBe('sample');
    expect(kindFacetFromNeedle('Surat')).toBeNull();
  });
});

describe('tradeMatchesFind Trading', () => {
  it('keeps I-handle sell tickets only', () => {
    const find = { ...emptyFind(), kindFacet: 'trading' as const };
    expect(
      tradeMatchesFind(orderItem({ tradeMode: 'manage', direction: 'selling' }), find),
    ).toBe(true);
    expect(
      tradeMatchesFind(orderItem({ tradeMode: 'bilateral', direction: 'selling' }), find),
    ).toBe(false);
    expect(
      tradeMatchesFind(orderItem({ tradeMode: 'manage', direction: 'buying' }), find),
    ).toBe(false);
  });
});
