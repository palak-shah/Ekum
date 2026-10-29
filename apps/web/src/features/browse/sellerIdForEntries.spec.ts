import { describe, expect, it } from 'vitest';
import { orderGoesToSellerId, sellerIdForEntries } from './useShortlistOrderFlow';

describe('sellerIdForEntries', () => {
  it('is that shop when every line is one company', () => {
    expect(
      sellerIdForEntries([
        { companyId: 'surat' },
        { companyId: 'surat' },
      ]),
    ).toBe('surat');
  });

  it('is multi when shops differ so How many can split by settings', () => {
    expect(
      sellerIdForEntries([{ companyId: 'surat' }, { companyId: 'jaipur' }]),
    ).toBe('multi');
  });
});

describe('orderGoesToSellerId', () => {
  it('is the pack owner when every line shares one curated pack', () => {
    expect(
      orderGoesToSellerId([
        {
          companyId: 'surat',
          sourceCollectionId: 'pack-1',
          sourceHandlerCompanyId: 'jaipur',
        },
        {
          companyId: 'ahmedabad',
          sourceCollectionId: 'pack-1',
          sourceHandlerCompanyId: 'jaipur',
        },
      ]),
    ).toBe('jaipur');
  });

  it('is the pack owner when every mill SKU is mine', () => {
    expect(
      orderGoesToSellerId([
        {
          companyId: 'me',
          sourceCollectionId: 'pack-1',
          sourceHandlerCompanyId: 'jaipur',
        },
        {
          companyId: 'me',
          sourceCollectionId: 'pack-1',
          sourceHandlerCompanyId: 'jaipur',
        },
      ]),
    ).toBe('jaipur');
  });

  it('falls back to mill shops when there is no pack stamp', () => {
    expect(
      orderGoesToSellerId([{ companyId: 'surat' }, { companyId: 'ahmedabad' }]),
    ).toBe('multi');
  });

  it('names the Direct mill when the wave is only Direct SKUs', () => {
    expect(
      orderGoesToSellerId([
        {
          productId: 'p1',
          companyId: 'kavita',
          sourceCollectionId: 'pack-1',
          sourceHandlerCompanyId: 'jaipur',
          sourcePath: 'direct',
          sourceDirect: true,
        },
      ]),
    ).toBe('kavita');
  });
});
