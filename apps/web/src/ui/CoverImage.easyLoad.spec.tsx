import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AlbumGrid } from './cards';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
  root = null;
  rootMargin = '';
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
});
