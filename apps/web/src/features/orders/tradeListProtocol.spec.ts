import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { tradeListProtocol, tradeListStatusLabel } from './tradeListProtocol';
import type { TradeListItem } from './tradeList';

function order(partial: Partial<OrderView>): OrderView {
  return {
    id: 'o1',
    kind: 'standard',
    intent: 'order',
    status: 'requested',
    tradeMode: 'bilateral',
    facilitatorCompanyId: null,
    downstreamOrderId: null,
    relatedOrders: [],
    direction: 'selling',
    amendCount: 0,
    note: null,
    transporter: null,
    noteVoiceUrl: null,
    noteVoiceDurationMs: null,
    noteVoiceMediaId: null,
    buyerCompanyId: 'b1',
    sellerCompanyId: 's1',
    counterpart: {
      id: 'b1',
      name: 'Ahmedabad Loom Co',
      city: 'Ahmedabad',
      verification: 'none',
      logoUrl: null,
    },
    items: [
      {
        id: 'i1',
        productId: null,
        name: 'A',
        sku: null,
        rate: 10,
        unit: 'pc',
        image: null,
        images: [],
        quantity: 10,
        requestedQuantity: 10,
        lineStatus: 'open',
        shippedQuantity: 0,
        remainingQuantity: 10,
        note: null,
      },
    ],
    shipments: [],
    dispatch: null,
    threadId: null,
    confirmedAt: null,
    confirmedByName: null,
    confirmedByRole: null,
    buyerName: 'Ahmedabad Loom Co',
    sellerName: 'Jaipur Emporium',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...partial,
  } as OrderView;
}

function asItem(o: OrderView): TradeListItem {
  return {
    kind: 'order',
    id: o.id,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    direction: o.direction,
    order: o,
  } as TradeListItem;
}

describe('tradeListProtocol', () => {
  it('seller confirm/quote → waiting to confirm order (once)', () => {
    expect(tradeListProtocol(asItem(order({})))).toBe('Waiting for you to confirm order');
    expect(
      tradeListProtocol(
        asItem(
          order({
            items: [
              {
                id: 'i1',
                productId: null,
                name: 'A',
                sku: null,
                rate: null,
                unit: 'pc',
                image: null,
                images: [],
                quantity: 10,
                requestedQuantity: 10,
                lineStatus: 'open',
                shippedQuantity: 0,
                remainingQuantity: 10,
                note: null,
              },
            ],
          }),
        ),
      ),
    ).toBe('Waiting for you to confirm order');
  });

  it('dispatch pending uses ship protocol', () => {
    expect(
      tradeListProtocol(
        asItem(
          order({
            status: 'confirmed',
            items: [
              {
                id: 'i1',
                productId: null,
                name: 'A',
                sku: null,
                rate: 10,
                unit: 'pc',
                image: null,
                images: [],
                quantity: 10,
                requestedQuantity: 10,
                lineStatus: 'confirmed',
                shippedQuantity: 0,
                remainingQuantity: 10,
                note: null,
              },
            ],
          }),
        ),
      ),
    ).toBe('Nothing dispatched yet · Dispatch pending');
  });
});

describe('tradeListStatusLabel', () => {
  it('maps requested to Placed', () => {
    expect(tradeListStatusLabel('requested')).toBe('Placed');
    expect(tradeListStatusLabel('confirmed')).toBe('Confirmed');
  });
});
