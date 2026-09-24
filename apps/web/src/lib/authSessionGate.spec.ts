import { describe, expect, it } from 'vitest';
import {
  authSessionGeneration,
  invalidateAuthSessionGeneration,
  isCurrentAuthSession,
} from './authSessionGate';

describe('authSessionGate', () => {
  it('treats a refresh started before Logout as stale', () => {
    const started = authSessionGeneration();
    expect(isCurrentAuthSession(started)).toBe(true);
    invalidateAuthSessionGeneration();
    expect(isCurrentAuthSession(started)).toBe(false);
    expect(isCurrentAuthSession(authSessionGeneration())).toBe(true);
  });
});
