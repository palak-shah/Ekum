import { afterEach, describe, expect, it } from 'vitest';
import { readRememberedQty, rememberQty, rememberedQtyLabel } from './qtyEachMemory';

afterEach(() => {
  localStorage.clear();
});

describe('qtyEachMemory', () => {
  it('is blank until the trader has entered a count for that shop', () => {
    expect(readRememberedQty('shop-a')).toBeNull();
    expect(rememberedQtyLabel(null)).toBe('');
  });

  it('returns the last entered pieces for that shop', () => {
    rememberQty('shop-a', 80);
    rememberQty('shop-b', 200);
    expect(readRememberedQty('shop-a')).toBe(80);
    expect(readRememberedQty('shop-b')).toBe(200);
  });

  it('ignores zero and missing seller', () => {
    rememberQty('shop-a', 0);
    expect(readRememberedQty('shop-a')).toBeNull();
    rememberQty('', 50);
    expect(readRememberedQty('')).toBeNull();
  });

  it('does not read the old v1 key that defaulted to 20', () => {
    localStorage.setItem('ekum:qty-each:shop-a', '20');
    expect(readRememberedQty('shop-a')).toBeNull();
  });
});
