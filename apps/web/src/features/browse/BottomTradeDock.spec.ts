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
  });

  it('Order clearance is tighter than selection dock clearance', () => {
    expect(BOTTOM_DOCK_CLEARANCE_CLASS).toContain('5rem');
    expect(SELECTION_DOCK_CLEARANCE_CLASS).toContain('7rem');
  });
});
