import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignSheetPhotoCarousel } from './DesignSheetPhotoCarousel';
import { Sheet } from '@/ui/kit';

describe('DesignSheetPhotoCarousel', () => {
  it('shows next/prev, count, and dots when there are multiple photos', () => {
    render(
      <DesignSheetPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg', 'https://cdn.example/c.jpg']}
        index={0}
        onIndex={() => undefined}
        onOpenFullscreen={() => undefined}
      />,
    );
    expect(screen.getByTestId('collection-design-photo-carousel')).toHaveAttribute(
      'data-photo-index',
      '0',
    );
    expect(screen.getByTestId('collection-design-photo-next')).toBeInTheDocument();
    expect(screen.getByTestId('collection-design-photo-prev')).toBeDisabled();
    expect(screen.getByTestId('collection-design-photo-count')).toHaveTextContent('1 / 3');
    expect(screen.getByTestId('collection-design-photo-dots')).toBeInTheDocument();
  });

  it('hides arrows and dots for a single photo', () => {
    render(
      <DesignSheetPhotoCarousel
        urls={['https://cdn.example/a.jpg']}
        index={0}
        onIndex={() => undefined}
        onOpenFullscreen={() => undefined}
      />,
    );
    expect(screen.queryByTestId('collection-design-photo-dots')).toBeNull();
    expect(screen.queryByTestId('collection-design-photo-next')).toBeNull();
  });

  it('opens fullscreen on tap when scroll did not move', async () => {
    const user = userEvent.setup();
    const onOpenFullscreen = vi.fn();
    render(
      <DesignSheetPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
        index={0}
        onIndex={() => undefined}
        onOpenFullscreen={onOpenFullscreen}
      />,
    );
    await user.click(screen.getByTestId('collection-design-photo-carousel'));
    expect(onOpenFullscreen).toHaveBeenCalled();
  });

  it('advances with the Next photo control', async () => {
    const user = userEvent.setup();
    const onIndex = vi.fn();
    render(
      <DesignSheetPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg', 'https://cdn.example/c.jpg']}
        index={0}
        onIndex={onIndex}
        onOpenFullscreen={() => undefined}
      />,
    );
    await user.click(screen.getByTestId('collection-design-photo-next'));
    expect(onIndex).toHaveBeenCalledWith(1);
  });

  it('jumps via a photo dot', async () => {
    const user = userEvent.setup();
    const onIndex = vi.fn();
    render(
      <DesignSheetPhotoCarousel
        urls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg', 'https://cdn.example/c.jpg']}
        index={0}
        onIndex={onIndex}
        onOpenFullscreen={() => undefined}
      />,
    );
    await user.click(screen.getByTestId('collection-design-photo-dot-2'));
    expect(onIndex).toHaveBeenCalledWith(2);
  });
});

describe('collection design photos sheet height', () => {
  it('raises sheet max-height like Share so the panel hugs toward the viewport', () => {
    render(
      <Sheet
        open
        onClose={() => undefined}
        title="EK-TEST"
      >
        <DesignSheetPhotoCarousel
          urls={['https://cdn.example/a.jpg']}
          index={0}
          onIndex={() => undefined}
          onOpenFullscreen={() => undefined}
        />
      </Sheet>,
    );
    const panel = document.querySelector('.ekum-sheet');
    expect(panel).toBeTruthy();
    expect(panel!.className).toMatch(/!max-h-\[min\(92dvh,100dvh\)\]/);
  });
});
