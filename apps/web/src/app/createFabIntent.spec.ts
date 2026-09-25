import { describe, expect, it } from 'vitest';
import { createFabIntent } from './createFabIntent';

describe('createFabIntent', () => {
  it('opens New when they sell and can upload', () => {
    expect(
      createFabIntent({ selling: true, buying: true, canUploads: true, canOrders: true }),
    ).toBe('new-sheet');
  });

  it('offers Orders in the sheet when they only buy', () => {
    expect(
      createFabIntent({ selling: false, buying: true, canUploads: false, canOrders: true }),
    ).toBe('orders');
  });

  it('explains instead of a dead tap when this login cannot add or order', () => {
    expect(
      createFabIntent({ selling: true, buying: false, canUploads: false, canOrders: false }),
    ).toBe('explain');
    expect(
      createFabIntent({ selling: false, buying: false, canUploads: true, canOrders: true }),
    ).toBe('explain');
  });
});
