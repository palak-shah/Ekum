import { describe, expect, it } from 'vitest';
import { millLaneVisibleToBuyer } from './mill-desk-visibility';

describe('millLaneVisibleToBuyer', () => {
  it('shows mill when ticket is mill (transparent desk)', () => {
    expect(millLaneVisibleToBuyer({ ticket: 'mill', reveal: false })).toBe(true);
  });

  it('shows mill when reveal On even if ticket is me (group ⇒ named on order)', () => {
    expect(millLaneVisibleToBuyer({ ticket: 'me', reveal: true })).toBe(true);
  });

  it('hides mill when private Me + reveal Off', () => {
    expect(millLaneVisibleToBuyer({ ticket: 'me', reveal: false })).toBe(false);
    expect(millLaneVisibleToBuyer({ ticket: null, reveal: null })).toBe(false);
  });
});
