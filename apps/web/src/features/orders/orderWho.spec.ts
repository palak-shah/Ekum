import { describe, expect, it } from 'vitest';
import { isTenDigitPhone, orderWhoMode } from './orderWho';

describe('orderWhoMode', () => {
  it('hides Who when they only buy', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: false,
        actorCompanyId: 'me',
        productCompanyIds: ['mill'],
      }),
    ).toBe('hidden');
  });

  it('defaults For me when any design is someone else’s', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: true,
        actorCompanyId: 'me',
        productCompanyIds: ['mill', 'me'],
      }),
    ).toBe('for-me-default');
  });

  it('requires For a buyer when every design is yours', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: true,
        actorCompanyId: 'me',
        productCompanyIds: ['me', 'me'],
      }),
    ).toBe('buyer-only');
  });
});

describe('isTenDigitPhone', () => {
  it('accepts a 10-digit number', () => {
    expect(isTenDigitPhone('9876543210')).toBe(true);
    expect(isTenDigitPhone('98765')).toBe(false);
  });
});
