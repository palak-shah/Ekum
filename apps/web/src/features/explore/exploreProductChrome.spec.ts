import { describe, expect, it } from 'vitest';
import { CatalogOrderMode, type ExploreProductPreviewView } from '@ekum/domain-types';
import { exploreProductToSheet, exploreProductTradeDock } from './exploreProductChrome';

const preview = {
  id: 'p1',
  name: 'Navy',
  images: ['navy.jpg'],
  rate: 450,
  rateMax: null,
  unit: 'pc',
  dispatchUnit: 'pc',
  categories: ['saree'],
  postedAt: '2026-10-01T00:00:00.000Z',
  allowForward: true,
  company: {
    id: 'c1',
    name: 'Surat Silk House',
    city: 'Surat',
    logoUrl: null,
    verification: 'gst',
  },
  connected: true,
  visible: true,
  description: 'Handloom',
  moq: 1,
} as ExploreProductPreviewView;

describe('exploreProductTradeDock', () => {
  it('pins Ask / Order / Curate for a visitor on a visible design', () => {
    expect(exploreProductTradeDock({ visitor: true, visible: true })).toBe(true);
  });

  it('hides the dock for the owner even if they sell or trade', () => {
    expect(exploreProductTradeDock({ visitor: false, visible: true })).toBe(false);
  });

  it('hides the dock when the design is not visible', () => {
    expect(exploreProductTradeDock({ visitor: true, visible: false })).toBe(false);
  });
});

describe('exploreProductToSheet', () => {
  it('keeps exclusive catalog stamps so Order remaps', () => {
    expect(
      exploreProductToSheet({
        ...preview,
        catalogCollectionId: 'cat-1',
        catalogOrderMode: CatalogOrderMode.Whole,
      }),
    ).toMatchObject({
      id: 'p1',
      companyId: 'c1',
      companyName: 'Surat Silk House',
      catalogCollectionId: 'cat-1',
      catalogOrderMode: CatalogOrderMode.Whole,
    });
  });

  it('omits catalog stamps when the design is not exclusive', () => {
    expect(exploreProductToSheet(preview)).not.toHaveProperty('catalogCollectionId');
    expect(exploreProductToSheet(preview)).not.toHaveProperty('catalogOrderMode');
  });
});
