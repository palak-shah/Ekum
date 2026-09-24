import { describe, expect, it } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { orderNeedsYouLabel } from './tradeNeedsYouLabel';

function order(partial: Partial<OrderView>): OrderView {
  return {
    id: 'o1',
    status: 'requested',
    direction: 'selling',
    items: [
      {
        id: 'oi1',
        name: 'A',
        quantity: 10,
        requestedQuantity: 10,
        shippedQuantity: 0,
        remainingQuantity: 10,
        lineStatus: 'open',
        rate: null,
        unit: 'pc',
        sku: null,
        productId: 'p1',
        images: [],
        note: null,
      },
    ],
    ...partial,
  } as OrderView;
}

describe('orderNeedsYouLabel', () => {
  it('names send quote when seller still needs rates', () => {
    expect(orderNeedsYouLabel(order({}))).toBe('Needs you · Send quote');
  });

  it('returns null when nothing to do', () => {
    expect(
      orderNeedsYouLabel(
        order({
          direction: 'buying',
          canAcceptQuote: false,
          items: [
            {
              id: 'oi1',
              name: 'A',
              quantity: 10,
              requestedQuantity: 10,
              shippedQuantity: 0,
              remainingQuantity: 10,
              lineStatus: 'open',
              rate: 100,
              unit: 'pc',
              sku: null,
              productId: 'p1',
              images: [],
              note: null,
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it('does not say Confirm when the mill still has the lot', () => {
    const trading = order({
      items: [
        {
          id: 'oi1',
          name: 'A',
          quantity: 10,
          requestedQuantity: 10,
          shippedQuantity: 0,
          remainingQuantity: 10,
          lineStatus: 'open',
          rate: 80,
          unit: 'pc',
          sku: null,
          productId: 'p1',
          images: [],
          note: null,
        },
      ],
      linkedMills: [
        { name: 'Surat Silk House', orderId: null },
        { name: 'Ahmedabad Loom Co', orderId: null },
      ],
    });
    expect(orderNeedsYouLabel(trading)).toBe(
      'Needs you · Send to Surat Silk House + Ahmedabad Loom Co',
    );
  });

  it('names one mill to send to', () => {
    expect(
      orderNeedsYouLabel(
        order({
          linkedMills: [{ name: 'Ahmedabad Loom Co', orderId: null }],
        }),
      ),
    ).toBe('Needs you · Send to Ahmedabad Loom Co');
  });

  it('is quiet when waiting on mill rates', () => {
    expect(
      orderNeedsYouLabel(
        order({
          linkedMills: [{ name: 'Ahmedabad Loom Co', orderId: 'up1' }],
        }),
      ),
    ).toBeNull();
  });

  it('asks the trader to pass mill rates', () => {
    expect(
      orderNeedsYouLabel(
        order({
          needsQuotePass: true,
          linkedMills: [{ name: 'Ahmedabad Loom Co', orderId: 'up1' }],
        }),
      ),
    ).toBe('Needs you · Send quote');
  });
});
