import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CollectionPreviewView, ProductView } from '@ekum/domain-types';
import { mergeShortlistWithProducts } from './albumSelectModel';
import type { BrowseShortlistEntry } from './browseShortlist';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(envelope: { message: string }) {
      super(envelope.message);
    }
  },
}));

import { api } from '@/lib/apiClient';

function product(id: string, name: string): ProductView {
  return {
    id,
    companyId: 'c1',
    companyName: 'Shop',
    name,
    sku: null,
    description: null,
    moq: null,
    rate: null,
    unit: null,
    categories: [],
    images: [],
    status: 'published',
    audience: 'everyone',
    rateVisibility: 'visible',
    audienceCompanyIds: [],
    audienceGroupIds: [],
    allowForward: true,
    postedToMarketAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: '',
    updatedAt: '',
  };
}

describe('Order collection expand + dedupe', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('merges All-designs expansion without duplicating an already-selected design', async () => {
    const existing: BrowseShortlistEntry[] = [
      {
        productId: 'p1',
        name: 'Already picked',
        thumbUrl: null,
        companyId: 'c1',
        companyName: 'Shop',
      },
    ];
    vi.mocked(api.get).mockResolvedValue({
      products: [product('p1', 'In album'), product('p2', 'Extra')],
      company: { id: 'c1', name: 'Shop' },
    } as CollectionPreviewView);

    const preview = await api.get<CollectionPreviewView>('/explore/collections/col1');
    const incoming = (preview.products ?? []).map((p) => ({
      productId: p.id,
      name: p.name,
      thumbUrl: p.images[0] ?? null,
      companyId: p.companyId,
      companyName: p.companyName ?? 'Shop',
      allowForward: p.allowForward,
    }));
    const merged = mergeShortlistWithProducts(existing, incoming);
    expect(merged.map((e) => e.productId)).toEqual(['p1', 'p2']);
    expect(merged.find((e) => e.productId === 'p1')?.name).toBe('Already picked');
  });
});
