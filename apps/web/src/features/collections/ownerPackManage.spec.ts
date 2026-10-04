import { describe, expect, it } from 'vitest';
import {
  canDeleteSelected,
  deleteNeedsMultiPackConfirm,
  membershipAfterRemove,
  otherPackCountFromNames,
  ownedSelectedIds,
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

  it('filters to own-company designs', () => {
    expect(ownedSelectedIds(['own', 'foreign'], companies, 'co-1')).toEqual(['own']);
    expect(canDeleteSelected(['foreign'], companies, 'co-1')).toBe(false);
    expect(canDeleteSelected(['own', 'foreign'], companies, 'co-1')).toBe(true);
  });
});

describe('membershipAfterRemove', () => {
  it('drops selected ids and keeps order of the rest', () => {
    expect(membershipAfterRemove(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });
});
