import { describe, expect, it } from 'vitest';
import { filterMenuWidthFallback, placeFilterMenu } from './filterMenuPosition';

describe('placeFilterMenu', () => {
  it('keeps Change View on-screen when the filter square sits left of 1 selected', () => {
    const menuWidth = 296;
    const pos = placeFilterMenu({ bottom: 96, right: 220 }, menuWidth, 390);
    expect(pos.top).toBe(102);
    expect(pos.right).toBe(86);
    expect(390 - pos.right - menuWidth).toBe(8);
  });

  it('still right-aligns to the square when the row has room', () => {
    expect(placeFilterMenu({ bottom: 96, right: 330 }, 296, 390).right).toBe(60);
  });
});

describe('filterMenuWidthFallback', () => {
  it('never exceeds the viewport minus 2rem', () => {
    expect(filterMenuWidthFallback(390)).toBe(296);
    expect(filterMenuWidthFallback(300)).toBe(268);
  });
});
