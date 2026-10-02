import { describe, expect, it } from 'vitest';
import { bottomTradeDockClass } from './BottomTradeDock';

describe('bottomTradeDockClass', () => {
  it('takes pointer events above the tab bar so Ask / Order are not dead taps', () => {
    const cls = bottomTradeDockClass(false);
    expect(cls).toContain('pointer-events-auto');
    expect(cls).toContain('z-50');
    expect(cls).toContain('bottom-0');
  });
});
