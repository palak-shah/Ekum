import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CatalogFeedPost } from './cards';

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const company = {
  id: 'co-1',
  name: 'Surat Silk House',
  city: 'Surat',
  logoUrl: null,
  verification: 'gst_verified',
  sellCategories: ['Sarees'],
};

describe('CatalogFeedPost pack chrome', () => {
  it('shows the Explore shop row above the pack name', () => {
    wrap(
      <CatalogFeedPost
        name="Wedding Edit"
        meta="9 designs · 9 Sept"
        href="/collections/c1"
        images={[]}
        imageCount={0}
        company={company}
        onMediaClick={() => undefined}
      />,
    );
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.getByTestId('gst-tick')).toBeInTheDocument();
    expect(screen.getByText('Surat · Sarees')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Wedding Edit/ })).toHaveAttribute(
      'href',
      '/collections/c1',
    );
    expect(screen.getByText('9 designs · 9 Sept')).toBeInTheDocument();
    expect(screen.queryByText(/From /)).toBeNull();
  });

  it('omits the shop row when the seller is already the page', () => {
    wrap(
      <CatalogFeedPost
        name="Wedding Edit"
        meta="9 designs · 9 Sept"
        href="/collections/c1"
        images={[]}
        imageCount={0}
        onMediaClick={() => undefined}
      />,
    );
    expect(screen.queryByText('Surat Silk House')).toBeNull();
    expect(screen.getByRole('link', { name: /Wedding Edit/ })).toBeInTheDocument();
  });

  it('shows tags muted and owner From as its own caption', () => {
    wrap(
      <CatalogFeedPost
        name="Wedding Edit"
        meta="9 designs · 9 Sept"
        source="From Yash Fabrics"
        detail="Sarees · Bridal"
        href="/collections/c1"
        images={[]}
        imageCount={0}
        onMediaClick={() => undefined}
      />,
    );
    expect(screen.getByTestId('catalog-feed-source')).toHaveTextContent('From Yash Fabrics');
    expect(screen.getByText('Sarees · Bridal')).toBeInTheDocument();
  });
});
