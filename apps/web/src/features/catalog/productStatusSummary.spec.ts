import { describe, expect, it } from 'vitest';
import { ProductStatus } from '@ekum/domain-types';
import type { ProductView } from '@ekum/domain-types';
import { productStatusLine } from './productStatusSummary';

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
    categories: [],
    images: [],
    status: ProductStatus.Draft,
    audience: 'followers',
    audienceCompanyIds: [],
    audienceGroupIds: [],
    rateVisibility: 'on_request',
    allowForward: true,
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
    ).toBe('Published · in packs');
  });

  it('shows audience when on Explore', () => {
    expect(
      productStatusLine(
        product({
          status: ProductStatus.Published,
          postedToMarketAt: '2026-01-02T00:00:00.000Z',
          audience: 'followers',
        }),
      ),
    ).toMatch(/^Published ·/);
  });
});
