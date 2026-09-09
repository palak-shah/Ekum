import { describe, expect, it } from 'vitest';
import type { Collection, CollectionProduct, Product } from '@prisma/client';
import { CatalogSerializer } from './catalog.serializer';

const serializer = new CatalogSerializer();

const baseProduct = {
  id: 'product-1',
  companyId: 'company-1',
  name: 'Banarasi Silk',
  sku: null,
  description: null,
  moq: null as number | null,
  unit: 'mtr',
  categories: ['Sarees'],
  images: [],
  status: 'draft',
  audience: 'connections',
  rateVisibility: 'on_request',
  audienceCompanyIds: [] as string[],
  audienceGroupIds: [] as string[],
  allowForward: true,
  postedToMarketAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

function product(rate: unknown): Product {
  return { ...baseProduct, rate } as unknown as Product;
}

describe('CatalogSerializer', () => {
  it('exposes owning companyId for curated-member detection', () => {
    expect(serializer.toProductView(product(null)).companyId).toBe('company-1');
  });

  it('treats a null rate as "on request"', () => {
    expect(serializer.toProductView(product(null)).rate).toBeNull();
  });

  it('converts a Decimal rate to a number', () => {
    const view = serializer.toProductView(product({ toNumber: () => 120.5 }));
    expect(view.rate).toBe(120.5);
  });

  it('exposes moq when set', () => {
    const view = serializer.toProductView({ ...product(null), moq: 100 } as Product);
    expect(view.moq).toBe(100);
  });

  it('reports product count from the _count aggregate', () => {
    const collection = {
      id: 'collection-1',
      companyId: 'company-1',
      name: 'Summer Line',
      description: null,
      coverImage: null,
      status: 'published',
      audience: 'connections',
      rateVisibility: 'on_request',
      audienceCompanyIds: [],
      audienceGroupIds: [],
      allowForward: true,
      orderPathPreference: null,
      startsAt: null,
      endsAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { products: 3 },
    } as unknown as Collection & { _count: { products: number } };
    const view = serializer.toCollectionView(collection);
    expect(view.productCount).toBe(3);
    expect(view.companyId).toBe('company-1');
    expect(view.memberShops).toEqual([]);
    expect(view.allowForward).toBe(true);
    expect(view.orderPathPreference).toBeNull();
    expect(view.audienceCompanyIds).toEqual([]);
    expect(view.audienceGroupIds).toEqual([]);
    expect(view.startsAt).toBeNull();
    expect(view.endsAt).toBeNull();
    expect(view.previewImages).toEqual([]);
    expect(view.photoCount).toBe(0);
    expect(view.createdBy).toBeNull();
    expect(view.updatedBy).toBeNull();
  });

  it('maps ordered products into a collection detail view', () => {
    const collection = {
      id: 'collection-1',
      companyId: 'company-1',
      name: 'Summer Line',
      description: null,
      coverImage: null,
      status: 'draft',
      audience: 'everyone',
      rateVisibility: 'visible',
      audienceCompanyIds: [],
      audienceGroupIds: [],
      allowForward: false,
      orderPathPreference: 'handle',
      startsAt: null,
      endsAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      products: [{ product: product(null) }],
    } as unknown as Collection & { products: (CollectionProduct & { product: Product })[] };
    const detail = serializer.toCollectionDetail(collection);
    expect(detail.productCount).toBe(1);
    expect(detail.orderPathPreference).toBeNull();
    expect(detail.products[0]?.name).toBe('Banarasi Silk');
  });

  it('maps member companyName on collection detail products', () => {
    const collection = {
      id: 'collection-1',
      companyId: 'ravi',
      name: 'Curated',
      description: null,
      coverImage: null,
      status: 'published',
      audience: 'followers',
      rateVisibility: 'visible',
      audienceCompanyIds: [],
      audienceGroupIds: [],
      allowForward: true,
      orderPathPreference: null,
      startsAt: null,
      endsAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      products: [
        {
          product: {
            ...product(null),
            companyId: 'kavita',
            company: { id: 'kavita', name: 'Ahmedabad Loom Co' },
          },
        },
      ],
    } as unknown as Collection & { products: (CollectionProduct & { product: Product })[] };
    const detail = serializer.toCollectionDetail(collection);
    expect(detail.products[0]?.companyName).toBe('Ahmedabad Loom Co');
    expect(detail.memberShops).toEqual([{ id: 'kavita', name: 'Ahmedabad Loom Co' }]);
  });
});
