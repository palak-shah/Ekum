import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedDesignPhotoCarousel } from './FeedDesignPhotoCarousel';

describe('FeedDesignPhotoCarousel', () => {
  it('shows swipe carousel, dots, and +N for multi-photo feed tiles', () => {
    render(
      <FeedDesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg', 'https://cdn.example/c.jpg']}
        name="EK-TEST"
        selectMode={false}
        selected={false}
        onActivate={() => undefined}
      />,
    );
    expect(screen.getByTestId('collection-feed-photo-carousel')).toHaveAttribute(
      'data-photo-index',
      '0',
    );
    expect(screen.getByTestId('design-photo-dots')).toBeInTheDocument();
    expect(screen.getByTestId('collection-tile-extra-photos')).toHaveTextContent('+2');
  });

  it('opens the design on tap when scroll did not move', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(
      <FeedDesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        name="EK-TEST"
        selectMode={false}
        selected={false}
        onActivate={onActivate}
      />,
    );
    await user.click(screen.getByTestId('collection-feed-photo-carousel'));
    expect(onActivate).toHaveBeenCalledWith(0);
  });

  it('lets iPhone scroll the feed from the photo (BM-07)', () => {
    render(
      <FeedDesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        name="EK-TEST"
        selectMode={false}
        selected={false}
        onActivate={() => undefined}
      />,
    );
    const strip = screen.getByTestId('collection-feed-photo-carousel').className;
    expect(strip).toMatch(/touch-\[pan-x_pan-y\]/);
    expect(strip).not.toMatch(/(?:^|\s)touch-pan-x(?:\s|$)/);
  });
});
