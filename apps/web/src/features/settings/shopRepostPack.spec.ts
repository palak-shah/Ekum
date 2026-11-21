import { describe, expect, it } from 'vitest';
import {
  SHOP_REPOST_PACK_OFF_CONFIRM_BODY,
  isShopRepostPackAllowed,
} from './shopRepostPack';

describe('isShopRepostPackAllowed', () => {
  it('defaults on when missing', () => {
    expect(isShopRepostPackAllowed(undefined)).toBe(true);
    expect(isShopRepostPackAllowed({})).toBe(true);
    expect(isShopRepostPackAllowed({ shopRepostPackAllowed: true })).toBe(true);
  });

  it('is off only when explicitly false', () => {
    expect(isShopRepostPackAllowed({ shopRepostPackAllowed: false })).toBe(false);
  });

  it('confirm copy does not claim auto-restore on ON', () => {
    expect(SHOP_REPOST_PACK_OFF_CONFIRM_BODY).toMatch(/does not restore/i);
    expect(SHOP_REPOST_PACK_OFF_CONFIRM_BODY).toMatch(/look-only/i);
  });
});
