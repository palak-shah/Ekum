import { describe, expect, it, vi } from 'vitest';
import { applySelectingPill } from './selectingPill';

describe('applySelectingPill', () => {
  it('clears and exits when Selecting with a non-zero count', () => {
    const shortlist = { clear: vi.fn(), setSelectMode: vi.fn() };
    applySelectingPill(true, 3, shortlist);
    expect(shortlist.clear).toHaveBeenCalledOnce();
    expect(shortlist.setSelectMode).not.toHaveBeenCalled();
  });

  it('exits when Selecting with 0 selected', () => {
    const shortlist = { clear: vi.fn(), setSelectMode: vi.fn() };
    applySelectingPill(true, 0, shortlist);
    expect(shortlist.setSelectMode).toHaveBeenCalledWith(false);
    expect(shortlist.clear).not.toHaveBeenCalled();
  });

  it('enters select mode when not selecting', () => {
    const shortlist = { clear: vi.fn(), setSelectMode: vi.fn() };
    applySelectingPill(false, 0, shortlist);
    expect(shortlist.setSelectMode).toHaveBeenCalledWith(true);
  });
});
