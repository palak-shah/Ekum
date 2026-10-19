import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ExploreOpportunity } from '@ekum/domain-types';
import { ToastProvider } from '@/ui/Toast';
import { OpportunityCollectionCard } from './cards';

function Path() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/explore']}>
        <ToastProvider>
          <Path />
          {ui}
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function opportunity(overrides: Partial<ExploreOpportunity['collection']> = {}): ExploreOpportunity {
  return {
    relevance: null,
    collection: {
      id: 'col1',
      name: 'Lot short: bedsheets',
      description: null,
      categories: ['Bedsheet', 'Double bedsheet', 'Bedsheet set', 'King'],
      memberFind: [],
      coverImage: null,
      previewImages: [
        'https://img.example/1.jpg',
        'https://img.example/2.jpg',
        'https://img.example/3.jpg',
      ],
      imageCount: 3,
      productCount: 3,
      status: 'published',
      updatedAt: '2026-09-01T00:00:00.000Z',
      allowForward: true,
      orderPathPreference: null,
      rateMin: 94,
      rateMax: 180,
      rateUnit: 'pc',
      exploreNewDesignCount: 0,
      showSourceShops: true,
      sourceShopNames: ['Mill House'],
      viewerReposted: false,
      company: {
        id: 'co-1',
        name: 'Shree Fabrics',
        city: 'Surat',
        logoUrl: null,
        verification: 'unverified',
        sellCategories: [],
        buyCategories: [],
      },
      ...overrides,
    },
  };
}

describe('Explore collection photo', () => {
  it('swipes up to five photos, opens on tap, and keeps the caption tight', async () => {
    const user = userEvent.setup();
    wrap(<OpportunityCollectionCard opportunity={opportunity()} />);
    const strip = screen.getByTestId('explore-collection-photos-col1');
    expect(strip).toHaveAttribute('data-photo-index', '0');
    expect(strip.querySelectorAll('img')).toHaveLength(3);
    expect(screen.getByTestId('explore-feed-photo-dots')).toBeInTheDocument();
    expect(screen.queryByText('View collection')).toBeNull();
    expect(screen.queryByTestId('collection-tile-extra-photos')).toBeNull();
    expect(screen.queryByTestId('explore-collection-view-more-col1')).toBeNull();
    const next = screen.getByTestId('explore-photo-next');
    expect(next).toBeInTheDocument();
    expect(next.className).toMatch(/bg-white\/55/);
    expect(screen.queryByTestId('explore-photo-prev')).toBeNull();
    expect(screen.getByTestId('explore-feed-rate')).toHaveTextContent('₹94–₹180/pc');
    expect(screen.getByTestId('explore-feed-categories')).toHaveTextContent(
      'Bedsheet · Double bedsheet · Bedsheet set · King',
    );
    expect(screen.queryByText(/From Mill House/)).toBeNull();
    await user.click(strip);
    expect(screen.getByTestId('path')).toHaveTextContent('/collections/col1');
  });

  it('hides arrows when there is only one photo', () => {
    wrap(
      <OpportunityCollectionCard
        opportunity={opportunity({
          previewImages: ['https://img.example/1.jpg'],
          imageCount: 1,
          productCount: 1,
        })}
      />,
    );
    expect(screen.queryByTestId('explore-photo-next')).toBeNull();
    expect(screen.queryByTestId('explore-photo-prev')).toBeNull();
  });

  it('adds a View more card when more photos exist, with no count line', async () => {
    const user = userEvent.setup();
    const urls = [1, 2, 3, 4, 5, 6].map((n) => `https://img.example/${n}.jpg`);
    wrap(
      <OpportunityCollectionCard
        opportunity={opportunity({ previewImages: urls, imageCount: 8, productCount: 8 })}
      />,
    );
    expect(screen.getByTestId('explore-collection-photos-col1').querySelectorAll('img')).toHaveLength(
      5,
    );
    expect(screen.queryByText(/View all/)).toBeNull();
    const viewMore = screen.getByTestId('explore-collection-view-more-col1');
    expect(viewMore).toHaveTextContent('+3');
    expect(viewMore).toHaveTextContent('more designs');
    expect(viewMore).toHaveTextContent('View collection');
    await user.click(viewMore);
    expect(screen.getByTestId('path')).toHaveTextContent('/collections/col1');
  });

  it('opens View more while Selecting and toggles the photo', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const urls = [1, 2, 3, 4, 5, 6].map((n) => `https://img.example/${n}.jpg`);
    wrap(
      <OpportunityCollectionCard
        opportunity={opportunity({ previewImages: urls, imageCount: 6 })}
        selectMode
        onToggleSelect={onToggle}
      />,
    );
    await user.click(screen.getByTestId('explore-collection-photos-col1'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId('explore-collection-view-more-col1'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('path')).toHaveTextContent('/collections/col1');
  });
});
