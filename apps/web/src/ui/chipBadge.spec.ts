import { describe, expect, it } from 'vitest';
import { chipCountBadge } from './chipBadge';

describe('chipCountBadge', () => {
  it('hides at 0 and caps at 99+', () => {
    expect(chipCountBadge(0)).toBeNull();
    expect(chipCountBadge(1)).toBe('1');
    expect(chipCountBadge(99)).toBe('99');
    expect(chipCountBadge(100)).toBe('99+');
  });
});
