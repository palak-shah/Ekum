import { describe, expect, it } from 'vitest';
import {
  tradeListFacts,
  tradeListPathMark,
  tradeListPreview,
  tradeListQtyFact,
  tradeListThumbs,
  tradeListWhen,
} from './tradeListPreview';
import type { TradeListItem } from './tradeList';

function orderItem(partial: {
  status?: string;
  direction?: string;
  tradeMode?: string;
  intent?: string;
  updatedAt?: string;
  facilitatorCompanyId?: string | null;
  buyerCompanyId?: string;
  sellerCompanyId?: string;
  downstreamOrderId?: string | null;
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
      facilitatorCompanyId: partial.facilitatorCompanyId ?? null,
      buyerCompanyId: partial.buyerCompanyId ?? 'buyer-co',
      sellerCompanyId: partial.sellerCompanyId ?? 'seller-co',
      downstreamOrderId: partial.downstreamOrderId ?? null,
      counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null },
      items: [{ name: 'Silk', sku: 's1' }],
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: partial.updatedAt ?? '2026-09-07T00:00:00.000Z',
    },
  } as TradeListItem;
}

describe('tradeListPreview', () => {
  it('idle bilateral has no mid context; facts carry id and design count', () => {
    const item = orderItem({ status: 'confirmed', direction: 'buying' });
    const { preview, accent } = tradeListPreview(item, 'buyer-co');
    expect(accent).toBe(false);
    expect(preview).toBe('');
    expect(tradeListFacts(item)).toMatch(/^#\S+ · 1 design$/);
  });

  it('marks I-handle sell as a chain, Direct Link as people, 1:1 as none', () => {
    const handle = orderItem({
      status: 'confirmed',
      direction: 'selling',
      tradeMode: 'manage',
    });
    expect(tradeListPreview(handle, 'trader').preview).toBe('');
    expect(tradeListPathMark(handle, 'trader')).toBe('handle');
    expect(
      tradeListPathMark(
        orderItem({
          direction: 'buying',
          tradeMode: 'bilateral',
          downstreamOrderId: 'parent-1',
        }),
        'trader',
      ),
    ).toBe('handle');
    expect(
      tradeListPathMark(
        orderItem({
          tradeMode: 'direct',
          facilitatorCompanyId: 'trader',
          buyerCompanyId: 'buyer-co',
          sellerCompanyId: 'seller-co',
        }),
        'trader',
      ),
    ).toBe('direct');
    expect(tradeListPathMark(orderItem({ tradeMode: 'bilateral' }), 'buyer-co')).toBeNull();
  });

  it('Needs-you preview stays verb-only for helpers; list UI uses the glance cue', () => {
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
    expect(preview).toBe('Confirm');
    expect(tradeListFacts(item)).toMatch(/^#\S+ · 1 design 10 pcs$/);
  });

  it('facts keep designs and summed qty with middot after the id', () => {
    const item = {
      kind: 'order',
      id: 'cm-vonr',
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
      direction: 'selling',
      order: {
        id: 'cm-vonr',
        status: 'requested',
        direction: 'selling',
        tradeMode: 'bilateral',
        intent: 'order',
        items: [
          { name: 'A', quantity: 7, unit: 'set', lineStatus: 'open' },
          { name: 'B', quantity: 5, unit: 'set', lineStatus: 'open' },
        ],
        counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null },
        createdAt: '2026-09-07T00:00:00.000Z',
        updatedAt: '2026-09-07T00:00:00.000Z',
      },
    } as TradeListItem;
    expect(tradeListFacts(item)).toBe('#VONR · 2 designs 12 sets');
    expect(tradeListFacts(item)).toContain('·');
    const mixed = {
      ...item,
      order: {
        ...item.order,
        items: [
          { name: 'A', quantity: 12, unit: 'set', lineStatus: 'open' },
          { name: 'B', quantity: 8, unit: 'mtr', lineStatus: 'open' },
        ],
      },
    } as TradeListItem;
    expect(tradeListFacts(mixed)).toBe('#VONR · 2 designs');
    expect(
      tradeListQtyFact([
        { quantity: 10, unit: 'mtr', lineStatus: 'open' },
        { quantity: 10, unit: 'mtr', lineStatus: 'open' },
      ]),
    ).toBe('20 mtrs');
    expect(
      tradeListQtyFact([
        { quantity: 12, unit: 'set', lineStatus: 'open' },
        { quantity: 8, unit: 'mtr', lineStatus: 'open' },
      ]),
    ).toBeNull();
  });

  it('prefers updatedAt for when', () => {
    const item = orderItem({
      updatedAt: '2026-09-08T12:00:00.000Z',
    });
    expect(tradeListWhen(item)).toBe('2026-09-08T12:00:00.000Z');
  });

  it('stacks design photos for the list collage', () => {
    const item = {
      kind: 'order',
      id: 'o1',
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
      direction: 'selling',
      order: {
        id: 'o1',
        items: [
          { name: 'A', image: null, images: [] },
          { name: 'B', image: 'https://cdn.example/b.jpg', images: [] },
          { name: 'C', image: 'https://cdn.example/c.jpg', images: [] },
        ],
      },
    } as TradeListItem;
    expect(tradeListThumbs(item)).toEqual({
      urls: ['https://cdn.example/b.jpg', 'https://cdn.example/c.jpg'],
      overflow: 1,
    });
    expect(tradeListThumbs(orderItem({}))).toEqual({ urls: [], overflow: 0 });
  });
});
