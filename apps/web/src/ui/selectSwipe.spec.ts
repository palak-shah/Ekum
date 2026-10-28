import { describe, expect, it } from 'vitest';
import {
  SELECT_SWIPE_NUDGE_MAX_PX,
  SELECT_SWIPE_PX,
  selectSwipeAxis,
  selectSwipeIntent,
  selectSwipeNudge,
} from './selectSwipe';

describe('selectSwipe', () => {
  it('selects on a right flick when off, deselects on a left flick when on', () => {
    expect(selectSwipeIntent(SELECT_SWIPE_PX, false)).toBe('select');
    expect(selectSwipeIntent(80, false)).toBe('select');
    expect(selectSwipeIntent(-SELECT_SWIPE_PX, true)).toBe('deselect');
    expect(selectSwipeIntent(-80, true)).toBe('deselect');
  });

  it('does nothing when already in that state or the flick is short', () => {
    expect(selectSwipeIntent(80, true)).toBeNull();
    expect(selectSwipeIntent(-80, false)).toBeNull();
    expect(selectSwipeIntent(20, false)).toBeNull();
    expect(selectSwipeIntent(-20, true)).toBeNull();
  });

  it('locks to a side swipe, not a list scroll', () => {
    expect(selectSwipeAxis(4, 2)).toBeNull();
    expect(selectSwipeAxis(40, 8)).toBe('x');
    expect(selectSwipeAxis(-40, 8)).toBe('x');
    expect(selectSwipeAxis(-8, 40)).toBe('y');
  });

  it('caps the follow nudge', () => {
    expect(selectSwipeNudge(12)).toBe(12);
    expect(selectSwipeNudge(80)).toBe(SELECT_SWIPE_NUDGE_MAX_PX);
    expect(selectSwipeNudge(-80)).toBe(-SELECT_SWIPE_NUDGE_MAX_PX);
  });
});
