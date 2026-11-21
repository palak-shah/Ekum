import { describe, expect, it } from 'vitest';
import {
  activeOwnerMemberIds,
  canDeleteSelected,
  deleteNeedsMultiPackConfirm,
  libraryDesignsForPicker,
  membershipAfterRemove,
  membershipForReplaceOrAppend,
  membershipWithNewFirst,
  otherPackCountFromNames,
  ownedSelectedIds,
  packRemoveNextMembership,
  replaceBootClearsMembership,
} from './ownerPackManage';

describe('otherPackCountFromNames', () => {
  it('ignores the current pack name case-insensitively', () => {
    expect(otherPackCountFromNames(['Wedding', 'Festive'], 'wedding')).toBe(1);
    expect(otherPackCountFromNames(['Wedding'], 'Wedding')).toBe(0);
  });
});

describe('deleteNeedsMultiPackConfirm', () => {
  it('is true when an owned design has other packs', () => {
    expect(
      deleteNeedsMultiPackConfirm(
        ['a', 'b'],
        [
          { productId: 'a', otherPackCount: 0 },
          { productId: 'b', otherPackCount: 2 },
        ],
        new Set(['a', 'b']),
      ),
    ).toBe(true);
  });

  it('is false when only foreign or sole-pack designs are selected', () => {
    expect(
      deleteNeedsMultiPackConfirm(
        ['foreign', 'solo'],
        [
          { productId: 'foreign', otherPackCount: 3 },
          { productId: 'solo', otherPackCount: 0 },
        ],
        new Set(['solo']),
      ),
    ).toBe(false);
  });
});

describe('ownedSelectedIds / canDeleteSelected', () => {
  const companies = new Map([
    ['own', 'co-1'],
    ['foreign', 'co-2'],
  ]);

  it('allows Delete for mill designs you curated into this pack', () => {
    expect(ownedSelectedIds(['own', 'foreign'], companies, 'co-1')).toEqual(['own']);
    expect(canDeleteSelected(['foreign'])).toBe(true);
    expect(canDeleteSelected(['own', 'foreign'])).toBe(true);
    expect(canDeleteSelected([])).toBe(false);
  });
});

describe('membershipAfterRemove', () => {
  it('drops selected ids and keeps order of the rest', () => {
    expect(membershipAfterRemove(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });
});

describe('packRemoveNextMembership (album ≡ editor)', () => {
  it('album and editor must use full owner ids — not local selected alone', () => {
    const fullOwner = ['a', 'b', 'c', 'draft-hidden'];
    const removeIds = ['b'];
    const albumNext = packRemoveNextMembership({
      fullOwnerMemberIds: fullOwner,
      removeIds,
    });
    const editorNext = packRemoveNextMembership({
      fullOwnerMemberIds: fullOwner,
      removeIds,
    });
    expect(albumNext).toEqual(editorNext);
    expect(albumNext).toEqual(['a', 'c', 'draft-hidden']);
    // Wrong path: only “visible selected” as currentIds would drop draft-hidden.
    expect(membershipAfterRemove(['a', 'b', 'c'], removeIds)).not.toEqual(albumNext);
  });
});

describe('activeOwnerMemberIds + remove (sticky exclude)', () => {
  it('omits excluded tombstones so Remove cannot clear sticky exclude', () => {
    const afterReload = [
      { id: 'keep', excluded: false },
      { id: 'tombstone', excluded: true },
      { id: 'remove-me', excluded: false },
    ];
    const active = activeOwnerMemberIds(afterReload);
    expect(active).toEqual(['keep', 'remove-me']);
    const next = packRemoveNextMembership({
      fullOwnerMemberIds: active,
      removeIds: ['remove-me'],
    });
    expect(next).toEqual(['keep']);
    // Wrong path: mapping all product ids would re-list the tombstone and clear exclude.
    expect(
      packRemoveNextMembership({
        fullOwnerMemberIds: afterReload.map((row) => row.id),
        removeIds: ['remove-me'],
      }),
    ).toEqual(['keep', 'tombstone']);
  });

  it('explicit re-add is the only path that puts an excluded id back in desired', () => {
    const active = activeOwnerMemberIds([
      { id: 'a' },
      { id: 'excluded-x', excluded: true },
    ]);
    expect(active).toEqual(['a']);
    expect([...active, 'excluded-x']).toEqual(['a', 'excluded-x']);
  });
});

describe('libraryDesignsForPicker', () => {
  const designs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('hides album members in add mode', () => {
    expect(libraryDesignsForPicker(designs, new Set(['a', 'c']), 'add')).toEqual([{ id: 'b' }]);
  });

  it('keeps the full library in replace mode', () => {
    expect(libraryDesignsForPicker(designs, new Set(['a', 'c']), 'replace')).toEqual(designs);
  });
});

describe('membershipWithNewFirst', () => {
  it('puts newly added designs on top', () => {
    expect(membershipWithNewFirst(['old-1', 'old-2'], ['new-a', 'new-b'])).toEqual([
      'new-a',
      'new-b',
      'old-1',
      'old-2',
    ]);
  });

  it('moves a re-added design to the top', () => {
    expect(membershipWithNewFirst(['a', 'b', 'c'], ['c'])).toEqual(['c', 'a', 'b']);
  });
});

describe('replaceBootClearsMembership', () => {
  it('never clears on Replace boot — wait for a non-empty save', () => {
    expect(replaceBootClearsMembership()).toBe(false);
  });
});

describe('membershipForReplaceOrAppend', () => {
  it('append keeps existing and puts new first', () => {
    expect(membershipForReplaceOrAppend(['a', 'b'], ['c'], false)).toEqual(['c', 'a', 'b']);
  });

  it('replace with a non-empty set drops prior members', () => {
    expect(membershipForReplaceOrAppend(['a', 'b'], ['c', 'd'], true)).toEqual(['c', 'd']);
  });

  it('replace with an empty pick does not PUT — returns null', () => {
    expect(membershipForReplaceOrAppend(['a', 'b'], [], true)).toBeNull();
  });

  it('replace dedupes picked ids in pick order', () => {
    expect(membershipForReplaceOrAppend(['old'], ['x', 'x', 'y'], true)).toEqual(['x', 'y']);
  });
});
