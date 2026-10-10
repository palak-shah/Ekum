import { describe, expect, it } from 'vitest';
import { orderLineQtyRateLine } from './orderLineQtyRate';

describe('orderLineQtyRateLine', () => {
  it('shows qty only when rate is missing', () => {
    expect(orderLineQtyRateLine(5, null, 'set')).toBe('5');
    expect(orderLineQtyRateLine(5, undefined, null)).toBe('5');
  });

  it('shows qty × rate per dispatch when pack unit', () => {
    expect(orderLineQtyRateLine(5, 1200, 'set', 'pc')).toBe('5 × ₹1,200/pc');
  });

  it('never says On request', () => {
    expect(orderLineQtyRateLine(3, null, 'pc')).not.toMatch(/on request/i);
  });
});
