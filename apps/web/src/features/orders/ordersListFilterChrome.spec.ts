import { describe, expect, it } from 'vitest';
import { ordersListFilterChrome } from './ordersListFilterChrome';

describe('ordersListFilterChrome (BM-07)', () => {
  it('keeps status and direction on one compact row (fits 390px)', () => {
    const chrome = ordersListFilterChrome();
    expect(chrome.attentionDirectionLayout).toBe('row');
    expect(chrome.rowClass).toContain('flex-nowrap');
    expect(chrome.rowClass).toContain('justify-between');
    expect(chrome.statusChipClass).toBe('px-2.5');
    expect(chrome.directionBtnClass).toContain('text-[11px]');
  });
});
