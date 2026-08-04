import { describe, expect, it } from 'vitest';
import type { Collection, CollectionProduct, Product } from '@prisma/client';
import { CatalogSerializer } from './catalog.serializer';

const serializer = new CatalogSerializer();

const baseProduct = {
  id: 'product-1',
  name: 'Banarasi Silk',
  sku: null,
  description: null,
  unit: 'mtr',
  categories: ['Sarees'],
  images: [],
  status: 'draft',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

function product(rate: unknown): Product {
  return { ...baseProduct, rate } as unknown as Product;
}

describe('CatalogSerializer', () => {
  it('treats a null rate as "on request"', () => {
    expect(serializer.toProductView(product(null)).rate).toBeNull();
  });

  it('converts a Decimal rate to a number', () => {
    const view = serializer.toProductView(product({ toNumber: () => 120.5 }));
    expect(view.rate).toBe(120.5);
  });

  it('reports product count from the _count aggregate', () => {
    const collection = {
      id: 'collection-1',
      name: 'Summer Line',
      description: null,
      coverImage: null,
      status: 'published',
      audience: 'connections',
      rateVisibility: 'on_request',
      audienceCompanyIds: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { products: 3 },
    } as unknown as Collection & { _count: { products: number } };
    expect(serializer.toCollectionView(collection).productCount).toBe(3);
    expect(serializer.toCollectionView(collection).audienceCompanyIds).toEqual([]);
  });

  it('maps ordered products into a collection detail view', () => {
    const collection = {
      id: 'collection-1',
      name: 'Summer Line',
      description: null,
      coverImage: null,
      status: 'draft',
      audience: 'everyone',
      rateVisibility: 'visible',
      audienceCompanyIds: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      products: [{ product: product(null) }],
    } as unknown as Collection & { products: (CollectionProduct & { product: Product })[] };
    const detail = serializer.toCollectionDetail(collection);
    expect(detail.productCount).toBe(1);
    expect(detail.products[0]?.name).toBe('Banarasi Silk');
  });
});
