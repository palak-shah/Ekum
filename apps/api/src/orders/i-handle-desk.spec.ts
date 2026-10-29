import { describe, expect, it } from 'vitest';
import {
  allReleasedSubsetsComplete,
  isTraderSubsetHop,
  claimParentItemId,
  matchParentItemId,
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

  it('builds the list hide clause for Find', () => {
    expect(traderListHidesSubset('trader')).toEqual({
      buyerCompanyId: 'trader',
      downstreamOrderId: { not: null },
    });
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
    // Held (not sent) hop does not block
    expect(
      allReleasedSubsetsComplete([
        { upstreamReleasedAt: released, status: 'settled' },
        { upstreamReleasedAt: null, status: 'requested' },
      ]),
    ).toBe(true);
  });
});
