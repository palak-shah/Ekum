import { describe, expect, it } from 'vitest';
import { ordersListNeedsLoadMore } from './ordersLoadMore';

describe('ordersListNeedsLoadMore', () => {
  it('hides when the server has no next page', () => {
    expect(
      ordersListNeedsLoadMore({ serverHasMore: false, loadedVisible: 10, knownTotal: 80 }),
    ).toBe(false);
  });

  it('hides when every Pending/Needs you row is already on screen', () => {
    expect(
      ordersListNeedsLoadMore({ serverHasMore: true, loadedVisible: 12, knownTotal: 12 }),
    ).toBe(false);
  });

  it('shows when more of this view may still be on later pages', () => {
    expect(
      ordersListNeedsLoadMore({ serverHasMore: true, loadedVisible: 20, knownTotal: 80 }),
    ).toBe(true);
  });

  it('trusts the cursor alone when the total is unknown', () => {
    expect(
      ordersListNeedsLoadMore({ serverHasMore: true, loadedVisible: 50, knownTotal: null }),
    ).toBe(true);
  });
});
