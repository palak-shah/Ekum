import { describe, expect, it } from 'vitest';
import {
  asTradeDefaults,
  mergeTradeDefaults,
  resolveOrderPathPreference,
  resolveTradePresence,
} from './trade-presence';

describe('resolveTradePresence', () => {
  it('defaults buy/sell on and trading on when unset (Slice B WIP)', () => {
    expect(resolveTradePresence(null)).toEqual({ buying: true, selling: true, trading: true });
    expect(resolveTradePresence({})).toEqual({ buying: true, selling: true, trading: true });
  });

  it('respects explicit false flags', () => {
    expect(resolveTradePresence({ buyingEnabled: false, sellingEnabled: true })).toEqual({
      buying: false,
      selling: true,
      trading: true,
    });
    expect(resolveTradePresence({ sellingEnabled: false })).toEqual({
      buying: true,
      selling: false,
      trading: true,
    });
    expect(resolveTradePresence({ tradingEnabled: false })).toEqual({
      buying: true,
      selling: true,
      trading: false,
    });
  });

  it('trading on when tradingEnabled true', () => {
    expect(resolveTradePresence({ tradingEnabled: true }).trading).toBe(true);
  });
});

describe('resolveOrderPathPreference', () => {
  it('defaults to handle when missing', () => {
    expect(resolveOrderPathPreference(null)).toBe('handle');
    expect(resolveOrderPathPreference({})).toBe('handle');
    expect(resolveOrderPathPreference({ orderPathPreference: 'handle' })).toBe('handle');
  });

  it('returns direct when set', () => {
    expect(resolveOrderPathPreference({ orderPathPreference: 'direct' })).toBe('direct');
  });
});

describe('mergeTradeDefaults', () => {
  it('preserves existing keys while patching', () => {
    const merged = mergeTradeDefaults(
      { buyingEnabled: false, firstPublishConsentedAt: 'x' },
      { sellingEnabled: true },
    ) as Record<string, unknown>;
    expect(merged).toEqual({
      buyingEnabled: false,
      firstPublishConsentedAt: 'x',
      sellingEnabled: true,
    });
  });

  it('asTradeDefaults copies plain objects', () => {
    expect(asTradeDefaults({ a: 1 })).toEqual({ a: 1 });
    expect(asTradeDefaults(null)).toEqual({});
  });
});
