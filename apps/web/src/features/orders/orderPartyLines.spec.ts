import { describe, expect, it } from 'vitest';
import { orderPartyLines, partyLineShowsOpenChat } from './orderPartyLines';

const base = {
  buyerName: 'Rishabh Cloth Store',
  sellerName: 'Yash Fabrics',
  buyerCompanyId: 'b1',
  sellerCompanyId: 's1',
};

describe('orderPartyLines', () => {
  it('buyer sees supplier only', () => {
    const lines = orderPartyLines({ ...base, direction: 'buying', tradeMode: 'bilateral' });
    expect(lines).toEqual([
      expect.objectContaining({ label: 'supplier', name: 'Yash Fabrics', you: false }),
    ]);
  });

  it('seller sees buyer only', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'bilateral' });
    expect(lines).toEqual([
      expect.objectContaining({ label: 'buyer', name: 'Rishabh Cloth Store', you: false }),
    ]);
  });

  it('trader/agent desk sees both supplier then buyer', () => {
    const lines = orderPartyLines({ ...base, direction: 'selling', tradeMode: 'manage' });
    expect(lines.map((l) => l.label)).toEqual(['supplier', 'buyer']);
    expect(lines[0]).toEqual(
      expect.objectContaining({ label: 'supplier', name: 'Yash Fabrics', you: true }),
    );
    expect(lines[1]).toEqual(
      expect.objectContaining({ label: 'buyer', name: 'Rishabh Cloth Store', you: false }),
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
    expect(lines.map((l) => l.label)).toEqual(['supplier', 'buyer']);
  });

  it('puts Open chat on buyer for trader/agent desk', () => {
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
