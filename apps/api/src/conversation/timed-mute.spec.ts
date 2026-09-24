import { describe, expect, it } from 'vitest';
import { isMuteActive, mutedUntilFrom } from '@ekum/domain-types';

describe('timed mute', () => {
  const now = Date.parse('2026-09-23T12:00:00.000Z');

  it('always has no end', () => {
    expect(mutedUntilFrom('always', now)).toBeNull();
    expect(mutedUntilFrom(undefined, now)).toBeNull();
  });

  it('sets 8 hours and 1 week', () => {
    expect(mutedUntilFrom('8h', now)?.toISOString()).toBe('2026-09-23T20:00:00.000Z');
    expect(mutedUntilFrom('1w', now)?.toISOString()).toBe('2026-09-30T12:00:00.000Z');
  });

  it('treats expired mute as off', () => {
    expect(isMuteActive('muted', new Date(now - 1), now)).toBe(false);
    expect(isMuteActive('muted', new Date(now + 1), now)).toBe(true);
    expect(isMuteActive('muted', null, now)).toBe(true);
    expect(isMuteActive('all', null, now)).toBe(false);
  });
});
