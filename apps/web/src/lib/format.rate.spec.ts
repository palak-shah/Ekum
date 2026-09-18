import { describe, expect, it } from 'vitest';
import { formatRate } from './format';

describe('formatRate', () => {
  it('shows on request when rate is null', () => {
    expect(formatRate(null, 'pc')).toBe('On request');
  });

  it('formats a single rate with unit', () => {
    expect(formatRate(1200, 'pc')).toBe('₹1,200/pc');
  });

  it('formats a rate range', () => {
    expect(formatRate(1200, 'pc', 1400)).toBe('₹1,200–₹1,400/pc');
  });
});
