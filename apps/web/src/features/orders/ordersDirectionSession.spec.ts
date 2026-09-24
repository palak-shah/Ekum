import { describe, expect, it, beforeEach } from 'vitest';
import {
  getOrdersDirection,
  noteOrdersPathChange,
  resetOrdersDirection,
  setOrdersDirection,
  tradeMatchesDirection,
} from './ordersDirectionSession';

describe('ordersDirectionSession', () => {
  beforeEach(() => {
    resetOrdersDirection();
  });

  it('starts on All', () => {
    expect(getOrdersDirection()).toBe('all');
  });

  it('keeps Buy across list remount (detail Back) until Orders is left', () => {
    setOrdersDirection('buying');
    expect(noteOrdersPathChange('/orders/abc', true)).toBe(true);
    expect(getOrdersDirection()).toBe('buying');
    expect(noteOrdersPathChange('/orders', true)).toBe(true);
    expect(getOrdersDirection()).toBe('buying');
  });

  it('resets to All after leaving Orders for another app area', () => {
    setOrdersDirection('selling');
    expect(noteOrdersPathChange('/explore', true)).toBe(false);
    expect(getOrdersDirection()).toBe('all');
  });

  it('does not persist across an explicit reset (reload / new entry)', () => {
    setOrdersDirection('buying');
    resetOrdersDirection();
    expect(getOrdersDirection()).toBe('all');
  });

  it('limits search-style lists only when Buy or Sell is chosen', () => {
    expect(tradeMatchesDirection('buying', 'all')).toBe(true);
    expect(tradeMatchesDirection('selling', 'all')).toBe(true);
    expect(tradeMatchesDirection('buying', 'buying')).toBe(true);
    expect(tradeMatchesDirection('selling', 'buying')).toBe(false);
    expect(tradeMatchesDirection('selling', 'selling')).toBe(true);
  });
});
