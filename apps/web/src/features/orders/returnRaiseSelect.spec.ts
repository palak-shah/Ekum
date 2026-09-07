import { describe, expect, it } from 'vitest';
import {
  allReturnLinesSelected,
  clearReturnSelection,
  selectAllReturnLines,
} from './returnRaiseSelect';

type Line = { id: string; quantity: number };

const items: Line[] = [
  { id: 'a', quantity: 20 },
  { id: 'b', quantity: 10 },
  { id: 'c', quantity: 5 },
];

describe('returnRaiseSelect', () => {
  it('selectAll turns every line on and resets qty to ordered', () => {
    const { selected, qty } = selectAllReturnLines(items);
    expect(selected).toEqual({ a: true, b: true, c: true });
    expect(qty).toEqual({ a: '20', b: '10', c: '5' });
    expect(allReturnLinesSelected(items, selected)).toBe(true);
  });

  it('clear turns every line off without changing qty map', () => {
    const qty = { a: '20', b: '3', c: '5' };
    const selected = clearReturnSelection(items);
    expect(selected).toEqual({ a: false, b: false, c: false });
    expect(allReturnLinesSelected(items, selected)).toBe(false);
    expect(qty).toEqual({ a: '20', b: '3', c: '5' });
  });
});
