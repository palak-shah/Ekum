import { describe, expect, it } from 'vitest';
import { ordersListFilterChrome } from './ordersListFilterChrome';

describe('ordersListFilterChrome (BM-07)', () => {
  it('stacks Buy/Sell under attention so Pending/Completed are not clipped', () => {
    expect(ordersListFilterChrome().attentionDirectionLayout).toBe('stacked');
  });
});
