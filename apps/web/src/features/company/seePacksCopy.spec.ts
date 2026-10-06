import { describe, expect, it } from 'vitest';
import { seePacksShopLabel, shopWriteLabel } from './seePacksCopy';

describe('seePacksShopLabel', () => {
  it('asks, then Requested, then Has access', () => {
    expect(seePacksShopLabel({ pending: false, allowed: false })).toBe(
      'Request catalog access',
    );
    expect(seePacksShopLabel({ pending: true, allowed: false })).toBe('Requested');
    expect(seePacksShopLabel({ pending: false, allowed: true })).toBe('Has access');
  });
});

describe('shopWriteLabel', () => {
  it('uses Message then Chat', () => {
    expect(shopWriteLabel(false)).toBe('Message');
    expect(shopWriteLabel(true)).toBe('Chat');
  });
});
