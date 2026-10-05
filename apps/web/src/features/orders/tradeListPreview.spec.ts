import { describe, expect, it } from 'vitest';
import { tradeListFacts, tradeListPreview, tradeListWhen } from './tradeListPreview';
import type { TradeListItem } from './tradeList';

function orderItem(partial: {
  status?: string;
  direction?: string;
  tradeMode?: string;
  intent?: string;
  updatedAt?: string;
}): TradeListItem {
  return {
    kind: 'order',
    id: 'ord-1',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-09-07T00:00:00.000Z',
    direction: partial.direction ?? 'buying',
    order: {
      id: 'ord-1',
      tradeMode: partial.tradeMode ?? 'bilateral',
      direction: partial.direction ?? 'buying',
      intent: partial.intent ?? 'order',
      status: partial.status ?? 'requested',
      counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null },
      items: [{ name: 'Silk', sku: 's1' }],
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: partial.updatedAt ?? '2026-09-07T00:00:00.000Z',
    },
  } as TradeListItem;
}

describe('tradeListPreview', () => {
  it('joins role and status when idle; facts carry id and design count', () => {
    const item = orderItem({ status: 'confirmed', direction: 'buying' });
    const { preview, accent } = tradeListPreview(item, 'buyer-co');
    expect(accent).toBe(false);
    expect(preview).toContain('You buy');
    expect(preview).toMatch(/Confirmed/i);
    expect(preview).not.toMatch(/Order #/);
    expect(tradeListFacts(item)).toMatch(/Order #/);
    expect(tradeListFacts(item)).toContain('1 design');
  });

  it('marks I-handle sell as Trading', () => {
    const item = orderItem({
      status: 'confirmed',
      direction: 'selling',
      tradeMode: 'manage',
    });
    expect(tradeListPreview(item, 'trader').preview).toContain('Trading');
  });

  it('uses Needs you as the only preview when they must act', () => {
    const item = {
      kind: 'order',
      id: 'o1',
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
      direction: 'selling',
      order: {
        id: 'o1',
        status: 'requested',
        direction: 'selling',
        tradeMode: 'bilateral',
        intent: 'order',
        items: [
          {
            id: 'oi1',
            name: 'A',
            quantity: 10,
            requestedQuantity: 10,
            shippedQuantity: 0,
            remainingQuantity: 10,
            lineStatus: 'open',
            rate: null,
            unit: 'pc',
            sku: null,
            productId: 'p1',
            images: [],
            note: null,
          },
        ],
        counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null },
        createdAt: '2026-09-07T00:00:00.000Z',
        updatedAt: '2026-09-07T00:00:00.000Z',
      },
    } as TradeListItem;
    const { preview, accent } = tradeListPreview(item, 'seller-co');
    expect(accent).toBe(true);
    expect(preview).toBe('Needs you · Send quote');
    expect(tradeListFacts(item)).toMatch(/Order #/);
    expect(tradeListFacts(item)).toContain('1 design');
  });

  it('prefers updatedAt for when', () => {
    const item = orderItem({
      updatedAt: '2026-09-08T12:00:00.000Z',
    });
    expect(tradeListWhen(item)).toBe('2026-09-08T12:00:00.000Z');
  });
});
