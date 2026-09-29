import { describe, expect, it } from 'vitest';
import { howManyFooterSlots } from './howManyFooterSlots';

describe('howManyFooterSlots', () => {
  it('puts Share with Place; Ask and Order for buyer after', () => {
    expect(howManyFooterSlots({ showPlaceOrderAsk: true, canOrderForBuyer: true })).toEqual([
      'place',
      'share',
      'ask',
      'order-buyer',
    ]);
  });

  it('keeps Share when they can only order for a buyer', () => {
    expect(howManyFooterSlots({ showPlaceOrderAsk: false, canOrderForBuyer: true })).toEqual([
      'order-buyer',
      'share',
    ]);
  });
});
