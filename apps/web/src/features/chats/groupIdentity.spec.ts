import { describe, expect, it } from 'vitest';
import { commitGroupBlurb, commitGroupTitle } from './groupIdentity';

describe('commitGroupTitle', () => {
  it('saves a trimmed new name and ignores empty or same', () => {
    expect(commitGroupTitle('  Wedding circle  ', 'Old')).toBe('Wedding circle');
    expect(commitGroupTitle('   ', 'Old')).toBeNull();
    expect(commitGroupTitle('Old', 'Old')).toBeNull();
  });
});

describe('commitGroupBlurb', () => {
  it('saves, clears, or no-ops the one-line', () => {
    expect(commitGroupBlurb('  Rates  ', '')).toBe('Rates');
    expect(commitGroupBlurb('   ', 'Rates')).toBeNull();
    expect(commitGroupBlurb('Rates', 'Rates')).toBeUndefined();
  });
});
