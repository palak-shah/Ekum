import { describe, expect, it } from 'vitest';
import { misroutedPackRepairSkip } from './repair-misrouted-pack-order';

const open = {
  buyerName: 'Buyer 1',
  sellerName: 'Supplier 1',
  packOwnerName: 'Trader 1',
  tradeMode: 'bilateral',
  status: 'requested',
  touched: false,
  sellerIsMill: true,
  allLinesInPack: true,
  direct: false,
  hasUpstream: false,
};

describe('misroutedPackRepairSkip', () => {
  it('repairs the open Buyer 1 order when the lines sit in Trader 1 packs', () => {
    expect(misroutedPackRepairSkip(open)).toBeNull();
  });

  it('leaves the older test trio and a Direct Link alone', () => {
    expect(misroutedPackRepairSkip({ ...open, buyerName: 'Meena' })).toBe('other-shops');
    expect(misroutedPackRepairSkip({ ...open, sellerName: 'Kavita' })).toBe('other-shops');
    expect(misroutedPackRepairSkip({ ...open, direct: true })).toBe('direct-link');
    expect(misroutedPackRepairSkip({ ...open, touched: true })).toBe('already-moved');
  });
});
