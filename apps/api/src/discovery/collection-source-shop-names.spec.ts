import { describe, expect, it } from 'vitest';
import { collectionSourceShopNames } from './discovery.serializer';

describe('collectionSourceShopNames', () => {
  it('returns empty when credit is off', () => {
    expect(
      collectionSourceShopNames('ravi', false, [
        { product: { companyId: 'kavita', company: { name: 'Ahmedabad Loom Co' } } },
      ]),
    ).toEqual([]);
  });

  it('lists distinct foreign mill names when credit is on', () => {
    expect(
      collectionSourceShopNames('ravi', true, [
        { product: { companyId: 'kavita', company: { name: 'Ahmedabad Loom Co' } } },
        { product: { companyId: 'ravi', company: { name: 'Surat Silk House' } } },
        { product: { companyId: 'kavita', company: { name: 'Ahmedabad Loom Co' } } },
        { product: { companyId: 'meena', company: { name: 'Jaipur Emporium' } } },
      ]),
    ).toEqual(['Ahmedabad Loom Co', 'Jaipur Emporium']);
  });
});
