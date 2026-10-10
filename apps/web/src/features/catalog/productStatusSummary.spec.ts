import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import type { ProductView } from '@ekum/domain-types';
import {
  joinLabelList,
  libraryAuditLine,
  productStatusLine,
  productTileSubtitle,
} from './productStatusSummary';

function product(partial: Partial<ProductView>): ProductView {
  return {
    id: 'p1',
    companyId: 'c1',
    name: 'Design',
    sku: 'EK-1',
    description: null,
    moq: null,
    rate: null,
    rateMax: null,
    unit: 'pc',
    piecesPerPack: null,
    categories: [],
    images: [],
    status: ProductStatus.Draft,
    audience: 'followers',
    audienceCompanyIds: [],
    audienceGroupIds: [],
    rateVisibility: 'on_request',
    allowForward: true,
    allowDownload: false,
    collectionNames: [],
    postedToMarketAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('productStatusLine', () => {
  it('marks pack-published designs without Explore post', () => {
    expect(
      productStatusLine(
        product({
          status: ProductStatus.Published,
          postedToMarketAt: null,
        }),
      ),
    ).toBe('In your collections');
  });

  it('does not say On Explore or who can see on a live design', () => {
    expect(
      productStatusLine(
        product({
          status: ProductStatus.Published,
          postedToMarketAt: '2026-01-02T00:00:00.000Z',
          audience: 'connections',
        }),
      ),
    ).toBe('');
  });
});

describe('joinLabelList', () => {
  it('separates adjacent names', () => {
    expect(joinLabelList(['suit 1', 'suit 2'])).toBe('suit 1 · suit 2');
  });
});

describe('libraryAuditLine', () => {
  it('is the date only', () => {
    expect(
      libraryAuditLine({
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      }),
    ).toMatch(/Sep/);
    expect(
      libraryAuditLine({
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      }),
    ).not.toContain('·');
  });
});

describe('productTileSubtitle', () => {
  it('keeps rate SKU photos off the status line', () => {
    expect(
      productTileSubtitle(
        product({
          status: ProductStatus.Published,
          postedToMarketAt: null,
          sku: 'EK-1',
          images: ['https://example.com/a.jpg'],
        }),
      ),
    ).toBe('Price on request · EK-1 · 1 photo');
  });
});
