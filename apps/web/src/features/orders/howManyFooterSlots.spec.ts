import { describe, expect, it } from 'vitest';
import { howManyFooterSlots } from './howManyFooterSlots';

describe('howManyFooterSlots', () => {
  it('order job: Place only for pure buyers', () => {
    expect(
      howManyFooterSlots({
        sheetJob: 'order',
        showPlaceOrder: true,
        canOrderForBuyer: false,
      }),
    ).toEqual(['place']);
  });

  it('order job: Order for buyer switch then Place', () => {
    expect(
      howManyFooterSlots({
        sheetJob: 'order',
        showPlaceOrder: true,
        canOrderForBuyer: true,
      }),
    ).toEqual(['order-buyer-toggle', 'place']);
  });

  it('order job: buyer-only own catalog is switch only', () => {
    expect(
      howManyFooterSlots({
        sheetJob: 'order',
        showPlaceOrder: false,
        canOrderForBuyer: true,
      }),
    ).toEqual(['order-buyer-toggle']);
  });

  it('ask job: Ask rates only', () => {
    expect(
      howManyFooterSlots({
        sheetJob: 'ask',
        showPlaceOrder: true,
        canOrderForBuyer: true,
      }),
    ).toEqual(['ask']);
  });
});
