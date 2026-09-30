import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CatalogFeedPost } from './cards';

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
    render(
      <MemoryRouter>
        <CatalogFeedPost
          name="Wedding Edit"
          meta="9 designs · 9 Sept"
          href="/collections/c1"
          images={[]}
          imageCount={0}
          company={company}
          onMediaClick={() => undefined}
        />
      </MemoryRouter>,
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

  it('shows tags and From on a second line when they exist', () => {
    render(
      <MemoryRouter>
        <CatalogFeedPost
          name="Wedding Edit"
          meta="9 designs · 9 Sept"
          detail="Sarees · Bridal · From Surat Silk House"
          href="/collections/c1"
          images={[]}
          imageCount={0}
          company={company}
          onMediaClick={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sarees · Bridal · From Surat Silk House')).toBeInTheDocument();
  });
});
