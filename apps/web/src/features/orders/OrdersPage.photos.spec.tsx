import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { TradeListItem } from './tradeList';

vi.mock('@/lib/mediaUrl', () => ({
  toAbsoluteMediaUrl: (url: string) => url,
}));

vi.mock('@/ui/PhotoViewer', () => ({
  PhotoViewer: ({
    open,
    urls,
    index,
  }: {
    open: boolean;
    urls: string[];
    index: number;
  }) =>
    open ? (
      <div data-testid="photo-viewer">
        {urls[index] ?? ''}
      </div>
    ) : null,
}));

// Import after mocks — TradeRow is not exported; exercise via a thin harness.
import { tradeListGallery, tradeListGalleryIndex } from './tradeListGallery';

function orderWithPhotos(): TradeListItem {
  return {
    kind: 'order',
    id: 'ord-1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    direction: 'selling',
    order: {
      id: 'ord-1',
      status: 'requested',
      tradeMode: 'bilateral',
      direction: 'selling',
      intent: 'order',
      counterpart: {
        id: 'c1',
        name: 'Ahmedabad Loom Co',
        city: 'Ahmedabad',
        verification: 'none',
        logoUrl: null,
      },
      items: [
        {
          id: 'i1',
          productId: 'p1',
          name: 'Silk',
          sku: null,
          rate: 10,
          unit: 'pc',
          image: null,
          images: ['https://cdn.example/a.jpg', 'https://cdn.example/a2.jpg'],
          quantity: 10,
          requestedQuantity: 10,
          lineStatus: 'open',
          shippedQuantity: 0,
          remainingQuantity: 10,
          note: null,
        },
      ],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  } as TradeListItem;
}

describe('Orders list photo gallery helpers', () => {
  it('opens gallery at the tapped stack photo (BM-11)', () => {
    const item = orderWithPhotos();
    const gallery = tradeListGallery(item);
    expect(gallery.urls).toEqual([
      'https://cdn.example/a.jpg',
      'https://cdn.example/a2.jpg',
    ]);
    expect(tradeListGalleryIndex(gallery.urls, 'https://cdn.example/a2.jpg')).toBe(1);
  });
});

// Smoke: thumb button exists on a minimal row render via dynamic import of page pieces.
// Full OrdersPage needs query client — keep this file focused on gallery + a local row harness.
describe('Trade list thumb opens viewer without navigating', () => {
  it('renders photo viewer when thumb is clicked', async () => {
    const { default: React } = await import('react');
    const { PhotoViewer } = await import('@/ui/PhotoViewer');
    const { tradeListThumbs } = await import('./tradeListThumbs');

    function Harness() {
      const item = orderWithPhotos();
      const stack = tradeListThumbs(item);
      const gallery = tradeListGallery(item);
      const [open, setOpen] = React.useState(false);
      const [index, setIndex] = React.useState(0);
      return (
        <MemoryRouter>
          <div data-testid="trade-list-row">
            <button
              type="button"
              data-testid="trade-list-thumb"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIndex(tradeListGalleryIndex(gallery.urls, stack.urls[0]!));
                setOpen(true);
              }}
            >
              thumb
            </button>
            <a href={`/orders/${item.order.id}`}>go</a>
            <PhotoViewer
              open={open}
              urls={gallery.urls}
              index={index}
              onIndex={setIndex}
              onClose={() => setOpen(false)}
            />
          </div>
        </MemoryRouter>
      );
    }

    render(<Harness />);
    expect(screen.queryByTestId('photo-viewer')).toBeNull();
    fireEvent.click(screen.getByTestId('trade-list-thumb'));
    expect(screen.getByTestId('photo-viewer')).toHaveTextContent(
      'https://cdn.example/a.jpg',
    );
  });
});
