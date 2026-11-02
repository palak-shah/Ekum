import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import {
  isBuyingBilateralTicket,
  isSellingBilateralTicket,
  orderTicketCanForwardNotes,
  orderTicketNoteCue,
  orderTicketNotes,
  orderTicketProgress,
  orderTicketProgressCopy,
  orderTicketSubtitle,
  orderTicketWaitingCue,
  traderSellingHop,
  traderSellingHopCopy,
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
    expect(
      orderTicketProgressCopy(
        order({
          status: 'part_shipped',
          items: [line({ quantity: 45, shippedQuantity: 30, remainingQuantity: 15, unit: 'pc' })],
        }),
      ),
    ).toBe('30 of 45 pcs sent');
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

  it('Notes include confirm/dispatch sheet notes with a quiet cue', () => {
    const ticket = order({
      direction: 'buying',
      status: 'part_shipped',
    });
    ticket.note = null;
    ticket.buyerCompanyId = 'buyer';
    ticket.sellerCompanyId = 'seller';
    ticket.trail = [
      {
        id: 'c1',
        type: 'confirmed',
        at: '2026-09-08T00:00:00.000Z',
        who: 'Surat Silk House',
        summary: 'Confirmed',
        detail: null,
        note: 'Will cut Friday',
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
        noteImageUrls: [],
        mine: false,
        forwarded: false,
      },
      {
        id: 'd1',
        type: 'dispatched',
        at: '2026-09-09T00:00:00.000Z',
        who: 'Surat Silk House',
        summary: 'Dispatched',
        detail: null,
        note: 'LR 44',
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
        noteImageUrls: [],
        mine: false,
        forwarded: false,
      },
      {
        id: 'n1',
        type: 'noted',
        at: '2026-09-10T00:00:00.000Z',
        who: 'You',
        summary: 'Note',
        detail: null,
        note: 'Thanks',
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
        noteImageUrls: [],
        mine: true,
        forwarded: false,
      },
    ];
    const listed = orderTicketNotes(ticket, 'buyer');
    expect(listed.map((row) => row.note)).toEqual(['Will cut Friday', 'LR 44', 'Thanks']);
    expect(listed[0]?.cue).toBe('On confirm');
    expect(listed[1]?.cue).toBe('On dispatch');
    expect(listed[2]?.cue).toBeNull();
    expect(listed[0]?.mine).toBe(false);
    expect(listed[2]?.mine).toBe(true);
    expect(orderTicketNoteCue('settled')).toBe('On settle');
  });

  it('Notes include quote and amend sheet notes; personal notes stay out', () => {
    const ticket = order({
      direction: 'buying',
      status: 'requested',
      note: null,
    });
    ticket.buyerCompanyId = 'buyer';
    ticket.sellerCompanyId = 'seller';
    ticket.personalNote = {
      note: 'Pack later — only me',
      noteVoiceUrl: null,
      noteVoiceDurationMs: null,
      images: [],
    };
    ticket.trail = [
      {
        id: 'a1',
        type: 'updated',
        at: '2026-09-08T00:00:00.000Z',
        who: 'You',
        summary: 'Amended',
        detail: null,
        note: 'Drop the navy',
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
        noteImageUrls: [],
        mine: true,
        forwarded: false,
      },
      {
        id: 'q1',
        type: 'quoted',
        at: '2026-09-09T00:00:00.000Z',
        who: 'Surat Silk House',
        summary: 'Quote',
        detail: null,
        note: 'Rate holds 3 days',
        noteVoiceUrl: null,
        noteVoiceDurationMs: null,
        noteImageUrls: [],
        mine: false,
        forwarded: false,
      },
    ];
    const listed = orderTicketNotes(ticket, 'buyer');
    expect(listed.map((row) => row.note)).toEqual(['Drop the navy', 'Rate holds 3 days']);
    expect(listed.some((row) => row.note?.includes('Pack later'))).toBe(false);
    expect(listed[0]?.cue).toBeNull();
    expect(listed[1]?.cue).toBeNull();
  });

  it('isSellingBilateralTicket is selling 1:1 only', () => {
    expect(isSellingBilateralTicket(order({ direction: 'selling' }))).toBe(true);
    expect(isSellingBilateralTicket(order({ direction: 'buying' }))).toBe(false);
    expect(
      isSellingBilateralTicket(order({ direction: 'selling', tradeMode: 'direct' })),
    ).toBe(false);
    expect(
      isSellingBilateralTicket(order({ direction: 'selling', tradeMode: 'manage' })),
    ).toBe(false);
    const withDesks = order({ direction: 'selling' });
    withDesks.millDesks = [
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
    expect(isSellingBilateralTicket(withDesks)).toBe(false);
    expect(
      isSellingBilateralTicket(
        order({
          direction: 'selling',
          linkedMills: [{ name: 'Surat Silk House', orderId: 'up1' }],
        }),
      ),
    ).toBe(false);
  });

  it('isBuyingBilateralTicket is buying 1:1 only', () => {
    expect(isBuyingBilateralTicket(order({ direction: 'buying' }))).toBe(true);
    expect(isBuyingBilateralTicket(order({ direction: 'selling' }))).toBe(false);
    expect(
      isBuyingBilateralTicket(order({ direction: 'buying', tradeMode: 'direct' })),
    ).toBe(false);
    expect(
      isBuyingBilateralTicket(order({ direction: 'buying', tradeMode: 'manage' })),
    ).toBe(false);
    const millHop = order({ direction: 'buying' });
    millHop.downstreamOrderId = 'order-ameya-iinb';
    expect(isBuyingBilateralTicket(millHop)).toBe(false);
    const withDesks = order({ direction: 'buying' });
    withDesks.millDesks = [
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
    expect(isBuyingBilateralTicket(withDesks)).toBe(false);
  });

  it('selling hop is trader mill hop only — mill and parent skip it', () => {
    const millHop = order({ direction: 'buying' });
    millHop.relatedOrders = [
      {
        id: 'order-ameya-iinb',
        role: 'downstream',
        status: 'requested',
        sellerName: 'Surat Silk House',
        buyerName: 'Ameyaa',
      },
    ];
    expect(traderSellingHop(millHop)).toEqual({
      id: 'order-ameya-iinb',
      buyerName: 'Ameyaa',
    });
    expect(traderSellingHopCopy('Ameyaa', 'order-ameya-iinb')).toEqual({
      title: 'For Ameyaa · your selling order #IINB',
      detail: 'Dispatch goes straight to Ameyaa',
    });

    const millSeller = order({ direction: 'selling' });
    millSeller.relatedOrders = millHop.relatedOrders;
    expect(traderSellingHop(millSeller)).toBeNull();

    const parent = order({ direction: 'selling', tradeMode: 'manage' });
    parent.relatedOrders = [
      {
        id: 'up-1',
        role: 'upstream',
        status: 'requested',
        sellerName: 'Ethonique',
        buyerName: 'Surat Silk House',
      },
    ];
    expect(traderSellingHop(parent)).toBeNull();
  });
});
