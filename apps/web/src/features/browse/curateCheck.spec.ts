import { describe, expect, it } from 'vitest';
import {
  CURATE_ASK_RELIST,
  CURATE_NOT_VISIBLE_REASON,
  CURATE_PACK_LOCK_REASON,
  curateAskAllLabel,
  curateAskKind,
  curateBlockReason,
  curateBlockedIdSet,
  curateSaveDraftLabel,
  curateSkipSummary,
  groupRelistAskBatches,
  isCurateCeilingError,
  mayAskToPutInPack,
  partitionCurateByCheck,
} from './curateCheck';

describe('curateBlockReason', () => {
  it('uses pack-lock copy for seller relist, not-visible otherwise', () => {
    expect(curateBlockReason('RELIST_NOT_ALLOWED')).toBe(CURATE_PACK_LOCK_REASON);
    expect(curateBlockReason('FOLLOW_LOOK_ONLY')).toBe(CURATE_PACK_LOCK_REASON);
    expect(curateBlockReason('NOT_DISCOVERABLE')).toBe(CURATE_NOT_VISIBLE_REASON);
    expect(curateBlockReason('INVALID_PRODUCTS')).toBe(CURATE_NOT_VISIBLE_REASON);
  });
});

describe('curateAskKind', () => {
  it('only maps product pack-lock to relist Ask', () => {
    expect(curateAskKind('RELIST_NOT_ALLOWED')).toBe('relist');
    expect(curateAskKind('FOLLOW_LOOK_ONLY')).toBeNull();
    expect(curateAskKind('NOT_DISCOVERABLE')).toBeNull();
    expect(curateAskKind('INVALID_PRODUCTS')).toBeNull();
  });
});

describe('mayAskToPutInPack', () => {
  it('requires trading, pack lock, and not look-only or own shop', () => {
    const ok = {
      trading: true,
      ownCompany: false,
      waiting: false,
      packLocked: true,
      lookOnly: false,
    };
    expect(mayAskToPutInPack(ok)).toBe(true);
    expect(mayAskToPutInPack({ ...ok, trading: false })).toBe(false);
    expect(mayAskToPutInPack({ ...ok, ownCompany: true })).toBe(false);
    expect(mayAskToPutInPack({ ...ok, lookOnly: true })).toBe(false);
    expect(mayAskToPutInPack({ ...ok, packLocked: false })).toBe(false);
    expect(mayAskToPutInPack({ ...ok, waiting: true })).toBe(false);
  });
});

describe('curateSkipSummary', () => {
  it('explains skip without trapping when some can save', () => {
    expect(curateSkipSummary(18, 2)).toBe('2 left out — save the rest.');
    expect(curateSkipSummary(0, 2)).toBe('These designs can’t go in a collection yet.');
    expect(curateSkipSummary(5, 0)).toBeNull();
  });
});

describe('curateSaveDraftLabel', () => {
  it('names how many go in when some are skipped', () => {
    expect(curateSaveDraftLabel(18, 2)).toBe('Save 18 in this collection');
    expect(curateSaveDraftLabel(0, 2)).toBe('Save draft');
  });
});

describe('curateAskAllLabel', () => {
  it('names the bunch', () => {
    expect(curateAskAllLabel(1)).toBe(CURATE_ASK_RELIST);
    expect(curateAskAllLabel(3)).toBe('Ask for all 3');
  });
});

describe('partitionCurateByCheck', () => {
  it('keeps blocked rows with codes so the sheet can Ask', () => {
    const { allowed, blocked } = partitionCurateByCheck(
      [{ productId: 'a' }, { productId: 'b' }, { productId: 'c' }],
      {
        allowedProductIds: ['a'],
        blocked: [
          { productId: 'b', code: 'RELIST_NOT_ALLOWED' },
          { productId: 'c', code: 'NOT_DISCOVERABLE' },
        ],
      },
    );
    expect(allowed.map((row) => row.productId)).toEqual(['a']);
    expect(blocked.map((row) => row.code)).toEqual(['RELIST_NOT_ALLOWED', 'NOT_DISCOVERABLE']);
  });
});

describe('groupRelistAskBatches', () => {
  it('batches by source pack for desk-chain Ask', () => {
    expect(
      groupRelistAskBatches([
        { productId: 'a', sourceCollectionId: 'p1' },
        { productId: 'b', sourceCollectionId: 'p1' },
        { productId: 'c' },
      ]),
    ).toEqual([
      { productIds: ['a', 'b'], sourceCollectionId: 'p1' },
      { productIds: ['c'] },
    ]);
  });
});

describe('isCurateCeilingError', () => {
  it('treats API dumps as skip, not a trap', () => {
    expect(isCurateCeilingError({ code: 'NOT_DISCOVERABLE' })).toBe(true);
    expect(
      isCurateCeilingError({ message: 'One or more products are not visible to you.' }),
    ).toBe(true);
    expect(isCurateCeilingError({ message: 'Network down' })).toBe(false);
  });
});

describe('curateBlockedIdSet', () => {
  it('maps product ids to row reasons', () => {
    const map = curateBlockedIdSet([
      { productId: 'a', code: 'NOT_DISCOVERABLE' },
      { productId: 'b', code: 'RELIST_NOT_ALLOWED' },
    ]);
    expect(map.get('a')).toBe(CURATE_NOT_VISIBLE_REASON);
    expect(map.get('b')).toBe(CURATE_PACK_LOCK_REASON);
  });
});
