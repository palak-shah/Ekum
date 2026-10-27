import { describe, expect, it, vi } from 'vitest';
import { scrollOpenedIntoView } from './scrollWhenOpened';

describe('scrollOpenedIntoView', () => {
  it('scrolls nearest once the frame paints', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const scrollIntoView = vi.fn();
    scrollOpenedIntoView({ scrollIntoView } as unknown as HTMLElement);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
    raf.mockRestore();
  });

  it('no-ops without a node', () => {
    expect(() => scrollOpenedIntoView(null)).not.toThrow();
  });
});
