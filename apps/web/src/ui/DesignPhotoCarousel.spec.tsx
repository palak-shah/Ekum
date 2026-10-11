import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignPhotoCarousel } from './DesignPhotoCarousel';

describe('DesignPhotoCarousel', () => {
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
});
