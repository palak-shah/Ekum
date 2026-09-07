import { describe, expect, it, vi } from 'vitest';
import {
  createStickLatch,
  isNearBottom,
  scrollListToBottom,
} from './threadStickScroll';

describe('isNearBottom', () => {
  it('is true near the end', () => {
    expect(
      isNearBottom({ scrollHeight: 1000, scrollTop: 880, clientHeight: 100 }),
    ).toBe(true);
  });

  it('is false when reading older messages', () => {
    expect(
      isNearBottom({ scrollHeight: 1000, scrollTop: 200, clientHeight: 100 }),
    ).toBe(false);
  });
});

describe('scrollListToBottom', () => {
  it('does not apply a pending scroll after shouldStick flips false', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
    const list = { scrollTop: 0, scrollHeight: 800 } as HTMLDivElement;
    let stick = true;

    scrollListToBottom(list, { shouldStick: () => stick });
    stick = false;
    await vi.runAllTimersAsync();

    expect(list.scrollTop).toBe(0);
    vi.useRealTimers();
  });

  it('scrolls when still sticking', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
    const list = { scrollTop: 0, scrollHeight: 800 } as HTMLDivElement;

    scrollListToBottom(list, { shouldStick: () => true });
    await vi.runAllTimersAsync();

    expect(list.scrollTop).toBe(800);
    vi.useRealTimers();
  });
});

describe('createStickLatch', () => {
  it('unpins when the user leaves the bottom', () => {
    const latch = createStickLatch(true);
    expect(latch.onScroll(false)).toBe('unpinned');
    expect(latch.isStuck()).toBe(false);
  });

  it('stays unpinned when layout clamps near bottom without user intent', () => {
    const latch = createStickLatch(true);
    latch.onScroll(false);
    expect(latch.onScroll(true)).toBe('unchanged');
    expect(latch.isStuck()).toBe(false);
  });

  it('re-pins only when a user-driven scroll returns to the bottom', () => {
    const latch = createStickLatch(true);
    latch.onScroll(false);
    latch.setUserDriven(true);
    expect(latch.onScroll(true)).toBe('pinned');
    expect(latch.isStuck()).toBe(true);
  });

  it('ignores programmatic scrolls', () => {
    const latch = createStickLatch(true);
    latch.beginProgrammatic();
    expect(latch.onScroll(false)).toBe('unchanged');
    expect(latch.isStuck()).toBe(true);
    latch.endProgrammatic();
  });

  it('stays unpinned after explicit unpin despite near-bottom clamp', () => {
    const latch = createStickLatch(true);
    latch.unpin();
    expect(latch.isStuck()).toBe(false);
    expect(latch.onScroll(true)).toBe('unchanged');
    expect(latch.isStuck()).toBe(false);
  });
});
