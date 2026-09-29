import { describe, expect, it } from 'vitest';
import { inboxSwipeReveal, inboxSwipeShouldOpen } from './inboxRowSwipe';

describe('inboxSwipeReveal', () => {
  it('opens on a left swipe, not a right swipe', () => {
    expect(inboxSwipeReveal(20)).toBe(0);
    expect(inboxSwipeReveal(-80)).toBe(80);
    expect(inboxSwipeShouldOpen(-80)).toBe(true);
    expect(inboxSwipeShouldOpen(-20)).toBe(false);
  });
});
