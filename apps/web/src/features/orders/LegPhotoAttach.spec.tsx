import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LegPhotoAttach, LegPhotoThumbs } from '@/features/orders/LegPhotoAttach';

vi.mock('@/lib/mediaUpload', () => ({
  uploadImage: vi.fn(async () => 'https://cdn.example/lr.jpg'),
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/mediaUrl', () => ({
  toAbsoluteMediaUrl: (url: string) => url,
}));

describe('LegPhotoAttach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows image thumbs when urls are attached (BM-11 — not icon-only)', () => {
    render(
      <LegPhotoAttach
        images={['https://cdn.example/a.jpg']}
        onImagesChange={() => undefined}
        testIdPrefix="leg"
      />,
    );
    const thumbs = screen.getByTestId('leg-thumbs');
    expect(thumbs).toBeTruthy();
    const img = thumbs.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://cdn.example/a.jpg');
    expect(screen.getByText(/LR photo/)).toBeTruthy();
    expect(screen.getByText(/· 1/)).toBeTruthy();
  });

  it('adds a thumb after gallery pick', async () => {
    const onImagesChange = vi.fn();
    const { container } = render(
      <LegPhotoAttach images={[]} onImagesChange={onImagesChange} testIdPrefix="leg" />,
    );
    fireEvent.click(screen.getByTestId('leg-plus'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Gallery' }));
    const input = container.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    const file = new File(['x'], 'lr.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onImagesChange).toHaveBeenCalledWith(['https://cdn.example/lr.jpg']);
    });
  });
});

describe('LegPhotoThumbs', () => {
  it('renders nothing when empty', () => {
    const { container } = render(<LegPhotoThumbs images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders images when attached', () => {
    render(<LegPhotoThumbs images={['https://cdn.example/b.jpg']} testId="hist" />);
    const hist = screen.getByTestId('hist');
    expect(hist.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example/b.jpg');
  });
});
