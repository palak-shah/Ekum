import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { tradeListBallStrip } from './tradeListBallStrip';

function order(partial: Partial<OrderView>): OrderView {
  return {
    id: 'o1',
    kind: 'standard',
    intent: 'order',
    status: 'confirmed',
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
      name: 'Jaipur Emporium',
      city: 'Jaipur',
      verification: 'none',
      logoUrl: null,
    },
    items: [],
    shipments: [],
    dispatch: null,
    threadId: null,
    confirmedAt: null,
    confirmedByName: null,
    confirmedByRole: null,
    buyerName: 'Jaipur Emporium',
    sellerName: 'Surat Silk',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...partial,
  } as OrderView;
}

describe('tradeListBallStrip', () => {
  it('seller bilateral: counterpart | You with dispatch cue', () => {
    const strip = tradeListBallStrip(
      order({
        direction: 'selling',
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
    );
    expect(strip?.left.title).toBe('Jaipur Emporium');
    expect(strip?.right.title).toBe('You');
    expect(strip?.right.detail).toMatch(/Dispatch/i);
  });

  it('buyer waiting for quote names the counterpart only', () => {
    const strip = tradeListBallStrip(
      order({
        direction: 'buying',
        status: 'requested',
        counterpart: {
          id: 'trader',
          name: 'Meena Trading',
          city: 'Surat',
          verification: 'none',
          logoUrl: null,
        },
      }),
    );
    expect(strip?.left.title).toBe('You');
    expect(strip?.right.title).toBe('Meena Trading');
    expect(strip?.right.detail).toBe('Waiting for quote');
  });

  it('trading desk uses Buyer\'s order | mill names when present', () => {
    const strip = tradeListBallStrip(
      order({
        direction: 'selling',
        tradeMode: 'manage',
        status: 'requested',
        linkedMills: [{ name: 'Sana Kurtis', orderId: null, held: true }],
        millDesks: [],
      }),
    );
    expect(strip?.left.title).toBe("Buyer's order");
    expect(strip?.right.title).toBe('Sana Kurtis');
    expect(strip?.right.detail).toBe('Not sent yet');
  });

  it('trading with empty mill names does not invent a mill shop', () => {
    const strip = tradeListBallStrip(
      order({
        direction: 'selling',
        tradeMode: 'manage',
        linkedMills: [{ name: '', orderId: null, held: true }],
        millDesks: [{} as never],
      }),
    );
    expect(strip?.right.title).toBe('Supplier');
  });
});
