import { describe, expect, it } from 'vitest';
import {
  CURATE_ASK_RELIST,
  CURATE_NOT_VISIBLE_REASON,
  CURATE_PACK_LOCK_REASON,
  CURATE_PACK_ONLY_SUMMARY,
  REPOST_NO_PERMISSION,
  canExploreRepost,
  cartMayAskRelist,
  curateAskAllLabel,
  curateAskKind,
  curateBlockReason,
  curateBlockedIdSet,
  curateSaveDraftLabel,
  curateSkipSummary,
  curateWhyHintLines,
  exploreRepostEligibleCount,
  groupRelistAskBatches,
  isCurateCeilingError,
  isPackOnlyUnavailable,
  mayAskToPutInPack,
  partitionCurateByCheck,
  skippedDesignsLabel,
  unavailableDesignsSummary,
  zeroEligibleSharedReason,
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

describe('curateWhyHintLines', () => {
  it('names skip why in trader words — pack category does not unlock', () => {
    expect(curateWhyHintLines(['NOT_DISCOVERABLE'])).toEqual([
      CURATE_PACK_ONLY_SUMMARY,
    ]);
    expect(curateWhyHintLines(['RELIST_NOT_ALLOWED'])).toEqual([
      'They don’t allow putting these designs in a collection.',
    ]);
    expect(curateWhyHintLines(['FOLLOW_LOOK_ONLY'])).toEqual([
      'They’ve only allowed looking — not putting designs in a collection.',
    ]);
    expect(curateWhyHintLines(['CURATED_AUDIENCE_TOO_WIDE'])).toEqual([
      'Your Who is wider than a sourced design allows.',
    ]);
  });

  it('collapses duplicate skip codes to one line', () => {
    expect(
      curateWhyHintLines(['NOT_DISCOVERABLE', 'NOT_DISCOVERABLE', 'INVALID_PRODUCTS']),
    ).toHaveLength(1);
    expect(curateWhyHintLines(['RELIST_NOT_ALLOWED', 'NOT_DISCOVERABLE'])).toEqual([
      'They don’t allow putting these designs in a collection.',
      CURATE_PACK_ONLY_SUMMARY,
    ]);
  });

  it('adds a publish exception without duplicating skip copy', () => {
    expect(
      curateWhyHintLines(['NOT_DISCOVERABLE'], 'Pick which category this collection is for.'),
    ).toEqual([
      CURATE_PACK_ONLY_SUMMARY,
      'Pick which category this collection is for.',
    ]);
    expect(curateWhyHintLines([], 'Pick which category this collection is for.')).toEqual([
      'Pick which category this collection is for.',
    ]);
    expect(curateWhyHintLines([])).toEqual([]);
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

describe('canExploreRepost', () => {
  it('is on only when trading, not own, not done, and at least one eligible design', () => {
    const ok = { isOwn: false, viewerReposted: false, trading: true, eligibleCount: 2 };
    expect(canExploreRepost(ok)).toBe(true);
    expect(canExploreRepost({ ...ok, eligibleCount: 0 })).toBe(false);
    expect(canExploreRepost({ ...ok, isOwn: true })).toBe(false);
    expect(canExploreRepost({ ...ok, viewerReposted: true })).toBe(false);
    expect(canExploreRepost({ ...ok, trading: false })).toBe(false);
  });
});

describe('exploreRepostEligibleCount', () => {
  it('uses the stamp, else falls back to the pack lock', () => {
    expect(exploreRepostEligibleCount({ repostEligibleCount: 0, allowForward: true })).toBe(0);
    expect(exploreRepostEligibleCount({ allowForward: false })).toBe(0);
    expect(exploreRepostEligibleCount({ allowForward: true })).toBe(1);
  });
});

describe('unavailable copy', () => {
  it('does not repeat pack-only reasons and never Asks for not-listed', () => {
    expect(skippedDesignsLabel(3)).toBe('Skipped designs (3)');
    expect(unavailableDesignsSummary(8)).toBe('8 designs unavailable');
    expect(unavailableDesignsSummary(1)).toBe('1 design unavailable');
    expect(isPackOnlyUnavailable(['NOT_DISCOVERABLE', 'INVALID_PRODUCTS'])).toBe(true);
    expect(zeroEligibleSharedReason(['NOT_DISCOVERABLE'])).toBe(CURATE_PACK_ONLY_SUMMARY);
    expect(cartMayAskRelist(['NOT_DISCOVERABLE'])).toBe(false);
    expect(cartMayAskRelist(['RELIST_NOT_ALLOWED', 'NOT_DISCOVERABLE'])).toBe(true);
    expect(REPOST_NO_PERMISSION).toBe("You don't have permission to repost these designs.");
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
