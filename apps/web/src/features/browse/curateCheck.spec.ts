import { describe, expect, it } from 'vitest';
import {
  CURATE_NOT_VISIBLE_REASON,
  curateBlockReason,
  curateBlockedIdSet,
} from './curateCheck';

describe('curateBlockReason', () => {
  it('uses pack-lock copy for seller relist, not-visible otherwise', () => {
    expect(curateBlockReason('RELIST_NOT_ALLOWED')).toBe("Can't put in a pack");
    expect(curateBlockReason('NOT_DISCOVERABLE')).toBe(CURATE_NOT_VISIBLE_REASON);
    expect(curateBlockReason('INVALID_PRODUCTS')).toBe(CURATE_NOT_VISIBLE_REASON);
  });
});

describe('curateBlockedIdSet', () => {
  it('maps product ids to row reasons', () => {
    const map = curateBlockedIdSet([
      { productId: 'a', code: 'NOT_DISCOVERABLE' },
      { productId: 'b', code: 'RELIST_NOT_ALLOWED' },
    ]);
    expect(map.get('a')).toBe(CURATE_NOT_VISIBLE_REASON);
    expect(map.get('b')).toBe("Can't put in a pack");
  });
});
