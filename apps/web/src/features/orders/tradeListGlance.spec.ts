import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import {
  tradeListGlanceIcon,
  tradeListGlanceVerb,
  tradeListWaitingCue,
} from './tradeListGlance';
import { tradeListFacts } from './tradeListPreview';
import { tradeListShipFact, tradeListShipProgress } from './tradeListShipLine';
import type { TradeListItem } from './tradeList';

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
    quantity: partial.quantity ?? 60,
    requestedQuantity: partial.quantity ?? 60,
    lineStatus: partial.lineStatus ?? 'confirmed',
    shippedQuantity: partial.shippedQuantity ?? 0,
    remainingQuantity: partial.remainingQuantity ?? partial.quantity ?? 60,
    note: null,
  };
}

function orderItem(partial: {
  status?: string;
  direction?: string;
  tradeMode?: string;
  needsYou?: boolean;
  items?: ReturnType<typeof line>[];
  manualOrderNo?: string;
}): TradeListItem {
  const direction = partial.direction ?? 'selling';
  const status = partial.status ?? 'requested';
  const items = partial.items ?? [
    line({
      quantity: 12,
      remainingQuantity: 12,
      shippedQuantity: 0,
      unit: 'set',
      lineStatus: status === 'requested' ? 'open' : 'confirmed',
    }),
  ];
  return {
    kind: 'order',
    id: 'cm-vonr',
    createdAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
    direction,
    order: {
      id: 'cm-vonr',
      tradeMode: partial.tradeMode ?? 'bilateral',
      direction,
      intent: 'order',
      status,
      counterpart: { id: 'c1', name: 'Jaipur Emporium', city: 'Jaipur', verification: 'none', logoUrl: null },
      items,
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
      manualRef: partial.manualOrderNo
        ? { manualOrderNo: partial.manualOrderNo, note: null, images: [] }
        : undefined,
    } as OrderView,
  };
}

describe('tradeListGlance', () => {
  it('strips Needs you from Confirm / Dispatch; list says Forward not Accept & forward', () => {
    const confirm = orderItem({ status: 'requested', direction: 'selling' });
    expect(tradeListGlanceVerb(confirm)).toBe('Confirm');
    expect(tradeListGlanceIcon('Confirm')).toBe('confirm');
    expect(tradeListGlanceIcon('Dispatch')).toBe('dispatch');
    expect(tradeListGlanceIcon('Forward')).toBe('forward');
    expect(tradeListGlanceIcon('Accept quote')).toBe('confirm');
    const trading = orderItem({
      status: 'requested',
      direction: 'selling',
      tradeMode: 'manage',
    });
    if (trading.kind === 'order') {
      trading.order.linkedMills = [{ name: 'Surat Silk House', orderId: null, held: true }];
    }
    expect(tradeListGlanceVerb(trading)).toBe('Forward');
  });

  it('waiting buyer on idle selling; supplier on idle buying; none when Needs you', () => {
    expect(
      tradeListWaitingCue(orderItem({ status: 'requested', direction: 'selling' })),
    ).toBeNull();
    expect(
      tradeListWaitingCue(
        orderItem({
          status: 'requested',
          direction: 'buying',
        }),
      ),
    ).toBe('Waiting: supplier');
    expect(
      tradeListWaitingCue(
        orderItem({
          status: 'confirmed',
          direction: 'selling',
          items: [line({ quantity: 10, shippedQuantity: 10, remainingQuantity: 0 })],
        }),
      ),
    ).toBe('Waiting: buyer');
  });

  it('I-handle idle parent waits on supplier, not a mill name', () => {
    const item = orderItem({
      status: 'confirmed',
      direction: 'selling',
      tradeMode: 'manage',
      items: [line({ quantity: 8, shippedQuantity: 0, remainingQuantity: 8 })],
    });
    if (item.kind === 'order') {
      item.order.linkedMills = [{ name: 'Surat Silk House', orderId: 'up1' }];
    }
    expect(tradeListGlanceVerb(item)).toBeNull();
    expect(tradeListWaitingCue(item)).toBe('Waiting: supplier');
    expect(tradeListWaitingCue(item)).not.toMatch(/mill|shop/i);
  });

  it('facts drop Order, use middot, ship in order unit', () => {
    const idle = orderItem({ status: 'requested', direction: 'buying' });
    expect(tradeListFacts(idle)).toBe('#VONR · 1 design 12 sets');
    expect(tradeListFacts(idle)).not.toContain('Order #');
    const shipping = orderItem({
      status: 'part_shipped',
      items: [line({ quantity: 60, shippedQuantity: 0, remainingQuantity: 60, unit: 'set' })],
    });
    expect(tradeListShipFact(shipping.order)).toBe('0/60 sets sent');
    expect(tradeListFacts(shipping)).toBe('#VONR · 0/60 sets sent');
    const withManual = orderItem({
      status: 'part_shipped',
      manualOrderNo: 'SSH-114',
      items: [line({ quantity: 60, shippedQuantity: 0, remainingQuantity: 60, unit: 'set' })],
    });
    expect(tradeListFacts(withManual)).toBe('#VONR · SSH-114 · 0/60 sets sent');
  });

  it('progress fraction uses order qty; hides on requested', () => {
    expect(
      tradeListShipProgress(orderItem({ status: 'requested' }).order),
    ).toBeNull();
    expect(
      tradeListShipProgress(
        orderItem({
          status: 'part_shipped',
          items: [line({ quantity: 6, shippedQuantity: 3, remainingQuantity: 3, unit: 'pc' })],
        }).order,
      ),
    ).toEqual({ shipped: 3, total: 6, over: false });
    expect(
      tradeListShipProgress(
        orderItem({
          status: 'part_shipped',
          items: [line({ quantity: 40, shippedQuantity: 45, remainingQuantity: 0, unit: 'pc' })],
        }).order,
      ),
    ).toEqual({ shipped: 45, total: 40, over: true });
  });
});
