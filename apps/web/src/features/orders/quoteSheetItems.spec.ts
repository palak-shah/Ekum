import { describe, expect, it } from 'vitest';
import {
  orderLineCantSupplyCue,
  orderLineLeftoverCue,
  quoteCantSupplyControlClass,
  quoteCantSupplyMutedClass,
  quoteCantSupplyRowClass,
  quoteSheetItems,
  quoteSheetReferenceCue,
  quoteUnavailableOnOpen,
} from './quoteSheetItems';
import type { OrderItemView } from '@ekum/domain-types';

function line(id: string, lineStatus: OrderItemView['lineStatus']): OrderItemView {
  return { id, lineStatus } as OrderItemView;
}

describe('quoteSheetItems', () => {
  it('keeps declined lines on the sheet', () => {
    const items = [line('a', 'open'), line('b', 'declined'), line('c', 'confirmed')];
    expect(quoteSheetItems(items).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('defaults declined to Can’t supply, but an untick wins', () => {
    const items = [line('a', 'open'), line('b', 'declined')];
    expect(quoteUnavailableOnOpen(items, { a: true })).toEqual({ a: true, b: true });
    expect(quoteUnavailableOnOpen(items, { b: false })).toEqual({ a: false, b: false });
  });

  it('mutes the design, not the Can’t supply control', () => {
    expect(quoteCantSupplyRowClass(true)).toContain('bg-foam');
    expect(quoteCantSupplyRowClass(true)).not.toContain('opacity');
    expect(quoteCantSupplyMutedClass(true)).toContain('opacity-50');
    expect(quoteCantSupplyControlClass(true)).toContain('text-ink');
    expect(quoteCantSupplyControlClass(false)).toContain('text-muted');
    expect(orderLineCantSupplyCue(true)).toBe('Can’t supply');
    expect(orderLineCantSupplyCue(false)).toBeNull();
    expect(orderLineLeftoverCue({ unavailableReason: 'No longer available' })).toBe(
      'No longer available',
    );
    expect(orderLineLeftoverCue({ unavailableReason: null })).toBeNull();
  });

  it('keeps declined lines for Dispatch-style quote cards', () => {
    const items = [line('a', 'open'), line('b', 'declined')];
    expect(quoteSheetItems(items)).toHaveLength(2);
    expect(quoteUnavailableOnOpen(items, {})).toEqual({ a: false, b: true });
  });

  it('reference cue shows set price before a quote; Quoted after', () => {
    expect(
      quoteSheetReferenceCue({
        asked: 50,
        hasSellerQuote: false,
        quotedQty: 50,
        quotedRate: 2450,
        formatAmount: (n) => `₹${n.toLocaleString('en-IN')}`,
      }),
    ).toBe('Asked 50 · ₹2,450');
    expect(
      quoteSheetReferenceCue({
        asked: 50,
        hasSellerQuote: false,
        quotedQty: 50,
        quotedRate: null,
        formatAmount: (n) => `₹${n}`,
      }),
    ).toBe('Asked 50');
    expect(
      quoteSheetReferenceCue({
        asked: 50,
        hasSellerQuote: true,
        quotedQty: 40,
        quotedRate: 80,
        formatAmount: (n) => `₹${n}`,
      }),
    ).toBe('Asked 50 · Quoted 40 · ₹80');
  });
});
