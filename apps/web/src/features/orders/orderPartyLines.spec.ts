import { describe, expect, it } from 'vitest';
import { orderPartyLines, partyLineShowsOpenChat } from './orderPartyLines';

const base = {
  buyerName: 'Rishabh Cloth Store',
  sellerName: 'Yash Fabrics',
  buyerCompanyId: 'b1',
  sellerCompanyId: 's1',
};

describe('orderPartyLines', () => {
  it('buyer sees Purchase party only (supplier)', () => {
    const lines = orderPartyLines({ ...base, direction: 'buying', tradeMode: 'bilateral' });
    expect(lines).toEqual([
      expect.objectContaining({ label: 'Purchase party', name: 'Yash Fabrics', you: false }),
    ]);
  });

  it('seller sees Sales party only (customer)', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'bilateral' });
    expect(lines).toEqual([
      expect.objectContaining({ label: 'Sales party', name: 'Rishabh Cloth Store', you: false }),
    ]);
  });

  it('trader desk sees both Purchase then Sales', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'manage' });
    expect(lines.map((l) => l.label)).toEqual(['Purchase party', 'Sales party']);
    expect(lines[0]).toEqual(
      expect.objectContaining({ label: 'Purchase party', name: 'Yash Fabrics', you: true }),
    );
    expect(lines[1]).toEqual(
      expect.objectContaining({ label: 'Sales party', name: 'Rishabh Cloth Store', you: false }),
    );
  });

  it('tri-visible shows both to buyer', () => {
    const lines = orderPartyLines({
      ...base,
      direction: 'buying',
      tradeMode: 'bilateral',
      triVisible: true,
    });
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.label)).toEqual(['Purchase party', 'Sales party']);
  });

  it('puts Open chat on Sales party for trader desk', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'manage' });
    const ctx = { direction: 'selling', tradeMode: 'manage' } as const;
    expect(partyLineShowsOpenChat(lines[0]!, ctx)).toBe(false);
    expect(partyLineShowsOpenChat(lines[1]!, ctx)).toBe(true);
  });

  it('puts Open chat on the single bilateral line', () => {
    const sales = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'bilateral' });
    expect(partyLineShowsOpenChat(sales[0]!, { direction: 'selling', tradeMode: 'bilateral' })).toBe(
      true,
    );
  });
});
