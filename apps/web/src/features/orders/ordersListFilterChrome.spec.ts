import { describe, expect, it } from 'vitest';
import { ordersListFilterChrome } from './ordersListFilterChrome';

describe('ordersListFilterChrome (BM-07)', () => {
  it('keeps Selling / Buying / Others inside a phone width', () => {
    const chrome = ordersListFilterChrome();
    expect(chrome.tabRowClass).toContain('grid-cols-3');
    expect(chrome.tabClass).toContain('relative');
  });
});
