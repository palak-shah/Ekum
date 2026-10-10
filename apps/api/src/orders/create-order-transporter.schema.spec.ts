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

describe('order create note attach DTO', () => {
  const images = ['https://cdn.example/1.jpg', 'https://cdn.example/2.jpg'];

  it('accepts note + voice + noteImageUrls on create', () => {
    const result = createOrderSchema.safeParse({
      sellerCompanyId: 's1',
      kind: OrderKind.Standard,
      note: 'Rush',
      noteVoiceMediaId: 'm1',
      noteVoiceDurationMs: 900,
      noteImageUrls: images,
      items: [{ productId: 'p1', quantity: 10, images: [] }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.noteImageUrls).toEqual(images);
      expect(result.data.noteVoiceMediaId).toBe('m1');
    }
  });

  it('accepts note attach on batch and from-pack', () => {
    expect(
      createOrdersBatchSchema.safeParse({
        note: 'Common',
        noteVoiceMediaId: 'm1',
        noteVoiceDurationMs: 800,
        noteImageUrls: images,
        items: [{ productId: 'p1', quantity: 5, images: [] }],
      }).success,
    ).toBe(true);
    expect(
      createOrdersFromPackSchema.safeParse({
        collectionId: 'c1',
        note: 'Common',
        noteVoiceMediaId: 'm1',
        noteVoiceDurationMs: 800,
        noteImageUrls: images,
        items: [{ productId: 'p1', quantity: 5, images: [] }],
      }).success,
    ).toBe(true);
  });

  it('rejects more than 9 note images', () => {
    const tooMany = Array.from({ length: 10 }, (_, i) => `https://cdn.example/${i}.jpg`);
    expect(
      createOrderSchema.safeParse({
        sellerCompanyId: 's1',
        kind: OrderKind.Standard,
        noteImageUrls: tooMany,
        items: [{ productId: 'p1', quantity: 1, images: [] }],
      }).success,
    ).toBe(false);
  });
});
