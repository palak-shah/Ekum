import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  isProfileCompletenessDismissed,
  writeProfileCompletenessDismissed,
} from './profileCompletenessDismiss';

describe('profileCompletenessDismiss', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('hides only for the matching fingerprint', () => {
    writeProfileCompletenessDismissed('co-1', 'logo|cover');
    expect(isProfileCompletenessDismissed('co-1', 'logo|cover')).toBe(true);
    expect(isProfileCompletenessDismissed('co-1', 'logo')).toBe(false);
    expect(isProfileCompletenessDismissed('co-2', 'logo|cover')).toBe(false);
  });
});
