import { describe, expect, it } from 'vitest';
import {
  kindToneClasses,
  kindToneForChatKind,
  kindToneForMessageType,
} from './kindTone';

describe('kindTone', () => {
  it('maps order family to order teal', () => {
    expect(kindToneForChatKind('order')).toBe('order');
    expect(kindToneForChatKind('quote')).toBe('order');
    expect(kindToneForMessageType('order_card')).toBe('order');
    expect(kindToneForMessageType('rate')).toBe('order');
    expect(kindToneForMessageType('payment_card')).toBe('order');
    expect(kindToneClasses('order').rail).toBe('border-l-kind-order');
  });

  it('maps collection to steel', () => {
    expect(kindToneForChatKind('collection')).toBe('collection');
    expect(kindToneForMessageType('collection_card')).toBe('collection');
    expect(kindToneForMessageType('collections')).toBe('collection');
    expect(kindToneClasses('collection').badge).toContain('kind-collection');
  });

  it('maps design/product to clay', () => {
    expect(kindToneForChatKind('product')).toBe('design');
    expect(kindToneForMessageType('product_card')).toBe('design');
    expect(kindToneForMessageType('designs')).toBe('design');
    expect(kindToneClasses('design').ink).toBe('text-kind-design');
  });

  it('returns null for non-kind surfaces', () => {
    expect(kindToneForChatKind('text')).toBeNull();
    expect(kindToneForChatKind('photo')).toBeNull();
    expect(kindToneForMessageType('photo')).toBeNull();
  });
});
