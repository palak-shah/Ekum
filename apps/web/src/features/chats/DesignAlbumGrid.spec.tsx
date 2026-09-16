import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DesignAlbumGrid } from './DesignAlbumGrid';

describe('DesignAlbumGrid', () => {
  it('shows design name and View design like a design card', () => {
    render(
      <MemoryRouter>
        <DesignAlbumGrid
          items={[
            { id: 'p1', name: 'Banarasi Silk Saree', image: 'https://example.com/a.jpg' },
            { id: 'p2', name: 'Georgette Party Saree', image: 'https://example.com/b.jpg' },
          ]}
          designPath={(id) => `/explore/products/${id}`}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Banarasi Silk Saree')).toBeInTheDocument();
    expect(screen.getByText('Georgette Party Saree')).toBeInTheDocument();
    expect(screen.getAllByText('View design →')).toHaveLength(2);
    const links = screen.getAllByTestId('design-album-tile');
    expect(links[0]).toHaveAttribute('href', '/explore/products/p1');
    expect(links[1]).toHaveAttribute('href', '/explore/products/p2');
  });
});
