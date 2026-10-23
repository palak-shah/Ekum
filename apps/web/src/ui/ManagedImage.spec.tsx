import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MEDIA_VARIANT } from '@ekum/domain-types';
import { ManagedImage } from './ManagedImage';

afterEach(() => cleanup());

describe('ManagedImage', () => {
  it('requests thumbnail1 then falls back to the original once', () => {
    render(
      <ManagedImage
        src="http://localhost:3000/media/c1/a.jpg"
        alt="Floral"
        variant={MEDIA_VARIANT.Thumbnail1}
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'http://localhost:3000/media/c1/thumbnail1/a.webp');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', 'http://localhost:3000/media/c1/a.jpg');
  });

  it('falls back to the stored original when thumbnail2 is missing', () => {
    render(
      <ManagedImage
        src="http://localhost:3000/media/c1/original/saree.jpg"
        alt="Banarasi"
        variant={MEDIA_VARIANT.Thumbnail2}
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      'http://localhost:3000/media/c1/thumbnail2/saree.webp',
    );
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', 'http://localhost:3000/media/c1/original/saree.jpg');
  });

  it('does not loop when the original also fails', () => {
    const onError = vi.fn();
    const { container } = render(
      <ManagedImage
        src="http://localhost:3000/media/c1/a.jpg"
        alt=""
        variant={MEDIA_VARIANT.Thumbnail1}
        onError={onError}
      />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    fireEvent.error(img!);
    fireEvent.error(img!);
    expect(img).toHaveAttribute('src', 'http://localhost:3000/media/c1/a.jpg');
    expect(onError).toHaveBeenCalledOnce();
  });
});
