import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ExploreDesignOpportunity, ExploreOpportunity } from '@ekum/domain-types';
import { OpportunityCollectionCard, OpportunityDesignCard } from './cards';

const company = {
  id: 'co-1',
  name: 'Surat Silk House',
  city: 'Surat',
  logoUrl: null,
  verification: 'unverified' as const,
  sellCategories: [],
  buyCategories: [],
};

const collectionOpportunity: ExploreOpportunity = {
  relevance: null,
  collection: {
    id: 'col1',
    name: 'Wedding Edit',
    categories: [],
    memberFind: [],
    coverImage: null,
    previewImages: [],
    imageCount: 0,
    productCount: 4,
    status: 'published',
    updatedAt: '2026-09-01T00:00:00.000Z',
    allowForward: true,
    orderPathPreference: null,
    company,
  },
};

const designOpportunity: ExploreDesignOpportunity = {
  relevance: null,
  product: {
    id: 'd1',
    name: 'Red silk saree',
    images: ['https://img.example/1.jpg', 'https://img.example/2.jpg', 'https://img.example/3.jpg'],
    rate: null,
    unit: null,
    postedAt: '2026-09-01T00:00:00.000Z',
    allowForward: true,
    company,
  },
};

describe('Explore cards open while Selecting', () => {
  it('keeps the collection name as an open link while Selecting', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OpportunityCollectionCard
          opportunity={collectionOpportunity}
          selectMode
          selected
          onToggleSelect={onToggle}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('explore-collection-open-col1')).toHaveAttribute(
      'href',
      '/collections/col1',
    );
    await user.click(screen.getByRole('button', { name: 'Select Wedding Edit' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps the design name as an open link while Selecting', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OpportunityDesignCard
          opportunity={designOpportunity}
          selectMode
          selected
          onToggleSelect={onToggle}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('explore-design-open-d1')).toHaveAttribute(
      'href',
      '/explore/products/d1',
    );
    await user.click(screen.getByRole('button', { name: 'Select Red silk saree' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('explore-design-open-d1')).toHaveTextContent('Design · 3 photos');
    expect(screen.queryByText('+2')).not.toBeInTheDocument();
  });
});
