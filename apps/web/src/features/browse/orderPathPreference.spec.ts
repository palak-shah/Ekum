import { describe, expect, it } from 'vitest';
import { OrderPathPreference } from '@ekum/domain-types';
import { effectiveOrderPath, resolveOrderPathPreference } from './orderPathPreference';

describe('resolveOrderPathPreference', () => {
  it('defaults to direct', () => {
    expect(resolveOrderPathPreference(null)).toBe(OrderPathPreference.Direct);
    expect(resolveOrderPathPreference({})).toBe(OrderPathPreference.Direct);
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
