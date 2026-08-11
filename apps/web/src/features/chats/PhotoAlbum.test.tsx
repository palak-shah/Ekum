import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotoAlbum } from './PhotoAlbum';

describe('PhotoAlbum overflow (BM-01)', () => {
  it('shows +1 on last cell for 2 thumbs when overflowCount is 1', () => {
    render(
      <PhotoAlbum
        urls={['https://example.com/a.jpg', 'https://example.com/b.jpg']}
        overflowCount={1}
      />,
    );
    expect(screen.getByTestId('photo-album-overflow')).toHaveTextContent('+1');
  });

  it('shows +1 on single thumb when overflowCount is 1', () => {
    render(
      <PhotoAlbum urls={['https://example.com/a.jpg']} overflowCount={1} />,
    );
    expect(screen.getByTestId('photo-album-overflow')).toHaveTextContent('+1');
  });

  it('combines urls beyond 4 with overflowCount', () => {
    const urls = [1, 2, 3, 4, 5].map((n) => `https://example.com/${n}.jpg`);
    render(<PhotoAlbum urls={urls} overflowCount={2} />);
    // 1 url beyond preview + overflowCount 2 => +3
    expect(screen.getByTestId('photo-album-overflow')).toHaveTextContent('+3');
  });

  it('hides overflow when none', () => {
    render(
      <PhotoAlbum urls={['https://example.com/a.jpg', 'https://example.com/b.jpg']} />,
    );
    expect(screen.queryByTestId('photo-album-overflow')).toBeNull();
  });
});
