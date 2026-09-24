import { describe, expect, it } from 'vitest';
import {
  orderLineCantSupplyCue,
  quoteCantSupplyControlClass,
  quoteCantSupplyMutedClass,
  quoteCantSupplyRowClass,
  quoteSheetItems,
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
    expect(quoteCantSupplyRowClass(true)).not.toContain('opacity');
    expect(quoteCantSupplyMutedClass(true)).toContain('opacity-50');
    expect(quoteCantSupplyControlClass(true)).toContain('text-ink');
    expect(quoteCantSupplyControlClass(false)).toContain('text-muted');
    expect(orderLineCantSupplyCue(true)).toBe('Can’t supply');
    expect(orderLineCantSupplyCue(false)).toBeNull();
  });
});
