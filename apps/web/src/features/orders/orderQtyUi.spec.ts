import { describe, expect, it } from 'vitest';
import { orderSheetTitle } from './orderQtyUi';

describe('orderSheetTitle', () => {
  it('uses singular for one design', () => {
    expect(orderSheetTitle(1)).toBe('1 design');
  });

  it('uses plural for multiple designs', () => {
    expect(orderSheetTitle(3)).toBe('3 designs');
  });
});
