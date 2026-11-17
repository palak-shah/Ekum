import { describe, expect, it } from 'vitest';
import {
  REQUEST_SHARE_LABEL,
  REQUEST_TO_ACCESS_LABEL,
  SEE_PACKS_ASK_LINE,
  UNBLOCK_ACCESS_CLEARED_TOAST,
  YOUR_BLOCK_REMOVED_TOAST,
  seePacksShopLabel,
  shopWriteLabel,
} from './seePacksCopy';

describe('seePacksShopLabel', () => {
  it('Follow, then Requested, then Following', () => {
    expect(seePacksShopLabel({ pending: false, allowed: false })).toBe('Follow');
    expect(seePacksShopLabel({ pending: true, allowed: false })).toBe('Requested');
    expect(seePacksShopLabel({ pending: false, allowed: true })).toBe('Following');
  });
});

describe('shopWriteLabel', () => {
  it('uses Message then Chat', () => {
    expect(shopWriteLabel(false)).toBe('Message');
    expect(shopWriteLabel(true)).toBe('Chat');
  });
});

describe('ask labels', () => {
  it('keeps pack view ask and repost ask distinct from Follow', () => {
    expect(REQUEST_TO_ACCESS_LABEL).toBe('Request to access');
    expect(REQUEST_SHARE_LABEL).toBe('Ask to repost');
  });
});

describe('SEE_PACKS_ASK_LINE', () => {
  it('frames the ask as Follow plus see collections', () => {
    expect(SEE_PACKS_ASK_LINE).toBe('Wants to follow you and see your collections.');
  });
});

describe('unblock toasts', () => {
  it('distinguishes full restore vs own-edge-only clear', () => {
    expect(UNBLOCK_ACCESS_CLEARED_TOAST).toMatch(/Collection access was cleared/);
    expect(YOUR_BLOCK_REMOVED_TOAST).toBe('Your block removed.');
  });
});
