import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ExploreOpportunity } from '@ekum/domain-types';
import { OpportunityCollectionCard, ProductTile } from './cards';

const opportunity: ExploreOpportunity = {
  relevance: 'Connected · GST verified · Matches Sarees',
  collection: {
    id: 'col1',
    name: 'Wedding Edit',
    categories: [],
    memberFind: [],
    coverImage: null,
    previewImages: [],
    imageCount: 0,
    productCount: 9,
    status: 'published',
    updatedAt: '2026-09-01T00:00:00.000Z',
    allowForward: true,
    orderPathPreference: null,
    company: {
      id: 'co-1',
      name: 'Surat Silk House',
      city: 'Surat',
      logoUrl: null,
      verification: 'gst_verified',
      sellCategories: ['Fabric', 'Dress material'],
    },
  },
};

describe('Explore shop header chrome', () => {
  it('drops Connected, ticks GST, and puts date under the pack', () => {
    render(
      <MemoryRouter>
        <OpportunityCollectionCard opportunity={opportunity} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.getByTestId('gst-tick')).toBeInTheDocument();
    expect(screen.getByText('Surat · Fabric, Dress material')).toBeInTheDocument();
    expect(screen.queryByText(/Connected/)).toBeNull();
    expect(screen.queryByText('GST verified')).toBeNull();
    expect(screen.getByText(/9 designs/)).toHaveTextContent(/ago|just now|\d/);
  });

  it('puts the shop name on a search design tile (sr 17 T3)', () => {
    render(
      <MemoryRouter>
        <ProductTile
          product={{
            id: 'p1',
            name: 'Banarasi Silk Saree',
            images: [],
            rate: 2450,
            unit: 'pc',
            company: {
              id: 'co-1',
              name: 'Surat Silk House',
              city: 'Surat',
              logoUrl: null,
              verification: 'gst_verified',
              sellCategories: [],
            },
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
  });
});
