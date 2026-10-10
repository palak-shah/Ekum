import { describe, expect, it } from 'vitest';
import {
  amendOrderSchema,
  createOrderSchema,
  createOrdersBatchSchema,
  createOrdersFromPackSchema,
  OrderKind,
} from '@ekum/domain-types';

describe('order transporter DTO', () => {
  it('accepts optional transporter on create', () => {
    const result = createOrderSchema.safeParse({
      sellerCompanyId: 's1',
      kind: OrderKind.Standard,
      transporter: 'VRL',
      items: [{ productId: 'p1', quantity: 10, images: [] }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.transporter).toBe('VRL');
  });

  it('accepts transporter on batch, from-pack, and amend', () => {
    expect(
      createOrdersBatchSchema.safeParse({
        transporter: 'TCI',
        items: [{ productId: 'p1', quantity: 5, images: [] }],
      }).success,
    ).toBe(true);
    expect(
      createOrdersFromPackSchema.safeParse({
        collectionId: 'c1',
        transporter: 'TCI',
        items: [{ productId: 'p1', quantity: 5, images: [] }],
      }).success,
    ).toBe(true);
    expect(
      amendOrderSchema.safeParse({
        transporter: 'TCI',
        items: [{ productId: 'p1', quantity: 5, images: [] }],
      }).success,
    ).toBe(true);
    expect(
      amendOrderSchema.safeParse({
        transporter: null,
        items: [{ productId: 'p1', quantity: 5, images: [] }],
      }).success,
    ).toBe(true);
  });
});
