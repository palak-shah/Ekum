import { describe, expect, it } from 'vitest';
import { orderPartyLines } from './orderPartyLines';

const base = {
  buyerName: 'Rishabh Cloth Store',
  sellerName: 'Yash Fabrics',
  buyerCompanyId: 'b1',
  sellerCompanyId: 's1',
};

describe('orderPartyLines', () => {
  it('buyer sees Selling party only', () => {
    const lines = orderPartyLines({ ...base, direction: 'buying', tradeMode: 'bilateral' });
    expect(lines).toEqual([
      expect.objectContaining({ label: 'Selling party', name: 'Yash Fabrics', you: false }),
    ]);
  });

  it('seller sees Purchase party only', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'bilateral' });
    expect(lines).toEqual([
      expect.objectContaining({ label: 'Purchase party', name: 'Rishabh Cloth Store', you: false }),
    ]);
  });

  it('trader desk sees both', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'manage' });
    expect(lines.map((l) => l.label)).toEqual(['Purchase party', 'Selling party']);
  });

  it('tri-visible shows both to buyer', () => {
    const lines = orderPartyLines({
      ...base,
      direction: 'buying',
      tradeMode: 'bilateral',
      triVisible: true,
    });
    expect(lines).toHaveLength(2);
  });
});
