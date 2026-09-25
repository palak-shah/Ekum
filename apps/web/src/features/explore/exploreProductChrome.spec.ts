import { describe, expect, it } from 'vitest';
import { exploreProductTradeDock } from './exploreProductChrome';

describe('exploreProductTradeDock', () => {
  it('pins Ask / Order / Curate for a visitor on a visible design', () => {
    expect(exploreProductTradeDock({ visitor: true, visible: true })).toBe(true);
  });

  it('hides the dock for the owner even if they sell or trade', () => {
    expect(exploreProductTradeDock({ visitor: false, visible: true })).toBe(false);
  });

  it('hides the dock when the design is not visible', () => {
    expect(exploreProductTradeDock({ visitor: true, visible: false })).toBe(false);
  });
});
