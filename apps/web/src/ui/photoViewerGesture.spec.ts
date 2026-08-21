import { describe, expect, it } from 'vitest';
import {
  ZOOM_NEAR_1,
  classifyDrag,
  doubleTapScale,
  isNearFit,
  nextIndex,
} from './photoViewerGesture';

describe('isNearFit', () => {
  it('treats scale at or below ZOOM_NEAR_1 as fit', () => {
    expect(isNearFit(1)).toBe(true);
    expect(isNearFit(ZOOM_NEAR_1)).toBe(true);
    expect(isNearFit(ZOOM_NEAR_1 + 0.01)).toBe(false);
  });
});

describe('classifyDrag', () => {
  it('pans when zoomed even if horizontal dominates', () => {
    expect(classifyDrag({ scale: 2, dx: 80, dy: 10, urlCount: 3 })).toBe('pan');
  });

  it('swipes next/prev when near fit and horizontal wins', () => {
    expect(classifyDrag({ scale: 1, dx: -80, dy: 10, urlCount: 3 })).toBe('swipe-next');
    expect(classifyDrag({ scale: 1, dx: 80, dy: 10, urlCount: 3 })).toBe('swipe-prev');
  });

  it('swipes down when near fit and vertical dominates', () => {
    expect(classifyDrag({ scale: 1, dx: 10, dy: 80, urlCount: 3 })).toBe('swipe-down');
  });

  it('does not change photo when only one url', () => {
    expect(classifyDrag({ scale: 1, dx: -80, dy: 0, urlCount: 1 })).toBe('none');
  });
});

describe('nextIndex', () => {
  it('clamps at ends', () => {
    expect(nextIndex(0, 3, 'swipe-prev')).toBe(0);
    expect(nextIndex(2, 3, 'swipe-next')).toBe(2);
    expect(nextIndex(1, 3, 'swipe-next')).toBe(2);
  });
});

describe('doubleTapScale', () => {
  it('zooms in from fit and back to fit when zoomed', () => {
    expect(doubleTapScale(1)).toBeGreaterThan(1);
    expect(doubleTapScale(2.5)).toBe(1);
  });
});
