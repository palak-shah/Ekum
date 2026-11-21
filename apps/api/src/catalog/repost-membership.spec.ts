import { describe, expect, it } from 'vitest';
import {
  MembershipOrigin,
  applyOwnerSetProductsToMembership,
  applySourceSyncToMembership,
  forcePreserveExclusions,
} from '@ekum/domain-types';

describe('applyOwnerSetProductsToMembership', () => {
  it('marks source members synced and extras local', () => {
    const rows = applyOwnerSetProductsToMembership({
      previous: [],
      desiredProductIds: ['d1', 'extra'],
      sourceProductIds: ['d1', 'd2'],
    });
    expect(rows).toEqual([
      expect.objectContaining({
        productId: 'd1',
        membershipOrigin: MembershipOrigin.Synced,
        excluded: false,
      }),
      expect.objectContaining({
        productId: 'extra',
        membershipOrigin: MembershipOrigin.Local,
        excluded: false,
      }),
    ]);
  });

  it('omitting a synced member creates an exclusion tombstone', () => {
    const rows = applyOwnerSetProductsToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
        {
          productId: 'd2',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
      ],
      desiredProductIds: ['d1'],
      sourceProductIds: ['d1', 'd2'],
    });
    expect(rows.find((row) => row.productId === 'd2')).toEqual(
      expect.objectContaining({
        membershipOrigin: MembershipOrigin.Synced,
        excluded: true,
      }),
    );
    expect(rows.filter((row) => !row.excluded).map((row) => row.productId)).toEqual(['d1']);
  });

  it('drops a local extra when omitted (no tombstone)', () => {
    const rows = applyOwnerSetProductsToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
        {
          productId: 'extra',
          membershipOrigin: MembershipOrigin.Local,
          excluded: false,
        },
      ],
      desiredProductIds: ['d1'],
      sourceProductIds: ['d1'],
    });
    expect(rows.map((row) => row.productId)).toEqual(['d1']);
  });

  it('explicit re-add clears exclusion and stamps explicitlyAddedAt', () => {
    const now = new Date('2026-11-20T10:00:00Z');
    const rows = applyOwnerSetProductsToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: true,
        },
      ],
      desiredProductIds: ['d1'],
      sourceProductIds: ['d1'],
      now,
    });
    expect(rows).toEqual([
      expect.objectContaining({
        productId: 'd1',
        excluded: false,
        membershipOrigin: MembershipOrigin.Synced,
        explicitlyAddedAt: now,
      }),
    ]);
  });

  it('remove → reload → sync: active-only desired keeps tombstones (F-01)', () => {
    const previous = [
      {
        productId: 'keep',
        membershipOrigin: MembershipOrigin.Synced,
        excluded: false,
      },
      {
        productId: 'tombstone',
        membershipOrigin: MembershipOrigin.Synced,
        excluded: true,
      },
      {
        productId: 'remove-me',
        membershipOrigin: MembershipOrigin.Synced,
        excluded: false,
      },
    ];
    // Client sends active ids only (activeOwnerMemberIds), then drops remove-me.
    const afterRemove = applyOwnerSetProductsToMembership({
      previous,
      desiredProductIds: ['keep'],
      sourceProductIds: ['keep', 'tombstone', 'remove-me'],
    });
    expect(afterRemove.find((row) => row.productId === 'tombstone')?.excluded).toBe(true);
    expect(afterRemove.find((row) => row.productId === 'remove-me')?.excluded).toBe(true);
    expect(afterRemove.filter((row) => !row.excluded).map((row) => row.productId)).toEqual([
      'keep',
    ]);

    const afterSync = applySourceSyncToMembership({
      previous: afterRemove.map((row) => ({
        productId: row.productId,
        membershipOrigin: row.membershipOrigin,
        excluded: row.excluded,
        explicitlyAddedAt: row.explicitlyAddedAt,
      })),
      sourceProductIds: ['keep', 'tombstone', 'remove-me', 'new-from-source'],
      previouslySyncedProductIds: ['keep', 'tombstone', 'remove-me'],
    });
    expect(afterSync.find((row) => row.productId === 'tombstone')?.excluded).toBe(true);
    expect(afterSync.find((row) => row.productId === 'remove-me')?.excluded).toBe(true);
    expect(afterSync.find((row) => row.productId === 'new-from-source')?.excluded).toBe(false);

    const afterExplicitReAdd = applyOwnerSetProductsToMembership({
      previous: afterSync.map((row) => ({
        productId: row.productId,
        membershipOrigin: row.membershipOrigin,
        excluded: row.excluded,
        explicitlyAddedAt: row.explicitlyAddedAt,
      })),
      desiredProductIds: ['keep', 'tombstone', 'new-from-source'],
      sourceProductIds: ['keep', 'tombstone', 'remove-me', 'new-from-source'],
      now: new Date('2026-11-20T12:00:00Z'),
    });
    expect(afterExplicitReAdd.find((row) => row.productId === 'tombstone')?.excluded).toBe(
      false,
    );
    expect(afterExplicitReAdd.find((row) => row.productId === 'remove-me')?.excluded).toBe(
      true,
    );
  });
});

