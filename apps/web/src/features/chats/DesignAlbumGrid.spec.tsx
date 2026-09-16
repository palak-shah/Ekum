import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DesignAlbumGrid } from './DesignAlbumGrid';

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/ui/PhotoViewer', () => ({
  PhotoViewer: ({
    captions,
    headerAction,
  }: {
    captions?: Array<string | null | undefined>;
    headerAction?: { label: string; onClick: () => void; testId?: string };
  }) => (
    <div data-testid="photo-viewer">
      <p>{captions?.[0]}</p>
      {headerAction ? (
        <button
          type="button"
          data-testid={headerAction.testId}
          onClick={headerAction.onClick}
        >
          {headerAction.label}
        </button>
      ) : null}
    </div>
  ),
}));

describe('DesignAlbumGrid', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('keeps compact tiles with names (not View design on every tile)', () => {
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
    expect(screen.queryByText('View design →')).toBeNull();
  });

  it('opens a design viewer with View design → then navigates', async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getAllByTestId('design-album-tile')[0]!);
    expect(screen.getByTestId('photo-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('design-album-view-design')).toHaveTextContent('View design →');
    await user.click(screen.getByTestId('design-album-view-design'));
    expect(navigate).toHaveBeenCalledWith('/explore/products/p1');
  });
});
