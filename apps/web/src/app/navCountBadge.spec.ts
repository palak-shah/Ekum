import { describe, expect, it } from 'vitest';
import { ordersNavAriaLabel, tabCountBadge, tabCountLabel } from './navCountBadge';

describe('navCountBadge', () => {
  it('hides a zero or missing count', () => {
    expect(tabCountBadge(undefined)).toBeUndefined();
    expect(tabCountBadge(0)).toBeUndefined();
    expect(tabCountBadge(4)).toBe(4);
  });

  it('shows the exact count', () => {
    expect(tabCountLabel(9)).toBe('9');
    expect(tabCountLabel(12)).toBe('12');
  });

  it('names Orders work in the accessible label', () => {
    expect(ordersNavAriaLabel(0)).toBe('Orders');
    expect(ordersNavAriaLabel(3)).toBe('Orders, 3 need you');
    expect(ordersNavAriaLabel(12)).toBe('Orders, 12 need you');
  });
});
