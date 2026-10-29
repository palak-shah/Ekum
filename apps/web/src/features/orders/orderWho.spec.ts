import { describe, expect, it } from 'vitest';
import { isTenDigitPhone, orderForBuyerLoggedToast, orderWhoMode } from './orderWho';

describe('orderWhoMode', () => {
  it('hides Who when they only buy', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: false,
        actorCompanyId: 'me',
        sellerCompanyId: 'mill',
      }),
    ).toBe('hidden');
  });

  it('defaults For me when the order goes to another shop', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: true,
        actorCompanyId: 'me',
        sellerCompanyId: 'jaipur',
      }),
    ).toBe('for-me-default');
  });

  it('Place for me on a peer pack even when every member is my mill SKU', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: true,
        actorCompanyId: 'me',
        sellerCompanyId: 'jaipur',
      }),
    ).toBe('for-me-default');
  });

  it('requires For a buyer when the selling shop is mine', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: true,
        actorCompanyId: 'me',
        sellerCompanyId: 'me',
      }),
    ).toBe('buyer-only');
  });

  it('defaults For me on a mixed mill basket (no single pack owner)', () => {
    expect(
      orderWhoMode({
        canLogForBuyer: true,
        actorCompanyId: 'me',
        sellerCompanyId: 'multi',
      }),
    ).toBe('for-me-default');
  });
});

describe('isTenDigitPhone', () => {
  it('accepts a 10-digit number', () => {
    expect(isTenDigitPhone('9876543210')).toBe(true);
    expect(isTenDigitPhone('98765')).toBe(false);
  });
});

describe('orderForBuyerLoggedToast', () => {
  it('does not tell the buyer to Accept', () => {
    expect(orderForBuyerLoggedToast('confirmed')).toBe('Logged.');
    expect(orderForBuyerLoggedToast('requested')).toBe('Logged. Supplier can confirm.');
  });
});
