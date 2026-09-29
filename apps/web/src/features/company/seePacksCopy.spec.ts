import { describe, expect, it } from 'vitest';
import { seePacksShopLabel, shopWriteLabel } from './seePacksCopy';

describe('seePacksShopLabel', () => {
  it('asks, then Asked to see packs, then Seeing packs', () => {
    expect(seePacksShopLabel({ pending: false, allowed: false })).toBe('See new packs');
    expect(seePacksShopLabel({ pending: true, allowed: false })).toBe('Asked to see packs');
    expect(seePacksShopLabel({ pending: false, allowed: true })).toBe('Seeing packs');
  });
});

describe('shopWriteLabel', () => {
  it('uses Message then Chat', () => {
    expect(shopWriteLabel(false)).toBe('Message');
    expect(shopWriteLabel(true)).toBe('Chat');
  });
});
