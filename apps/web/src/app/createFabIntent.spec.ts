import { describe, expect, it } from 'vitest';
import { CREATE_FAB_EXPLAIN, createFabHref, createFabIntent } from './createFabIntent';

describe('createFabIntent', () => {
  it('opens New collection when they sell and can upload', () => {
    expect(
      createFabIntent({ selling: true, buying: true, canUploads: true, canOrders: true }),
    ).toBe('collection');
    expect(createFabHref('collection')).toBe('/catalog/collections/new');
  });

  it('opens Orders when they only buy', () => {
    expect(
      createFabIntent({ selling: false, buying: true, canUploads: false, canOrders: true }),
    ).toBe('orders');
    expect(createFabHref('orders')).toBe('/orders');
  });

  it('explains when they sell but cannot upload — even if they also buy', () => {
    expect(
      createFabIntent({ selling: true, buying: true, canUploads: false, canOrders: true }),
    ).toBe('explain');
    expect(createFabHref('explain')).toBeNull();
    expect(CREATE_FAB_EXPLAIN).toMatch(/Ask the owner on Team/);
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
