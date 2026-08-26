import { describe, expect, it } from 'vitest';
import { parseTradeSide, receivedDayLabel, resolveExploreTradeSide } from './exploreTradeSide';

describe('exploreTradeSide', () => {
  it('parses side; omit and unknown are All', () => {
    expect(parseTradeSide(null)).toBe('all');
    expect(parseTradeSide('buying')).toBe('buying');
    expect(parseTradeSide('selling')).toBe('selling');
    expect(parseTradeSide('market')).toBe('all');
  });

  it('resolves dual default buying and single-role lock', () => {
    expect(resolveExploreTradeSide(null, { buying: true, selling: true })).toBe('buying');
    expect(resolveExploreTradeSide('all', { buying: true, selling: true })).toBe('buying');
    expect(resolveExploreTradeSide('selling', { buying: true, selling: true })).toBe('selling');
    expect(resolveExploreTradeSide('buying', { buying: false, selling: true })).toBe('selling');
    expect(resolveExploreTradeSide('selling', { buying: true, selling: false })).toBe('buying');
  });

  it('labels UTC received days', () => {
    const now = new Date('2026-08-22T15:00:00.000Z');
    expect(receivedDayLabel('2026-08-22', now)).toBe('Today');
    expect(receivedDayLabel('2026-08-21', now)).toBe('Yesterday');
    expect(receivedDayLabel('2026-08-10', now)).toMatch(/10/);
  });
});
