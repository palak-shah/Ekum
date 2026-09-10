import { describe, expect, it } from 'vitest';
import { isEkumDebug } from './ekumDebug';

describe('isEkumDebug', () => {
  it('defaults to false', () => {
    expect(isEkumDebug(undefined, () => null)).toBe(false);
    expect(isEkumDebug('false', () => null)).toBe(false);
  });

  it('reads VITE_EKUM_DEBUG when storage is unset', () => {
    expect(isEkumDebug('true', () => null)).toBe(true);
    expect(isEkumDebug('1', () => null)).toBe(true);
  });

  it('lets localStorage override env', () => {
    expect(isEkumDebug('false', (k) => (k === 'ekum.debug' ? 'true' : null))).toBe(true);
    expect(isEkumDebug('true', (k) => (k === 'ekum.debug' ? 'false' : null))).toBe(false);
  });
});
