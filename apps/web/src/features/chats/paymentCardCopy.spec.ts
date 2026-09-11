import { describe, expect, it } from 'vitest';
import { paymentCardTitle } from './paymentCardCopy';

describe('paymentCardTitle', () => {
  it('includes order id when paid', () => {
    expect(
      paymentCardTitle({
        paid: true,
        orderLabel: 'Order #FS3C',
        totalLabel: '₹5,700',
      }),
    ).toBe('Payment · Order #FS3C · Paid');
  });

  it('includes order id and amount when open', () => {
    expect(
      paymentCardTitle({
        paid: false,
        orderLabel: 'Order #FS3C',
        totalLabel: '₹5,700',
      }),
    ).toBe('Payment · Order #FS3C · ₹5,700');
  });

  it('strips Payment prefix from metadata orderLabel', () => {
    expect(
      paymentCardTitle({
        paid: true,
        metaOrderLabel: 'Payment · Order #FS3C',
      }),
    ).toBe('Payment · Order #FS3C · Paid');
  });
});
