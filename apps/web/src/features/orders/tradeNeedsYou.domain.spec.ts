import { describe, expect, it } from 'vitest';
import { matchesOrderNeedsYou, matchesReturnNeedsYou, matchesSampleNeedsYou } from '@ekum/domain-types';
import type { OrderView, ReturnView, SampleView } from '@ekum/domain-types';

describe('trade-needs-you (nav + list)', () => {
  it('counts a seller quote wait and hides a waiting buyer', () => {
    expect(
      matchesOrderNeedsYou({
        direction: 'selling',
        status: 'requested',
        tradeMode: 'bilateral',
        items: [{ rate: null, remainingQuantity: 10 }],
      } as OrderView),
    ).toBe(true);
    expect(
      matchesOrderNeedsYou({
        direction: 'buying',
        status: 'requested',
        tradeMode: 'bilateral',
        canAcceptQuote: false,
        items: [{ rate: 80, remainingQuantity: 10 }],
      } as OrderView),
    ).toBe(false);
  });

  it('counts sample send / receive and requested returns', () => {
    expect(
      matchesSampleNeedsYou({ direction: 'selling', status: 'requested' } as SampleView),
    ).toBe(true);
    expect(
      matchesSampleNeedsYou({ direction: 'buying', status: 'dispatched' } as SampleView),
    ).toBe(true);
    expect(matchesReturnNeedsYou({ status: 'requested' } as ReturnView)).toBe(true);
    expect(matchesReturnNeedsYou({ status: 'resolved' } as ReturnView)).toBe(false);
  });
});
