import { describe, expect, it } from 'vitest';
import {
  firstOrdersListTabWithContent,
  firstOrdersStatusWithContent,
} from './ordersListDefault';

describe('firstOrdersListTabWithContent', () => {
  it('picks first with rows; all empty keeps Selling', () => {
    expect(
      firstOrdersListTabWithContent({ selling: 1, buying: 2, others: 3 }),
    ).toBe('selling');
    expect(
      firstOrdersListTabWithContent({ selling: 0, buying: 2, others: 3 }),
    ).toBe('buying');
    expect(
      firstOrdersListTabWithContent({ selling: 0, buying: 0, others: 1 }),
    ).toBe('others');
    expect(
      firstOrdersListTabWithContent({ selling: 0, buying: 0, others: 0 }),
    ).toBe('selling');
  });
});

describe('firstOrdersStatusWithContent', () => {
  it('picks first with rows; all empty keeps Pending', () => {
    expect(firstOrdersStatusWithContent(2, 5)).toBe('pending');
    expect(firstOrdersStatusWithContent(0, 4)).toBe('completed');
    expect(firstOrdersStatusWithContent(0, 0)).toBe('pending');
  });
});
