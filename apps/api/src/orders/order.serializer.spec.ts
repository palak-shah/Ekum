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

  it('marks a later-hidden catalog design as no longer available', () => {
    const row = orderWithItem(OrderLineStatus.Confirmed) as never as {
      items: Array<{ productId: string | null }>;
    };
    row.items[0]!.productId = 'p-gone';
    const view = serializer.toOrderView(
      row as never,
      'seller',
      null,
      null,
      new Map([['p-gone', 'draft']]),
    );
    expect(view.items[0]?.unavailableReason).toBe('No longer available');
    expect(view.items[0]?.available).toBe(false);
  });

  it('exposes order.transporter before any shipment', () => {
    const base = orderWithItem(OrderLineStatus.Open) as never as { transporter: string | null };
    base.transporter = 'VRL Logistics';
    const view = serializer.toOrderView(base as never, 'buyer');
    expect(view.transporter).toBe('VRL Logistics');
    expect(view.dispatch).toBeNull();
  });

  it('gives remaining qty only for confirmed lines', () => {
    const view = serializer.toOrderView(orderWithItem(OrderLineStatus.Confirmed) as never, 'seller');
    expect(view.items[0]?.remainingQuantity).toBe(10);
  });

  it('gives zero remaining for open lines', () => {
    const view = serializer.toOrderView(orderWithItem(OrderLineStatus.Open) as never, 'seller');
    expect(view.items[0]?.remainingQuantity).toBe(0);
  });

  it('floors remaining at 0 when shipped exceeds agreed qty', () => {
    const base = orderWithItem(OrderLineStatus.Dispatched) as never as {
      shipments: unknown[];
      items: Array<{ quantity: { toNumber: () => number } }>;
    };
    base.items[0]!.quantity = { toNumber: () => 1 };
    base.shipments = [
      {
        id: 's1',
        orderId: 'o1',
        transporter: null,
        lrNumber: 'LR-OVER',
        parcelCount: null,
        dispatchedAt: new Date(),
        items: [
          {
            orderItemId: 'oi1',
            quantity: { toNumber: () => 2 },
            orderItem: { id: 'oi1', name: 'A' },
          },
        ],
      },
    ];
    const view = serializer.toOrderView(base as never, 'seller');
    expect(view.items[0]?.shippedQuantity).toBe(2);
    expect(view.items[0]?.remainingQuantity).toBe(0);
    expect(view.items[0]?.quantity).toBe(1);
  });

  it('exposes shipment legs and primary LR from first non-empty leg', () => {
    const base = orderWithItem(OrderLineStatus.Dispatched) as never as {
      shipments: unknown[];
    };
    base.shipments = [
      {
        id: 's1',
        orderId: 'o1',
        transporter: null,
        lrNumber: 'STALE',
        parcelCount: 2,
        dispatchedAt: new Date(),
        items: [
          {
            orderItemId: 'oi1',
            quantity: { toNumber: () => 4 },
            orderItem: { id: 'oi1', name: 'A' },
          },
        ],
        legs: [
          {
            id: 'l1',
            shipmentId: 's1',
            lrNumber: null,
            billNumber: 'B1',
            imageUrls: ['https://a/lr.jpg'],
            sortOrder: 0,
          },
          {
            id: 'l2',
            shipmentId: 's1',
            lrNumber: 'LR-2',
            billNumber: 'B2',
            imageUrls: [],
            sortOrder: 1,
          },
        ],
      },
    ];
    const view = serializer.toOrderView(base as never, 'seller');
    expect(view.shipments[0]?.lrNumber).toBe('LR-2');
    expect(view.shipments[0]?.legs).toEqual([
      {
        id: 'l1',
        lrNumber: null,
        billNumber: 'B1',
        imageUrls: ['https://a/lr.jpg'],
        sortOrder: 0,
      },
      { id: 'l2', lrNumber: 'LR-2', billNumber: 'B2', imageUrls: [], sortOrder: 1 },
    ]);
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
