import { describe, expect, it } from 'vitest';
import { groupForBuyerLines } from './for-buyer-groups';

describe('groupForBuyerLines', () => {
  it('keeps own catalog together and buckets mill designs', () => {
    const grouped = groupForBuyerLines(
      [
        { productId: 'own-1', quantity: 10 },
        { productId: 'mill-a', quantity: 20 },
        { productId: 'mill-b', quantity: 5 },
      ],
      [
        { id: 'own-1', companyId: 'trader' },
        { id: 'mill-a', companyId: 'mill' },
        { id: 'mill-b', companyId: 'mill' },
      ],
      'trader',
    );
    expect(grouped.own).toEqual([{ productId: 'own-1', quantity: 10 }]);
    expect(grouped.byMill.get('mill')).toEqual([
      { productId: 'mill-a', quantity: 20 },
      { productId: 'mill-b', quantity: 5 },
    ]);
  });

  it('keeps mill own designs as mill supply on a visitor pack', () => {
    const grouped = groupForBuyerLines(
      [{ productId: 'own-1', quantity: 5 }],
      [{ id: 'own-1', companyId: 'mill' }],
      'mill',
    );
    expect(grouped.own).toEqual([{ productId: 'own-1', quantity: 5 }]);
    expect(grouped.byMill.size).toBe(0);
  });
});
