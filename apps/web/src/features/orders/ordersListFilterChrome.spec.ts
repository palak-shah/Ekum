import { describe, expect, it } from 'vitest';
import { ordersListFilterChrome } from './ordersListFilterChrome';

describe('ordersListFilterChrome (BM-07)', () => {
  it('keeps tabs and the two summaries inside a phone width', () => {
    const chrome = ordersListFilterChrome();
    expect(chrome.tabRowClass).toContain('grid-cols-3');
    expect(chrome.tabClass).toContain('relative');
    expect(chrome.summaryGridClass).toContain('grid-cols-2');
    expect(chrome.summaryClass).toContain('min-h-11');
  });
});