describe('applySourceSyncToMembership', () => {
  it('adds new source designs and keeps local extras', () => {
    const rows = applySourceSyncToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
        {
          productId: 'extra',
          membershipOrigin: MembershipOrigin.Local,
          excluded: false,
        },
      ],
      sourceProductIds: ['d1', 'd2', 'd3'],
      previouslySyncedProductIds: ['d1'],
    });
    expect(rows.filter((row) => !row.excluded).map((row) => row.productId)).toEqual([
      'd1',
      'd2',
      'd3',
      'extra',
    ]);
  });

  it('never clears an exclusion when the source still has the design', () => {
    const rows = applySourceSyncToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: true,
        },
      ],
      sourceProductIds: ['d1', 'd2'],
      previouslySyncedProductIds: ['d1'],
    });
    expect(rows.find((row) => row.productId === 'd1')?.excluded).toBe(true);
    expect(rows.find((row) => row.productId === 'd2')?.excluded).toBe(false);
  });

  it('drops a previously synced member that left the source (when not excluded)', () => {
    const rows = applySourceSyncToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
        {
          productId: 'gone',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
      ],
      sourceProductIds: ['d1'],
      previouslySyncedProductIds: ['d1', 'gone'],
    });
    expect(rows.map((row) => row.productId)).toEqual(['d1']);
  });

  it('keeps an exclusion tombstone even after the design leaves the source', () => {
    const rows = applySourceSyncToMembership({
      previous: [
        {
          productId: 'gone',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: true,
        },
      ],
      sourceProductIds: ['d1'],
      previouslySyncedProductIds: ['gone'],
    });
    expect(rows.find((row) => row.productId === 'gone')).toEqual(
      expect.objectContaining({ excluded: true }),
    );
  });

  it('exclude → leave source → reintroduce keeps exclusion sticky', () => {
    const excluded = applySourceSyncToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: true,
        },
      ],
      sourceProductIds: [],
      previouslySyncedProductIds: ['d1'],
    });
    expect(excluded.find((row) => row.productId === 'd1')?.excluded).toBe(true);

    const back = applySourceSyncToMembership({
      previous: excluded,
      sourceProductIds: ['d1'],
      previouslySyncedProductIds: ['d1'],
    });
    expect(back.find((row) => row.productId === 'd1')).toEqual(
      expect.objectContaining({ excluded: true, membershipOrigin: MembershipOrigin.Synced }),
    );
  });
});

describe('forcePreserveExclusions (H3 race)', () => {
  it('owner exclusion wins over a stale source-sync plan that would clear it', () => {
    // Sync computed write from a pre-exclusion snapshot (would re-add d1 active).
    const stalePlan = applySourceSyncToMembership({
      previous: [
        {
          productId: 'd1',
          membershipOrigin: MembershipOrigin.Synced,
          excluded: false,
        },
      ],
      sourceProductIds: ['d1', 'd2'],
      previouslySyncedProductIds: ['d1'],
    });
    expect(stalePlan.find((row) => row.productId === 'd1')?.excluded).toBe(false);

    // Locked re-read after owner excluded d1.
    const lockedPrevious = [
      {
        productId: 'd1',
        membershipOrigin: MembershipOrigin.Synced,
        excluded: true,
      },
    ];
    const safe = forcePreserveExclusions(stalePlan, lockedPrevious);
    expect(safe.find((row) => row.productId === 'd1')?.excluded).toBe(true);
    expect(safe.find((row) => row.productId === 'd2')?.excluded).toBe(false);
  });
});
