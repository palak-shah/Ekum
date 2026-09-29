import { describe, expect, it } from 'vitest';
import {
  inboxSwipeAxis,
  inboxSwipeReveal,
  inboxSwipeSettle,
  inboxSwipeShouldOpen,
  INBOX_SWIPE_MAX_PX,
} from './inboxRowSwipe';

describe('inboxSwipeReveal', () => {
  it('opens on a left swipe, not a right swipe', () => {
    expect(inboxSwipeReveal(20)).toBe(0);
    expect(inboxSwipeReveal(-80)).toBe(80);
    expect(inboxSwipeShouldOpen(-80)).toBe(true);
    expect(inboxSwipeShouldOpen(-20)).toBe(false);
  });

  it('locks to a side swipe, not a list scroll', () => {
    expect(inboxSwipeAxis(-4, 2)).toBeNull();
    expect(inboxSwipeAxis(-40, 8)).toBe('x');
    expect(inboxSwipeAxis(-8, 40)).toBe('y');
    expect(inboxSwipeSettle(-80)).toBe(-INBOX_SWIPE_MAX_PX);
    expect(inboxSwipeSettle(-10)).toBe(0);
  });
});
