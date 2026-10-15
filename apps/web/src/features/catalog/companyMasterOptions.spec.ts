import { describe, expect, it } from 'vitest';
import { MasterCategorySlug } from '@ekum/domain-types';
import { resolveCompanyMasterOptions } from './companyMasterOptions';

const catalog = [
  {
    id: '1',
    slug: MasterCategorySlug.WomensReadymadeEthnic,
    label: 'Womens – Readymade – Ethnic',
    active: true,
    sortOrder: 1,
  },
  {
    id: '2',
    slug: MasterCategorySlug.WomensReadymadeWestern,
    label: 'Womens – Readymade – Western',
    active: true,
    sortOrder: 2,
  },
  {
    id: '3',
    slug: MasterCategorySlug.WomensUnstitched,
    label: 'Womens – Unstitched',
    active: true,
    sortOrder: 3,
  },
  {
    id: '4',
    slug: MasterCategorySlug.MensReadymadeEthnic,
    label: 'Mens – Readymade – Ethnic',
    active: true,
    sortOrder: 4,
  },
];

describe('resolveCompanyMasterOptions', () => {
  it('maps three master slugs to three catalog rows', () => {
    const rows = resolveCompanyMasterOptions(
      catalog,
      [
        MasterCategorySlug.WomensReadymadeEthnic,
        MasterCategorySlug.WomensReadymadeWestern,
        MasterCategorySlug.WomensUnstitched,
      ],
      [],
    );
    expect(rows.map((r) => r.slug)).toEqual([
      MasterCategorySlug.WomensReadymadeEthnic,
      MasterCategorySlug.WomensReadymadeWestern,
      MasterCategorySlug.WomensUnstitched,
    ]);
  });

  it('expands legacy super categories into master options', () => {
    const rows = resolveCompanyMasterOptions(catalog, [], ['womens_apparel']);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.slug).sort()).toEqual(
      [
        MasterCategorySlug.WomensReadymadeEthnic,
        MasterCategorySlug.WomensReadymadeWestern,
        MasterCategorySlug.WomensUnstitched,
      ].sort(),
    );
  });

  it('does not drop to empty when supers would otherwise fail a raw slug filter', () => {
    const rows = resolveCompanyMasterOptions(catalog, undefined, ['womens_apparel']);
    expect(rows.length).toBeGreaterThan(1);
  });

  it('returns no options when master and super categories are unset', () => {
    expect(resolveCompanyMasterOptions(catalog, undefined, undefined)).toEqual([]);
  });

  it('returns no options when master and super categories are empty', () => {
    expect(resolveCompanyMasterOptions(catalog, [], [])).toEqual([]);
  });
});
