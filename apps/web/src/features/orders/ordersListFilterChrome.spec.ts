import { describe, expect, it } from 'vitest';
import { ordersListFilterChrome } from './ordersListFilterChrome';

describe('ordersListFilterChrome (BM-07)', () => {
  it('keeps Selling / Buying / Others inside a phone width', () => {
    const chrome = ordersListFilterChrome();
    expect(chrome.tabRowClass).toContain('grid-cols-3');
    expect(chrome.tabRowClass).toContain('min-w-0');
    expect(chrome.tabClass).toContain('relative');
    // Pending/Completed use plain flex on OrdersPage — not FilterRail overflow-x-auto.
  });
});
