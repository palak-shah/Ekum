import { describe, expect, it } from 'vitest';
import {
  allReleasedSubsetsComplete,
  isBuyerHiddenFulfilmentHop,
  isTraderOwnedFulfilmentHop,
  isTraderSubsetHop,
  claimParentItemId,
  millMappedParentItemIds,
  matchParentItemId,
  parentHasPendingFulfilmentLines,
  hopMappedParentItemIds,
  isHopAttributableShipment,
  mapHopShipmentItemsToParent,
  trimHopShipmentItemsToFinal,
  shouldPassThrough,
  traderListHidesSubset,
} from './i-handle-desk';

describe('i-handle desk', () => {
  it('hides mill hops the trader buys', () => {
    expect(
      isTraderSubsetHop(
        { buyerCompanyId: 'trader', downstreamOrderId: 'down-1' },
        'trader',
      ),
    ).toBe(true);
    expect(
      isTraderSubsetHop(
        { buyerCompanyId: 'trader', downstreamOrderId: 'down-1' },
        'mill',
      ),
    ).toBe(false);
    expect(
      isTraderSubsetHop({ buyerCompanyId: 'trader', downstreamOrderId: null }, 'trader'),
    ).toBe(false);
  });

  it('detects You fulfilment hop by matching parent parties', () => {
    const parent = { buyerCompanyId: 'buyer', sellerCompanyId: 'trader' };
    expect(
      isTraderOwnedFulfilmentHop(
        {
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'trader',
          downstreamOrderId: 'parent',
        },
        parent,
      ),
    ).toBe(true);
    expect(
      isTraderOwnedFulfilmentHop(
        {
          buyerCompanyId: 'trader',
          sellerCompanyId: 'mill',
          downstreamOrderId: 'parent',
        },
        parent,
      ),
    ).toBe(false);
    expect(
      isBuyerHiddenFulfilmentHop(
        {
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'trader',
          downstreamOrderId: 'parent',
        },
        parent,
        'buyer',
      ),
    ).toBe(true);
    expect(
      isBuyerHiddenFulfilmentHop(
        {
          buyerCompanyId: 'buyer',
          sellerCompanyId: 'trader',
          downstreamOrderId: 'parent',
        },
        parent,
        'trader',
      ),
    ).toBe(false);
  });

  it('builds the list hide clause for Find', () => {
    expect(traderListHidesSubset('trader')).toEqual({
      buyerCompanyId: 'trader',
      downstreamOrderId: { not: null },
    });
  });

  it('collects mill-mapped parent item ids from hop sourceItemId', () => {
    expect(
      millMappedParentItemIds([
        { items: [{ sourceItemId: 'p-a' }, { sourceItemId: null }] },
        { items: [{ sourceItemId: 'p-b' }, { sourceItemId: 'p-a' }] },
      ]),
    ).toEqual(new Set(['p-a', 'p-b']));
    expect(millMappedParentItemIds([])).toEqual(new Set());
  });

  it('maps mill lines to the parent by product', () => {
    expect(
      matchParentItemId(
        [
          { id: 'p-a', productId: 'sku-1' },
          { id: 'p-b', productId: 'sku-2' },
        ],
        { productId: 'sku-2' },
      ),
    ).toBe('p-b');
    expect(matchParentItemId([{ id: 'p-a', productId: 'sku-1' }], { productId: null })).toBe(
      null,
    );
  });

  it('prefers sourceItemId and refuses duplicate productId without it', () => {
    expect(
      matchParentItemId(
        [
          { id: 'p-a', productId: 'sku-1' },
          { id: 'p-b', productId: 'sku-1' },
        ],
        { productId: 'sku-1', sourceItemId: 'p-b' },
      ),
    ).toBe('p-b');
    expect(
      matchParentItemId(
        [
          { id: 'p-a', productId: 'sku-1' },
          { id: 'p-b', productId: 'sku-1' },
        ],
        { productId: 'sku-1' },
      ),
    ).toBeNull();
    expect(
      matchParentItemId([{ id: 'p-a', productId: null }], {
        productId: null,
        sourceItemId: 'p-a',
      }),
    ).toBe('p-a');
  });

  it('claims unused parent lines 1:1 including photo names', () => {
    const unused = [
      { id: 'p-a', productId: 'sku-1', name: 'A' },
      { id: 'p-b', productId: 'sku-1', name: 'A copy' },
      { id: 'p-photo', productId: null, name: 'Photo request' },
    ];
    expect(claimParentItemId(unused, { productId: 'sku-1' })).toBe('p-a');
    expect(claimParentItemId(unused, { productId: 'sku-1' })).toBe('p-b');
    expect(claimParentItemId(unused, { productId: null, name: 'Photo request' })).toBe(
      'p-photo',
    );
    expect(unused).toHaveLength(0);
  });

  it('passes only after Send and not while held', () => {
    expect(
      shouldPassThrough({
        downstreamOrderId: 'd1',
        upstreamReleasedAt: new Date(),
        passHeldAt: null,
      }),
    ).toBe(true);
    expect(
      shouldPassThrough({
        downstreamOrderId: 'd1',
        upstreamReleasedAt: new Date(),
        passHeldAt: new Date(),
      }),
    ).toBe(false);
    expect(
      shouldPassThrough({
        downstreamOrderId: 'd1',
        upstreamReleasedAt: null,
        passHeldAt: null,
      }),
    ).toBe(false);
  });

  it('settles parent only when every released subset is complete', () => {
    const released = new Date();
    expect(
      allReleasedSubsetsComplete([{ upstreamReleasedAt: released, status: 'settled' }]),
    ).toBe(true);
    expect(
      allReleasedSubsetsComplete([
        { upstreamReleasedAt: released, status: 'settled' },
        { upstreamReleasedAt: released, status: 'part_shipped' },
      ]),
    ).toBe(false);
    expect(
      allReleasedSubsetsComplete([
        { upstreamReleasedAt: released, status: 'settled' },
        { upstreamReleasedAt: released, status: 'dispatched' },
      ]),
    ).toBe(true);
    // Held (not sent) hop does not block this helper alone
    expect(
      allReleasedSubsetsComplete([
        { upstreamReleasedAt: released, status: 'settled' },
        { upstreamReleasedAt: null, status: 'requested' },
      ]),
    ).toBe(true);
  });

  it('blocks parent settle while Open/Confirmed or short parent lines remain', () => {
    const shipped = new Map<string, number>([
      ['you-1', 8],
      ['mill-1', 0],
    ]);
    expect(
      parentHasPendingFulfilmentLines(
        [
          { id: 'you-1', lineStatus: 'dispatched', quantity: 8 },
          { id: 'mill-1', lineStatus: 'open', quantity: 12 },
        ],
        shipped,
      ),
    ).toBe(true);
    expect(
      parentHasPendingFulfilmentLines(
        [
          { id: 'you-1', lineStatus: 'dispatched', quantity: 8 },
          { id: 'mill-1', lineStatus: 'dispatched', quantity: 12 },
        ],
        new Map([
          ['you-1', 8],
          ['mill-1', 12],
        ]),
      ),
    ).toBe(false);
    expect(
      parentHasPendingFulfilmentLines(
        [
          { id: 'you-1', lineStatus: 'dispatched', quantity: 3 },
          { id: 'mill-1', lineStatus: 'confirmed', quantity: 9 },
        ],
        new Map([
          ['you-1', 3],
          ['mill-1', 0],
        ]),
      ),
    ).toBe(true);
  });

  it('attributes parent shipments wholly to one hop via sourceItemId set', () => {
    const mapped = hopMappedParentItemIds([
      { sourceItemId: 'p-mill-a' },
      { sourceItemId: 'p-mill-b' },
      { sourceItemId: null },
    ]);
    expect(mapped).toEqual(new Set(['p-mill-a', 'p-mill-b']));
    expect(
      isHopAttributableShipment(
        [{ orderItemId: 'p-mill-a' }, { orderItemId: 'p-mill-b' }],
        mapped,
      ),
    ).toBe(true);
    expect(
      isHopAttributableShipment([{ orderItemId: 'p-mill-a' }, { orderItemId: 'p-you' }], mapped),
    ).toBe(false);
    expect(isHopAttributableShipment([], mapped)).toBe(false);
  });

  it('maps hop shipment lines by sourceItemId including duplicate productIds', () => {
    const parentItems = [
      { id: 'p-a', productId: 'sku-1' },
      { id: 'p-b', productId: 'sku-1' },
      { id: 'p-c', productId: 'sku-2' },
    ];
    const hopItems = [
      { id: 'h-a', productId: 'sku-1', sourceItemId: 'p-b' },
      { id: 'h-b', productId: 'sku-1', sourceItemId: 'p-a' },
    ];
    expect(
      mapHopShipmentItemsToParent(
        [
          { orderItemId: 'h-a', quantity: 4 },
          { orderItemId: 'h-b', quantity: 0 },
        ],
        hopItems,
        parentItems,
      ),
    ).toEqual([{ orderItemId: 'p-b', quantity: 4 }]);
  });

  it('trims newest hop-attributable shipment items down to Final', () => {
    const mapped = new Set(['p-1']);
    const updates = trimHopShipmentItemsToFinal(
      [
        {
          id: 's-old',
          dispatchedAt: new Date('2026-01-01T00:00:00Z'),
          items: [{ id: 'si-old', orderItemId: 'p-1', quantity: 6 }],
        },
        {
          id: 's-new',
          dispatchedAt: new Date('2026-01-02T00:00:00Z'),
          items: [{ id: 'si-new', orderItemId: 'p-1', quantity: 4 }],
        },
        {
          id: 's-you',
          dispatchedAt: new Date('2026-01-03T00:00:00Z'),
          items: [{ id: 'si-you', orderItemId: 'p-you', quantity: 8 }],
        },
      ],
      mapped,
      'p-1',
      7,
    );
    expect(updates).toEqual([{ shipmentItemId: 'si-new', quantity: 1, delete: false }]);
  });
});
