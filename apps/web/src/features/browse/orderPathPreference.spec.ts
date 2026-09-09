import { describe, expect, it } from 'vitest';
import { OrderPathPreference } from '@ekum/domain-types';
import { effectiveOrderPath, resolveOrderPathPreference } from './orderPathPreference';

describe('resolveOrderPathPreference', () => {
  it('defaults to handle', () => {
    expect(resolveOrderPathPreference(null)).toBe(OrderPathPreference.Handle);
    expect(resolveOrderPathPreference({})).toBe(OrderPathPreference.Handle);
  });

  it('reads direct when set', () => {
    expect(resolveOrderPathPreference({ orderPathPreference: 'direct' })).toBe(
      OrderPathPreference.Direct,
    );
  });

  it('reads handle', () => {
    expect(resolveOrderPathPreference({ orderPathPreference: 'handle' })).toBe(
      OrderPathPreference.Handle,
    );
  });
});

describe('effectiveOrderPath', () => {
  it('override wins', () => {
    expect(
      effectiveOrderPath({
        profileDefault: OrderPathPreference.Direct,
        override: OrderPathPreference.Handle,
      }),
    ).toBe(OrderPathPreference.Handle);
  });

  it('null override uses profile', () => {
    expect(
      effectiveOrderPath({
        profileDefault: OrderPathPreference.Handle,
        override: null,
      }),
    ).toBe(OrderPathPreference.Handle);
  });
});
