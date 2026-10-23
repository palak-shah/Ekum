import { describe, expect, it } from 'vitest';
import {
  BOTTOM_DOCK_CLEARANCE_CLASS,
  SELECTION_DOCK_CLEARANCE_CLASS,
  bottomTradeDockClass,
} from './BottomTradeDock';

describe('bottomTradeDockClass', () => {
  it('takes pointer events above the tab bar so Ask / Order are not dead taps', () => {
    const cls = bottomTradeDockClass(false);
    expect(cls).toContain('pointer-events-auto');
    expect(cls).toContain('z-50');
    expect(cls).toContain('bottom-0');
    expect(cls).toContain('bg-surface/95');
  });

  it('sits above the tab bar only when the page still shows nav', () => {
    const cls = bottomTradeDockClass(true);
    expect(cls).toContain('bottom-20');
    expect(cls).not.toMatch(/(?:^|\s)bottom-0(?:\s|$)/);
  });

  it('Order clearance is tighter than selection dock clearance', () => {
    expect(BOTTOM_DOCK_CLEARANCE_CLASS).toContain('5rem');
    expect(SELECTION_DOCK_CLEARANCE_CLASS).toContain('7rem');
  });
});
