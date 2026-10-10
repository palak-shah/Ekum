import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ExploreOpportunity } from '@ekum/domain-types';
import { ToastProvider } from '@/ui/Toast';
import { OpportunityCollectionCard, ProductTile } from './cards';

function renderCard(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>{ui}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const opportunity: ExploreOpportunity = {
  relevance: 'Connected · GST verified · Matches Sarees',
  collection: {
    id: 'col1',
    name: 'Wedding Edit',
    description: null,
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
    rateMin: null,
    rateMax: null,
    rateUnit: null,
    exploreNewDesignCount: 0,
    showSourceShops: false,
    sourceShopNames: [],
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
  it('drops Connected, ticks GST, and puts date beside the shop name', () => {
    renderCard(<OpportunityCollectionCard opportunity={opportunity} />);
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.getByTestId('gst-tick')).toBeInTheDocument();
    expect(screen.getByText('Surat · Fabric, Dress material')).toBeInTheDocument();
    expect(screen.queryByText(/Connected/)).toBeNull();
    expect(screen.queryByText('GST verified')).toBeNull();
    expect(screen.queryByText(/9 designs/)).toBeNull();
    expect(screen.getByTestId('explore-post-when')).toHaveTextContent(/ago|just now|\d/);
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent('Sarees');
  });

  it('shows teal rate and description when the pack has public rates and a note', () => {
    renderCard(
      <OpportunityCollectionCard
        opportunity={{
          ...opportunity,
          collection: {
            ...opportunity.collection,
            description: 'Festive cottons for monsoon counters.',
            rateMin: 430,
            rateMax: 1450,
            rateUnit: 'pc',
          },
        }}
      />,
    );
    expect(screen.getByTestId('explore-feed-rate')).toHaveTextContent('₹430–₹1,450 /pc');
    expect(screen.getByTestId('explore-feed-about-body')).toHaveTextContent(
      'Festive cottons for monsoon counters.',
    );
  });

  it('puts the shop name on a search design tile (sr 17 T3)', () => {
    renderCard(
      <ProductTile
        product={{
          id: 'p1',
          name: 'Banarasi Silk Saree',
          images: [],
          rate: 2450,
          rateMax: null,
          unit: 'pc',
          categories: [],
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
