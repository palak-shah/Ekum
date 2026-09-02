import { describe, expect, it } from 'vitest';
import { generateOtpCode, hmacHash, parseDurationMs, safeEqual } from './crypto.util';

describe('crypto utilities', () => {
  it('produces a stable keyed hash and differs by secret', () => {
    expect(hmacHash('1234', 'secret-a')).toBe(hmacHash('1234', 'secret-a'));
    expect(hmacHash('1234', 'secret-a')).not.toBe(hmacHash('1234', 'secret-b'));
  });

  it('compares strings safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('generates a numeric OTP of the requested length', () => {
    const code = generateOtpCode(4);
    expect(code).toMatch(/^[0-9]{4}$/);
  });

  it('parses durations into milliseconds', () => {
    expect(parseDurationMs('15m')).toBe(900_000);
    expect(parseDurationMs('30d')).toBe(2_592_000_000);
    expect(parseDurationMs('45s')).toBe(45_000);
    expect(parseDurationMs('10y')).toBe(10 * 365 * 86_400_000);
    expect(() => parseDurationMs('nope')).toThrow();
  });
});
