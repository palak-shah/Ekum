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
});
