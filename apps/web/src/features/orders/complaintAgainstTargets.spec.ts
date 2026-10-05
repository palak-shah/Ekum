import { describe, expect, it } from 'vitest';
import {
  complaintAgainstTargets,
  defaultEscalateSupplier,
  escalateSupplierAlternatives,
} from './complaintAgainstTargets';
import type { OrderMillDeskView, OrderView } from '@ekum/domain-types';

function desk(partial: Partial<OrderMillDeskView> & Pick<OrderMillDeskView, 'upstreamOrderId' | 'sellerCompanyId' | 'sellerName'>): OrderMillDeskView {
  return {
    held: false,
    passHeld: false,
    reveal: false,
    revealThreadId: null,
    status: 'confirmed',
    itemIds: [],
    confirmedCount: 0,
    declinedCount: 0,
    millQuoted: false,
    lines: [],
    ...partial,
  };
}

function baseOrder(partial: Partial<OrderView> = {}): OrderView {
  return {
    id: 'ord-main',
    kind: 'standard',
    intent: 'order',
    status: 'confirmed',
    tradeMode: 'bilateral',
    buyerCompanyId: 'buyer-1',
    sellerCompanyId: 'seller-1',
    buyerName: 'Buyer Shop',
    sellerName: 'Seller Shop',
    direction: 'buying',
    counterpart: { id: 'seller-1', name: 'Seller Shop' } as OrderView['counterpart'],
    items: [],
    shipments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  } as OrderView;
}

describe('complaintAgainstTargets', () => {
  it('bilateral buyer → other party only', () => {
    const targets = complaintAgainstTargets(baseOrder(), 'buyer-1');
    expect(targets).toEqual([
      {
        companyId: 'seller-1',
        name: 'Seller Shop',
        role: 'shop',
        orderId: 'ord-main',
      },
    ]);
  });

  it('manage buyer with blank mill names → trader only', () => {
    const targets = complaintAgainstTargets(
      baseOrder({
        tradeMode: 'manage',
        sellerName: 'Trader Co',
        millDesks: [desk({ upstreamOrderId: 'lot-1', sellerCompanyId: 'mill-1', sellerName: '' })],
      }),
      'buyer-1',
    );
    expect(targets.map((t) => t.role)).toEqual(['trader']);
  });

  it('manage buyer with visible mill → trader + supplier', () => {
    const targets = complaintAgainstTargets(
      baseOrder({
        tradeMode: 'manage',
        sellerName: 'Trader Co',
        millDesks: [
          desk({
            upstreamOrderId: 'lot-1',
            sellerCompanyId: 'mill-1',
            sellerName: 'Mill A',
            reveal: true,
          }),
        ],
      }),
      'buyer-1',
    );
    expect(targets.map((t) => t.companyId)).toEqual(['seller-1', 'mill-1']);
    expect(targets[1]?.orderId).toBe('lot-1');
  });

  it('trader desk → buyer + released mills', () => {
    const targets = complaintAgainstTargets(
      baseOrder({
        tradeMode: 'manage',
        direction: 'selling',
        millDesks: [
          desk({ upstreamOrderId: 'lot-1', sellerCompanyId: 'mill-1', sellerName: 'Mill A' }),
          desk({
            upstreamOrderId: 'lot-2',
            sellerCompanyId: 'mill-2',
            sellerName: 'Mill B',
            held: true,
          }),
        ],
      }),
      'seller-1',
    );
    expect(targets.map((t) => t.companyId)).toEqual(['buyer-1', 'mill-1']);
  });
});

describe('defaultEscalateSupplier', () => {
  it('prefers mill lot when attached order is that lot', () => {
    const order = baseOrder({
      tradeMode: 'manage',
      direction: 'selling',
      millDesks: [
        desk({ upstreamOrderId: 'lot-a', sellerCompanyId: 'mill-a', sellerName: 'Mill A' }),
        desk({ upstreamOrderId: 'lot-b', sellerCompanyId: 'mill-b', sellerName: 'Mill B' }),
      ],
    });
    expect(defaultEscalateSupplier(order, 'seller-1', { orderId: 'lot-b' })?.companyId).toBe(
      'mill-b',
    );
  });

  it('picks the mill that owns the complaint designs', () => {
    const order = baseOrder({
      tradeMode: 'manage',
      direction: 'selling',
      items: [
        { id: 'oi-a', productId: 'p-a', name: 'A' },
        { id: 'oi-b', productId: 'p-b', name: 'B' },
      ] as OrderView['items'],
      millDesks: [
        desk({
          upstreamOrderId: 'lot-a',
          sellerCompanyId: 'mill-a',
          sellerName: 'Mill A',
          itemIds: ['oi-a'],
          lines: [{ parentItemId: 'oi-a', millRate: 10, millQuantity: 1, millDeclined: false }],
        }),
        desk({
          upstreamOrderId: 'lot-b',
          sellerCompanyId: 'mill-b',
          sellerName: 'Mill B',
          itemIds: ['oi-b'],
          lines: [{ parentItemId: 'oi-b', millRate: 10, millQuantity: 1, millDeclined: false }],
        }),
      ],
    });
    expect(
      defaultEscalateSupplier(order, 'seller-1', { productIds: ['p-b'] })?.companyId,
    ).toBe('mill-b');
  });

  it('falls back to first released mill when ambiguous', () => {
    const order = baseOrder({
      tradeMode: 'manage',
      direction: 'selling',
      millDesks: [
        desk({ upstreamOrderId: 'lot-a', sellerCompanyId: 'mill-a', sellerName: 'Mill A' }),
        desk({ upstreamOrderId: 'lot-b', sellerCompanyId: 'mill-b', sellerName: 'Mill B' }),
      ],
    });
    expect(defaultEscalateSupplier(order, 'seller-1')?.companyId).toBe('mill-a');
  });

  it('lists other mills for Change after a default is chosen', () => {
    const order = baseOrder({
      tradeMode: 'manage',
      direction: 'selling',
      millDesks: [
        desk({ upstreamOrderId: 'lot-a', sellerCompanyId: 'mill-a', sellerName: 'Mill A' }),
        desk({ upstreamOrderId: 'lot-b', sellerCompanyId: 'mill-b', sellerName: 'Mill B' }),
      ],
    });
    const chosen = defaultEscalateSupplier(order, 'seller-1', { orderId: 'lot-a' });
    expect(chosen?.companyId).toBe('mill-a');
    expect(
      escalateSupplierAlternatives(order, 'seller-1', chosen!.companyId).map((m) => m.companyId),
    ).toEqual(['mill-b']);
  });
});
