import { describe, expect, it } from 'vitest';
import { rankWindowTake } from './rank-window';

describe('rankWindowTake', () => {
  it('floors at 60 for small page sizes', () => {
    expect(rankWindowTake(12)).toBe(60);
    expect(rankWindowTake(20)).toBe(100);
  });

  it('caps at 200 so one request cannot load the whole market', () => {
    expect(rankWindowTake(100)).toBe(200);
    expect(rankWindowTake(1000)).toBe(200);
  });

  it('tolerates bad limits', () => {
    expect(rankWindowTake(0)).toBe(60);
    expect(rankWindowTake(Number.NaN)).toBe(60);
  });
});
