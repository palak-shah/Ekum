import {
  collectionSourceShopNames,
  revealedCreditCompanyId,
  sourceHopsFromRows,
  visitorDesignCreditCompanyName,
} from './source-shop-credit';

describe('revealedCreditCompanyId', () => {
  it('returns mill when no hops or every hop revealed', () => {
    expect(revealedCreditCompanyId('s1', [])).toBe('s1');
    expect(
      revealedCreditCompanyId('s1', [
        { companyId: 't1', companyName: 'Trader 1', showSourceShops: true },
      ]),
    ).toBe('s1');
  });

  it('stops at the first hop that hid suppliers', () => {
    expect(
      revealedCreditCompanyId('s1', [
        { companyId: 't1', companyName: 'Trader 1', showSourceShops: false },
      ]),
    ).toBe('t1');
    expect(
      revealedCreditCompanyId('s1', [
        { companyId: 't1', companyName: 'Trader 1', showSourceShops: true },
        { companyId: 'mid', companyName: 'Mid', showSourceShops: false },
      ]),
    ).toBe('mid');
  });
});

describe('collectionSourceShopNames', () => {
  const millProduct = {
    product: { companyId: 's1', company: { name: 'Supplier 1' } },
  };

  it('returns empty when Show supplier is off', () => {
    expect(collectionSourceShopNames('buyer', false, [millProduct])).toEqual([]);
  });

  it('credits mill when show on and no hiding hop', () => {
    expect(collectionSourceShopNames('buyer', true, [millProduct])).toEqual([
      'Supplier 1',
    ]);
  });

  it('credits Trader not S1 when upstream hop hid suppliers', () => {
    expect(
      collectionSourceShopNames('buyer', true, [millProduct], [
        { companyId: 't1', companyName: 'Trader 1', showSourceShops: false },
      ]),
    ).toEqual(['Trader 1']);
  });

  it('does not fall back to mill when source id is declared but hops unloadable', () => {
    expect(
      collectionSourceShopNames('buyer', true, [millProduct], [], {
        declaredSourceCollectionId: 't1-pack',
      }),
    ).toEqual([]);
  });

  it('still credits mill when show on and no lineage was declared', () => {
    expect(
      collectionSourceShopNames('buyer', true, [millProduct], [], {
        declaredSourceCollectionId: null,
      }),
    ).toEqual(['Supplier 1']);
  });
});

describe('sourceHopsFromRows', () => {
  it('walks immediate then outer source packs', () => {
    const byId = new Map([
      [
        't1-pack',
        {
          companyId: 't1',
          companyName: 'Trader 1',
          showSourceShops: false,
          repostSourceCollectionId: null,
        },
      ],
    ]);
    expect(sourceHopsFromRows('t1-pack', byId)).toEqual([
      { companyId: 't1', companyName: 'Trader 1', showSourceShops: false },
    ]);
  });
});

describe('visitorDesignCreditCompanyName', () => {
  it('owner always sees mill name', () => {
    expect(
      visitorDesignCreditCompanyName({
        isOwner: true,
        showSourceShops: false,
        packCompanyId: 't1',
        packCompanyName: 'Trader 1',
        productCompanyId: 's1',
        productCompanyName: 'Supplier 1',
        sourceHops: [],
      }),
    ).toBe('Supplier 1');
  });

  it('visitor with show off sees pack shop', () => {
    expect(
      visitorDesignCreditCompanyName({
        isOwner: false,
        showSourceShops: false,
        packCompanyId: 't1',
        packCompanyName: 'Trader 1',
        productCompanyId: 's1',
        productCompanyName: 'Supplier 1',
      }),
    ).toBe('Trader 1');
  });

  it('visitor re-curate show on with hidden upstream sees Trader not S1', () => {
    expect(
      visitorDesignCreditCompanyName({
        isOwner: false,
        showSourceShops: true,
        packCompanyId: 'buyer',
        packCompanyName: 'Buyer 1',
        productCompanyId: 's1',
        productCompanyName: 'Supplier 1',
        sourceHops: [
          { companyId: 't1', companyName: 'Trader 1', showSourceShops: false },
        ],
      }),
    ).toBe('Trader 1');
  });

  it('visitor with declared source but unloadable hops sees pack owner not S1', () => {
    expect(
      visitorDesignCreditCompanyName({
        isOwner: false,
        showSourceShops: true,
        packCompanyId: 'buyer',
        packCompanyName: 'Buyer 1',
        productCompanyId: 's1',
        productCompanyName: 'Supplier 1',
        sourceHops: [],
        declaredSourceCollectionId: 't1-pack',
      }),
    ).toBe('Buyer 1');
  });
});
