import { describe, expect, it } from 'vitest';
import { asTradeDefaults, mergeTradeDefaults, resolveTradePresence } from './trade-presence';

describe('resolveTradePresence', () => {
  it('defaults both sides on when unset', () => {
    expect(resolveTradePresence(null)).toEqual({ buying: true, selling: true });
    expect(resolveTradePresence({})).toEqual({ buying: true, selling: true });
  });

  it('respects explicit false flags', () => {
    expect(resolveTradePresence({ buyingEnabled: false, sellingEnabled: true })).toEqual({
      buying: false,
      selling: true,
    });
    expect(resolveTradePresence({ sellingEnabled: false })).toEqual({
      buying: true,
      selling: false,
    });
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
