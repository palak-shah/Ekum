import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearBrowseShortlist,
  readBrowseShortlist,
  removeBrowseShortlistIds,
  toggleBrowseShortlistEntry,
  writeBrowseShortlist,
} from './browseShortlist';

const a = {
  productId: 'p1',
  name: 'Grey',
  thumbUrl: null,
  companyId: 'c1',
  companyName: 'Ahmedabad Loom Co',
};

describe('browseShortlist', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearBrowseShortlist();
  });

  it('persists toggles across read', () => {
    toggleBrowseShortlistEntry(a);
    expect(readBrowseShortlist()).toEqual([a]);
    toggleBrowseShortlistEntry(a);
    expect(readBrowseShortlist()).toEqual([]);
  });

  it('keeps other ids when removing a subset', () => {
    writeBrowseShortlist([
      a,
      { ...a, productId: 'p2', companyId: 'c2', companyName: 'Jaipur Emporium' },
    ]);
    removeBrowseShortlistIds(['p1']);
    expect(readBrowseShortlist().map((e) => e.productId)).toEqual(['p2']);
  });
});
