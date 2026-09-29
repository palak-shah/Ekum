import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import { OrderCollectionResolveSheet } from './OrderCollectionResolveSheet';

const showToast = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(envelope: { message: string }) {
      super(envelope.message);
    }
  },
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}));

import { api } from '@/lib/apiClient';

function album(id: string, name: string): BrowseAlbumEntry {
  return {
    collectionId: id,
    name,
    coverImage: null,
    companyId: 'c1',
    companyName: 'Shop',
  };
}

describe('OrderCollectionResolveSheet Continue', () => {
  beforeEach(() => {
    showToast.mockReset();
    vi.mocked(api.get).mockReset();
  });

  it('keeps the error when the parent passes a new albums array (BM Continue no-op)', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockRejectedValue(new Error('network'));
    const albums = [album('col1', 'Wedding 2026'), album('col2', 'Wedding Edit 2026')];
    const onResolved = vi.fn();
    const view = render(
      <OrderCollectionResolveSheet
        open
        onClose={() => undefined}
        albums={albums}
        designCount={0}
        existingShortlist={[]}
        onResolved={onResolved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Could not open those collections.')).toBeInTheDocument();
    expect(showToast).toHaveBeenCalled();

    view.rerender(
      <OrderCollectionResolveSheet
        open
        onClose={() => undefined}
        albums={[...albums]}
        designCount={0}
        existingShortlist={[]}
        onResolved={onResolved}
      />,
    );

    expect(screen.getByText('Could not open those collections.')).toBeInTheDocument();
    expect(onResolved).not.toHaveBeenCalled();
  });

  it('opens How many after All designs expand', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({
      products: [
        {
          id: 'p1',
          name: 'Silk',
          images: [],
          companyId: 'c1',
          companyName: 'Shop',
          allowForward: true,
        },
      ],
    });
    const onResolved = vi.fn();
    render(
      <OrderCollectionResolveSheet
        open
        onClose={() => undefined}
        albums={[album('col1', 'Wedding 2026')]}
        designCount={0}
        existingShortlist={[]}
        onResolved={onResolved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
    expect(onResolved.mock.calls[0]![0].shortlist).toEqual(
      expect.arrayContaining([expect.objectContaining({ productId: 'p1' })]),
    );
  });

  it('opens a locked pack instead of saying designs are not listed yet', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        products: [
          {
            id: 'p1',
            name: 'Silk',
            images: [],
            companyId: 'c1',
            companyName: 'Shop',
            allowForward: true,
          },
        ],
      })
      .mockResolvedValueOnce({ products: null });
    const onResolved = vi.fn();
    render(
      <OrderCollectionResolveSheet
        open
        onClose={() => undefined}
        albums={[album('col1', 'Wedding 2026'), album('col2', 'Wedding Edit 2026')]}
        designCount={0}
        existingShortlist={[]}
        onResolved={onResolved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(onResolved).toHaveBeenCalled());
    expect(onResolved.mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        navigateToCollectionId: 'col2',
        shortlist: expect.arrayContaining([expect.objectContaining({ productId: 'p1' })]),
      }),
    );
  });

  it('says when a pack has no designs', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ products: [] });
    render(
      <OrderCollectionResolveSheet
        open
        onClose={() => undefined}
        albums={[album('col2', 'Wedding Edit 2026')]}
        designCount={0}
        existingShortlist={[]}
        onResolved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Wedding Edit 2026 has no designs.')).toBeInTheDocument();
  });
});
