import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignPhotoCarousel } from './DesignPhotoCarousel';

describe('DesignPhotoCarousel', () => {
  it('lets a vertical flick on the photo scroll the Explore feed (BM-07)', () => {
    render(
      <DesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        name="Design"
        photoClassName="h-32 w-full object-cover"
        onActivate={() => undefined}
      />,
    );
    const strip = screen.getByTestId('design-photo-carousel').className;
    expect(strip).toMatch(/touch-\[pan-x_pan-y\]/);
    expect(strip).not.toMatch(/(?:^|\s)touch-pan-x(?:\s|$)/);
  });

  it('swipes multi-photo designs with dots and +N', () => {
    render(
      <DesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        name="Design"
        photoClassName="h-32 w-full object-cover"
        onActivate={() => undefined}
      />,
    );
    expect(screen.getByTestId('design-photo-carousel')).toHaveAttribute('data-photo-index', '0');
    expect(screen.getByTestId('design-photo-dots')).toBeInTheDocument();
    expect(screen.getByTestId('collection-tile-extra-photos')).toHaveTextContent('+1');
  });

  it('activates on tap', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(
      <DesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        name="Design"
        photoClassName="h-32 w-full object-cover"
        onActivate={onActivate}
      />,
    );
    await user.click(screen.getByTestId('design-photo-carousel'));
    expect(onActivate).toHaveBeenCalledWith(0);
  });

  it('shows side arrows only on image hover, with a louder hover on the arrow', () => {
    render(
      <DesignPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        name="Design"
        photoClassName="h-32 w-full object-cover"
        onActivate={() => undefined}
        showArrows
        showDots={false}
        showExtraBadge={false}
      />,
    );
    const next = screen.getByTestId('explore-photo-next');
    expect(next.className).toMatch(/opacity-0/);
    expect(next.className).toMatch(/group-hover:opacity-100/);
    expect(next.className).toMatch(/hover:bg-white/);
    expect(next.className).toMatch(/hover:scale-110/);
  });
});
