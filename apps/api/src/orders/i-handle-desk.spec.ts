import { describe, expect, it } from 'vitest';
import {
  allReleasedSubsetsComplete,
  isTraderSubsetHop,
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
