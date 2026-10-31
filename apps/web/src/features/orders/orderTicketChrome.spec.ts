import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import {
  orderTicketCanForwardNotes,
  orderTicketNotes,
  orderTicketProgress,
  orderTicketProgressCopy,
  orderTicketSubtitle,
  orderTicketWaitingCue,
} from './orderTicketChrome';

function line(partial: {
  quantity?: number;
  shippedQuantity?: number;
  remainingQuantity?: number;
  unit?: string;
  lineStatus?: string;
}) {
  return {
    id: 'i1',
    productId: 'p1',
    name: 'A',
    sku: null,
    rate: 10,
    unit: partial.unit ?? 'set',
    dispatchUnit: null,
    piecesPerPack: null,
    image: null,
    images: [],
    quantity: partial.quantity ?? 12,
    requestedQuantity: partial.quantity ?? 12,
    lineStatus: partial.lineStatus ?? 'confirmed',
    shippedQuantity: partial.shippedQuantity ?? 0,
    remainingQuantity: partial.remainingQuantity ?? partial.quantity ?? 12,
    note: null,
  };
}

function order(partial: {
  status?: string;
  direction?: string;
  tradeMode?: string;
  updatedAt?: string;
  manualOrderNo?: string;
  items?: ReturnType<typeof line>[];
  linkedMills?: OrderView['linkedMills'];
}): OrderView {
  const direction = partial.direction ?? 'buying';
  const status = partial.status ?? 'requested';
  return {
    id: 'cm-vonr',
    tradeMode: partial.tradeMode ?? 'bilateral',
    direction,
    intent: 'order',
    status,
    counterpart: {
      id: 'c1',
      name: 'Jaipur Emporium',
      city: 'Jaipur',
      verification: 'none',
      logoUrl: null,
    },
    items: partial.items ?? [
      line({
        lineStatus: status === 'requested' ? 'open' : 'confirmed',
      }),
    ],
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-09-07T00:00:00.000Z',
    manualRef: partial.manualOrderNo
      ? { manualOrderNo: partial.manualOrderNo, note: null, images: [] }
      : undefined,
    linkedMills: partial.linkedMills,
  } as OrderView;
}

describe('orderTicketChrome', () => {
  it('subtitle is Buying/Selling · time · myNo', () => {
    expect(orderTicketSubtitle(order({ direction: 'buying' }))).toMatch(/^Buying · /);
    expect(
      orderTicketSubtitle(order({ direction: 'selling', manualOrderNo: 'SSH-114' })),
    ).toMatch(/Selling · .+ · SSH-114/);
    expect(orderTicketSubtitle(order({ direction: 'buying' }))).not.toContain('My no.');
  });

  it('progress uses order unit sent; hides on requested; extra when over', () => {
    expect(orderTicketProgressCopy(order({ status: 'requested' }))).toBeNull();
    expect(
      orderTicketProgressCopy(
        order({
          status: 'part_shipped',
          items: [line({ quantity: 12, shippedQuantity: 5, remainingQuantity: 7, unit: 'set' })],
        }),
      ),
    ).toBe('5 of 12 sets sent');
    const over = orderTicketProgress(
      order({
        status: 'part_shipped',
        items: [line({ quantity: 40, shippedQuantity: 45, remainingQuantity: 0, unit: 'pc' })],
      }),
    );
    expect(over?.copy).toBe('45 of 40 pcs sent · +5 extra');
    expect(over?.over).toBe(true);
  });

  it('waiting supplier on idle buying; buyer when seller is idle; none on I-handle desk', () => {
    expect(orderTicketWaitingCue(order({ status: 'requested', direction: 'buying' }))).toBe(
      'Waiting: supplier',
    );
    expect(orderTicketWaitingCue(order({ status: 'requested', direction: 'selling' }))).toBeNull();
    expect(
      orderTicketWaitingCue(
        order({
          status: 'confirmed',
          direction: 'selling',
          items: [line({ quantity: 10, shippedQuantity: 10, remainingQuantity: 0 })],
        }),
      ),
    ).toBe('Waiting: buyer');
    expect(
      orderTicketWaitingCue(
        order({
          status: 'confirmed',
          direction: 'selling',
          tradeMode: 'manage',
          linkedMills: [{ name: 'Surat Silk House', orderId: 'up1' }],
        }),
      ),
    ).toBeNull();
    expect(orderTicketWaitingCue(order({ status: 'dispatched', direction: 'buying' }))).toBeNull();
  });

  it('mixed order units omit the noun', () => {
    expect(
      orderTicketProgressCopy(
        order({
          status: 'part_shipped',
          items: [
            line({ quantity: 10, shippedQuantity: 4, remainingQuantity: 6, unit: 'set' }),
            {
              ...line({ quantity: 8, shippedQuantity: 2, remainingQuantity: 6, unit: 'pc' }),
              id: 'i2',
            },
          ],
        }),
      ),
    ).toBe('6 of 18 sent');
  });

  it('Notes list place-time then noted; Forward only on I-handle trader hops', () => {
    const buying = order({
      direction: 'buying',
      status: 'requested',
    });
    buying.note = 'Need lining';
    buying.noteVoiceUrl = null;
    buying.noteVoiceDurationMs = null;
    buying.buyerCompanyId = 'buyer';
    buying.sellerCompanyId = 'seller';
    buying.buyerName = 'Jaipur Emporium';
    buying.sellerName = 'Surat Silk House';
    buying.trail = [
      {
        id: 'n1',
        type: 'noted',
        at: '2026-09-08T00:00:00.000Z',
        who: 'Surat Silk House',
        summary: 'Note',
        detail: null,
        note: 'Will cut Friday',
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
        noteImageUrls: [],
        mine: false,
        forwarded: false,
      },
    ];
    const listed = orderTicketNotes(buying, 'buyer');
    expect(listed[0]?.id).toBe('place');
    expect(listed[0]?.who).toBe('You');
    expect(listed[1]?.note).toBe('Will cut Friday');
    expect(orderTicketCanForwardNotes(buying)).toBe(false);
    expect(
      orderTicketCanForwardNotes(
        order({
          direction: 'selling',
          tradeMode: 'manage',
        }),
      ),
    ).toBe(false);
    const parent = order({ direction: 'selling', tradeMode: 'manage' });
    parent.millDesks = [
      {
        upstreamOrderId: 'up1',
        sellerCompanyId: 'mill',
        sellerName: 'Surat Silk House',
        held: false,
        passHeld: false,
        reveal: false,
        revealThreadId: null,
        millThreadId: null,
        status: 'requested',
        itemIds: ['i1'],
        confirmedCount: 0,
        declinedCount: 0,
        millQuoted: false,
        lines: [],
      },
    ];
    expect(orderTicketCanForwardNotes(parent)).toBe(true);
    const millHop = order({ direction: 'buying', tradeMode: 'manage' });
    millHop.downstreamOrderId = 'parent-1';
    expect(orderTicketCanForwardNotes(millHop)).toBe(true);
    expect(orderTicketCanForwardNotes(order({ tradeMode: 'direct', direction: 'buying' }))).toBe(
      false,
    );
  });
});
