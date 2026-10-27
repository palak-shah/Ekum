import { describe, expect, it } from 'vitest';
import {
  FILTER_MENU_GAP_PX,
  FILTER_MENU_GUTTER_PX,
  filterMenuWidthFallback,
  placeFilterMenu,
  readFilterMenuFrameBounds,
} from './filterMenuPosition';

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

  it('stays inside the phone column when the window is wider than the shell', () => {
    const menuWidth = 296;
    const viewportWidth = 599;
    const bounds = { left: 76, right: 524 };
    const pos = placeFilterMenu(
      { bottom: 96, right: 341 },
      menuWidth,
      viewportWidth,
      FILTER_MENU_GUTTER_PX,
      FILTER_MENU_GAP_PX,
      bounds,
    );
    const left = viewportWidth - pos.right - menuWidth;
    expect(left).toBe(bounds.left + FILTER_MENU_GUTTER_PX);
    expect(left + menuWidth).toBeLessThanOrEqual(bounds.right - FILTER_MENU_GUTTER_PX);
  });
});

describe('readFilterMenuFrameBounds', () => {
  it('uses the window when the shell is missing', () => {
    expect(readFilterMenuFrameBounds(599, null)).toEqual({ left: 0, right: 599 });
  });

  it('uses the shell box on a wide laptop', () => {
    expect(readFilterMenuFrameBounds(599, { left: 76, right: 524, width: 448 })).toEqual({
      left: 76,
      right: 524,
    });
  });
});

describe('filterMenuWidthFallback', () => {
  it('never exceeds the viewport minus 2rem', () => {
    expect(filterMenuWidthFallback(390)).toBe(296);
    expect(filterMenuWidthFallback(300)).toBe(268);
  });
});
