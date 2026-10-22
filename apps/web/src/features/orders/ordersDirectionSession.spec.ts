import { describe, expect, it, beforeEach } from 'vitest';
import {
  getOrdersListTab,
  noteOrdersPathChange,
  resetOrdersListTab,
  setOrdersListTab,
} from './ordersDirectionSession';

describe('ordersDirectionSession', () => {
  beforeEach(() => {
    resetOrdersListTab();
  });

  it('starts on Selling', () => {
    expect(getOrdersListTab()).toBe('selling');
  });

  it('keeps Buying across list remount (detail Back) until Orders is left', () => {
    setOrdersListTab('buying');
    expect(noteOrdersPathChange('/orders/abc', true)).toBe(true);
    expect(getOrdersListTab()).toBe('buying');
    expect(noteOrdersPathChange('/orders', true)).toBe(true);
    expect(getOrdersListTab()).toBe('buying');
  });

  it('resets to Selling after leaving Orders for another app area', () => {
    setOrdersListTab('buying');
    expect(noteOrdersPathChange('/explore', true)).toBe(false);
    expect(getOrdersListTab()).toBe('selling');
  });

  it('does not persist across an explicit reset (reload / new entry)', () => {
    setOrdersListTab('others');
    resetOrdersListTab();
    expect(getOrdersListTab()).toBe('selling');
  });
});
