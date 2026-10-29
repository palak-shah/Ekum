import { describe, expect, it } from 'vitest';
import type { Company } from '@prisma/client';
import { CompanySerializer } from '../access/company.serializer';
import { DiscoverySerializer } from './discovery.serializer';

const company = {
  id: 'me',
  name: 'Ravi',
  city: 'Surat',
  verification: 'verified',
  logoUrl: null,
  sellCategories: [],
} as unknown as Company;

type CardRow = Parameters<DiscoverySerializer['toCollectionCard']>[0];

function pack(over: Partial<CardRow> = {}): CardRow {
  return {
    id: 'col1',
    companyId: 'me',
    company,
    name: 'Live pack',
    description: null,
    categories: [],
    coverImage: null,
    status: 'published',
    updatedAt: new Date('2026-10-22T00:00:00.000Z'),
    exploreActivityAt: null,
    allowForward: true,
    showSourceShops: false,
    exploreNewDesignCount: 0,
    rateVisibility: 'on_request',
    rate: null,
    rateMax: null,
    catalogRateUnit: 'mtr',
    _count: { products: 2 },
    products: [
      {
        product: {
          images: [],
          rate: 90,
          unit: 'set',
          dispatchUnit: 'set',
          catalogRateUnit: 'mtr',
        },
      },
      {
        product: {
          images: [],
          rate: 110,
          unit: 'set',
          dispatchUnit: 'set',
          catalogRateUnit: 'mtr',
        },
      },
    ],
    ...over,
  } as CardRow;
}

describe('toCollectionCard', () => {
  const serializer = new DiscoverySerializer({
    toPublicSummary: (row: Company) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      verification: row.verification,
      logoUrl: row.logoUrl,
      sellCategories: row.sellCategories,
    }),
  } as unknown as CompanySerializer);

  it('shows design min–max on own Explore post when pack rate is empty', () => {
    const card = serializer.toCollectionCard(pack(), { viewerCompanyId: 'me' });
    expect(card.rateMin).toBe(90);
    expect(card.rateMax).toBe(110);
    expect(card.rateUnit).toBe('mtr');
  });

  it('hides the band from other shops when rates are on request', () => {
    const card = serializer.toCollectionCard(pack(), { viewerCompanyId: 'buyer' });
    expect(card.rateMin).toBeNull();
    expect(card.rateMax).toBeNull();
  });

  it('omits pack Rate and tags on General Collection leftover storage', () => {
    const card = serializer.toCollectionCard(
      pack({
        kind: 'general',
        name: 'General Collection',
        categories: ['Kurti'],
        rateVisibility: 'visible',
        rate: 91,
      }),
      { viewerCompanyId: 'me' },
    );
    expect(card.rateMin).toBeNull();
    expect(card.rateMax).toBeNull();
    expect(card.rateUnit).toBeNull();
    expect(card.categories).toEqual([]);
  });

  it('passes catalog orderMode through to the card', () => {
    const card = serializer.toCollectionCard(
      pack({ kind: 'catalog', orderMode: 'whole' }),
      { viewerCompanyId: 'buyer' },
    );
    expect(card.kind).toBe('catalog');
    expect(card.orderMode).toBe('whole');
  });

  it('stamps mill names on From credit when Show supplier is on', () => {
    const card = serializer.toCollectionCard(
      pack({
        companyId: 'trader',
        showSourceShops: true,
        products: [
          {
            product: {
              images: [],
              companyId: 'mill',
              company: { name: 'Ahmedabad Loom Co' },
              rate: 90,
              unit: 'mtr',
              dispatchUnit: 'mtr',
              catalogRateUnit: 'mtr',
              status: 'published',
            },
          },
        ],
      }),
      { viewerCompanyId: 'buyer' },
    );
    expect(card.sourceShopNames).toEqual(['Ahmedabad Loom Co']);
  });

  it('honors Show supplier on catalog packs the same as collections', () => {
    const on = serializer.toCollectionCard(
      pack({
        kind: 'catalog',
        companyId: 'trader',
        showSourceShops: true,
        products: [
          {
            product: {
              images: [],
              companyId: 'mill',
              company: { name: 'Ahmedabad Loom Co' },
              rate: 90,
              unit: 'mtr',
              dispatchUnit: 'mtr',
              catalogRateUnit: 'mtr',
              status: 'published',
            },
          },
        ],
      }),
      { viewerCompanyId: 'buyer' },
    );
    expect(on.sourceShopNames).toEqual(['Ahmedabad Loom Co']);

    const off = serializer.toCollectionCard(
      pack({
        kind: 'catalog',
        companyId: 'trader',
        showSourceShops: false,
        products: [
          {
            product: {
              images: [],
              companyId: 'mill',
              company: { name: 'Ahmedabad Loom Co' },
              rate: 90,
              unit: 'mtr',
              dispatchUnit: 'mtr',
              catalogRateUnit: 'mtr',
              status: 'published',
            },
          },
        ],
      }),
      { viewerCompanyId: 'buyer' },
    );
    expect(off.sourceShopNames).toEqual([]);
  });
});
