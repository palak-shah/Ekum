import { describe, expect, it } from 'vitest';
import type { ExploreProductPreviewView, ProductView } from '@ekum/domain-types';
import { applyHowManyDetail } from './howManyHydrate';

const stub = {
  id: 'p1',
  name: 'Linen',
  images: ['thumb.jpg'],
  companyId: 'c1',
  categories: [],
  unit: null,
  moq: null,
  rate: null,
  rateMax: null,
} as ProductView;

const detail = {
  id: 'p1',
  name: 'Linen Summer Saree',
  images: ['full.jpg'],
  rate: 800,
  unit: 'set',
  postedAt: '2026-01-01T00:00:00.000Z',
  allowForward: true,
  company: { id: 'c1', name: 'Shop', city: 'Surat', verification: 'none', logoUrl: null },
  connected: true,
  visible: true,
  moq: 12,
  categories: ['Saree'],
} as ExploreProductPreviewView;

describe('applyHowManyDetail', () => {
  it('fills sold-as and rate from explore detail', () => {
    expect(applyHowManyDetail(stub, detail)).toMatchObject({
      name: 'Linen Summer Saree',
      images: ['full.jpg'],
      categories: ['Saree'],
      unit: 'set',
      moq: 12,
      rate: 800,
    });
  });

  it('keeps the stub when detail has not loaded', () => {
    expect(applyHowManyDetail(stub, undefined)).toBe(stub);
  });
});
