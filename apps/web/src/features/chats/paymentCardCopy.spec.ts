import { describe, expect, it } from 'vitest';
import { orderIdFromPaymentText, paymentCardTitle } from './paymentCardCopy';

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

  it('derives order id from metadata orderId when labels are missing (paid)', () => {
    expect(
      paymentCardTitle({
        paid: true,
        orderId: 'seed-order-fs3cxxxx',
        name: 'Payment · ₹5,700',
      }),
    ).toBe('Payment · Order #XXXX · Paid');
  });

  it('uses living message body when it already has the order id', () => {
    expect(
      paymentCardTitle({
        paid: true,
        body: 'Payment · Order #FS3C · Paid',
        name: 'Payment · ₹5,700',
      }),
    ).toBe('Payment · Order #FS3C · Paid');
  });

  it('uses reference name when it already has order id + Paid', () => {
    expect(
      paymentCardTitle({
        paid: true,
        name: 'Payment · Order #FS3C · Paid',
      }),
    ).toBe('Payment · Order #FS3C · Paid');
  });

  it('derives order id from orderId for open asks without labels', () => {
    expect(
      paymentCardTitle({
        paid: false,
        orderId: 'abc-fs3c',
        totalLabel: '₹5,700',
        name: 'Payment · ₹5,700',
      }),
    ).toBe('Payment · Order #FS3C · ₹5,700');
  });
});

describe('orderIdFromPaymentText', () => {
  it('extracts Order # from payment body', () => {
    expect(orderIdFromPaymentText('Payment · Order #FS3C · Paid')).toBe('Order #FS3C');
  });
});
