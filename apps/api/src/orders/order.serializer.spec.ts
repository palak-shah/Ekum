import { describe, expect, it } from 'vitest';
import { OrderLineStatus } from '@ekum/domain-types';
import { OrderSerializer } from './order.serializer';
import type { CompanySerializer } from '../access/company.serializer';

describe('OrderSerializer remainingQuantity', () => {
  const serializer = new OrderSerializer({
    toPublicSummary: (c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
      city: null,
      verification: 'unverified',
      superCategories: [],
      avatarUrl: null,
      coverUrl: null,
    }),
  } as unknown as CompanySerializer);

  function orderWithItem(lineStatus: string) {
    return {
      id: 'o1',
      kind: 'standard',
      status: 'confirmed',
      note: null,
      buyerCompanyId: 'buyer',
      sellerCompanyId: 'seller',
      confirmedAt: new Date(),
      confirmedByCompanyId: 'seller',
      deliveredAt: null,
      closedAt: null,
      dispatchedAt: null,
      transporter: null,
      lrNumber: null,
      parcelCount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      buyer: { id: 'buyer', name: 'Buyer' },
      seller: { id: 'seller', name: 'Seller' },
      items: [
        {
          id: 'oi1',
          productId: null,
          name: 'A',
          sku: null,
          rate: null,
          unit: 'pc',
          image: null,
          images: [],
          quantity: { toNumber: () => 10 },
          requestedQuantity: { toNumber: () => 10 },
          lineStatus,
          note: null,
        },
      ],
      shipments: [],
    };
  }

  it('gives remaining qty only for confirmed lines', () => {
    const view = serializer.toOrderView(orderWithItem(OrderLineStatus.Confirmed) as never, 'seller');
    expect(view.items[0]?.remainingQuantity).toBe(10);
  });

  it('gives zero remaining for open lines', () => {
    const view = serializer.toOrderView(orderWithItem(OrderLineStatus.Open) as never, 'seller');
    expect(view.items[0]?.remainingQuantity).toBe(0);
  });

  it('exposes part_shipped when confirmed has partial shipments', () => {
    const base = orderWithItem(OrderLineStatus.Confirmed) as never as {
      status: string;
      shipments: unknown[];
    };
    base.shipments = [
      {
        id: 's1',
        orderId: 'o1',
        transporter: null,
        lrNumber: 'LR-1',
        parcelCount: null,
        dispatchedAt: new Date(),
        items: [
          {
            orderItemId: 'oi1',
            quantity: { toNumber: () => 4 },
            orderItem: { id: 'oi1', name: 'A' },
          },
        ],
      },
    ];
    const view = serializer.toOrderView(base as never, 'seller');
    expect(view.status).toBe('part_shipped');
    expect(view.partiallyShipped).toBe(true);
  });

  it('keeps settled as settled and not part shipped', () => {
    const base = orderWithItem(OrderLineStatus.Dispatched) as never as {
      status: string;
      settledAt: Date | null;
      shipments: unknown[];
      items: Array<{ quantity: { toNumber: () => number }; lineStatus: string }>;
    };
    base.status = 'settled';
    base.settledAt = new Date();
    base.items[0]!.quantity = { toNumber: () => 4 };
    base.items[0]!.lineStatus = OrderLineStatus.Dispatched;
    base.shipments = [
      {
        id: 's1',
        orderId: 'o1',
        transporter: null,
        lrNumber: 'LR-1',
        parcelCount: null,
        dispatchedAt: new Date(),
        items: [
          {
            orderItemId: 'oi1',
            quantity: { toNumber: () => 4 },
            orderItem: { id: 'oi1', name: 'A' },
          },
        ],
      },
    ];
    const view = serializer.toOrderView(base as never, 'seller');
    expect(view.status).toBe('settled');
    expect(view.partiallyShipped).toBe(false);
  });

  it('heals settledAt + lagging part_shipped status to Settled', () => {
    const base = orderWithItem(OrderLineStatus.Dispatched) as never as {
      status: string;
      settledAt: Date | null;
      shipments: unknown[];
      items: Array<{ quantity: { toNumber: () => number }; lineStatus: string }>;
    };
    base.status = 'part_shipped';
    base.settledAt = new Date();
    base.items[0]!.quantity = { toNumber: () => 4 };
    base.items[0]!.lineStatus = OrderLineStatus.Dispatched;
    base.shipments = [
      {
        id: 's1',
        orderId: 'o1',
        transporter: null,
        lrNumber: 'LR-1',
        parcelCount: null,
        dispatchedAt: new Date(),
        items: [
          {
            orderItemId: 'oi1',
            quantity: { toNumber: () => 4 },
            orderItem: { id: 'oi1', name: 'A' },
          },
        ],
      },
    ];
    const view = serializer.toOrderView(base as never, 'seller');
    expect(view.status).toBe('settled');
    expect(view.partiallyShipped).toBe(false);
  });
});
