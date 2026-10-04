import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ExploreOpportunity } from '@ekum/domain-types';
import { OpportunityCollectionCard, ProductTile } from './cards';

function renderCard(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const opportunity: ExploreOpportunity = {
  relevance: 'Connected · GST verified · Matches Sarees',
  collection: {
    id: 'col1',
    name: 'Wedding Edit',
    categories: ['Sarees'],
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
    renderCard(<OpportunityCollectionCard opportunity={opportunity} />);
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.getByTestId('gst-tick')).toBeInTheDocument();
    expect(screen.getByText('Surat · Fabric, Dress material')).toBeInTheDocument();
    expect(screen.queryByText(/Connected/)).toBeNull();
    expect(screen.queryByText('GST verified')).toBeNull();
    expect(screen.getByText(/9 designs/)).toHaveTextContent(/ago|just now|\d/);
  });

  it('puts the shop name on a search design tile (sr 17 T3)', () => {
    renderCard(
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
      />,
    );
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
  });
});
