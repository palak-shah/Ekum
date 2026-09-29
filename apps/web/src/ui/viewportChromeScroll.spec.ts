import { describe, expect, it } from 'vitest';
import { isViewportChromeScroll } from './viewportChromeScroll';

describe('isViewportChromeScroll', () => {
  it('treats document / window scroll as chrome, not a list', () => {
    expect(isViewportChromeScroll({ target: document } as Event)).toBe(true);
    expect(isViewportChromeScroll({ target: document.documentElement } as Event)).toBe(true);
    expect(isViewportChromeScroll({ target: window } as Event)).toBe(true);
  });

  it('treats an overflowing list as real content scroll', () => {
    const list = document.createElement('div');
    expect(isViewportChromeScroll({ target: list } as Event)).toBe(false);
  });
});
