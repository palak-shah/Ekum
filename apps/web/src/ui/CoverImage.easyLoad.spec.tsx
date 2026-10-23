import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { AlbumGrid, COVER_IMAGE_ROOT_MARGIN, CoverImage } from './cards';
import { MEDIA_VARIANT } from '@ekum/domain-types';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  rootMargin = '';
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? '';
    FakeIntersectionObserver.instances.push(this);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
  root = null;
  thresholds: number[] = [];
}

describe('CoverImage easy load', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not request the image until near the viewport', async () => {
    render(<AlbumGrid images={['https://media.test/pack.jpg']} imageCount={1} alt="Wedding" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(FakeIntersectionObserver.instances[0]!.rootMargin).toBe(COVER_IMAGE_ROOT_MARGIN);
    expect(COVER_IMAGE_ROOT_MARGIN).toBe('600px 0px');

    const io = FakeIntersectionObserver.instances[0]!;
    const target = io.observe.mock.calls[0]?.[0] as Element;
    act(() => {
      io.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        io as unknown as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://media.test/pack.jpg');
    });
    expect(screen.getByRole('img')).toHaveAttribute('decoding', 'async');
  });

  it('requests thumbnail2 for managed catalog photos', async () => {
    render(
      <AlbumGrid
        images={['http://localhost:3000/media/c1/pack.jpg']}
        imageCount={1}
        alt="Wedding"
        priority
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'http://localhost:3000/media/c1/thumbnail2/pack.webp',
    );
  });
});

describe('CoverImage which variant', () => {
  afterEach(() => cleanup());

  it('defaults to thumbnail2 for Explore / feed cards', () => {
    render(
      <CoverImage src="http://localhost:3000/media/c1/original/a.jpg" alt="Feed" priority />,
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'http://localhost:3000/media/c1/thumbnail2/a.webp',
    );
  });

  it('uses thumbnail1 when a list row asks for card size', () => {
    render(
      <CoverImage
        src="http://localhost:3000/media/c1/original/a.jpg"
        alt="Row"
        priority
        variant={MEDIA_VARIANT.Thumbnail1}
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'http://localhost:3000/media/c1/thumbnail1/a.webp',
    );
  });
});
