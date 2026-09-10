import { describe, expect, it } from 'vitest';
import { ordersListFilterChrome } from './ordersListFilterChrome';

describe('ordersListFilterChrome (BM-07)', () => {
  it('stacks Buy/Sell under attention so Completed is not clipped', () => {
    expect(ordersListFilterChrome().attentionDirectionLayout).toBe('stacked');
  });
});
