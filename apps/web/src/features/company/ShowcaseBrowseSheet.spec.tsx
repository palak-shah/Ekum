import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowcaseBrowseSheet } from './ShowcaseBrowseSheet';
import { api } from '@/lib/apiClient';
import { uploadImage } from '@/lib/mediaUpload';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), post: vi.fn(), del: vi.fn(), patch: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/mediaUpload', () => ({
  uploadImage: vi.fn(),
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderBrowse(urls: string[], canEdit = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenPhoto = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <ShowcaseBrowseSheet
        open
        onClose={vi.fn()}
        urls={urls}
        onOpenPhoto={onOpenPhoto}
        companyId="seed-company-meena"
        canEdit={canEdit}
      />
    </QueryClientProvider>,
  );
  return { onOpenPhoto };
}

describe('ShowcaseBrowseSheet owner Add/remove', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.mocked(api.patch).mockResolvedValue({
      id: 'seed-company-meena',
      showcaseUrls: [],
    });
    vi.mocked(uploadImage).mockResolvedValue('https://cdn/new.jpg');
  });

  it('owner empty: Add; no Manage; visitor has no Add', () => {
    renderBrowse([]);
    expect(screen.getByTestId('showcase-add')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('showcase-manage')).toBeNull();
    cleanup();
    renderBrowse([], false);
    expect(screen.queryByTestId('showcase-add')).toBeNull();
  });

  it('tile tap opens photo; × removes without opening viewer', async () => {
    const user = userEvent.setup();
    const { onOpenPhoto } = renderBrowse(['https://cdn/s1.jpg', 'https://cdn/s2.jpg']);
    expect(screen.queryByTestId('showcase-manage')).toBeNull();
    await user.click(screen.getByTestId('showcase-browse-photo-0'));
    expect(onOpenPhoto).toHaveBeenCalledWith(0);
    onOpenPhoto.mockClear();
    await user.click(screen.getByTestId('showcase-remove-0'));
    expect(onOpenPhoto).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        showcaseUrls: ['https://cdn/s2.jpg'],
      }),
    );
  });

  it('uploads successful files only on partial failure', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadImage)
      .mockResolvedValueOnce('https://cdn/ok.jpg')
      .mockRejectedValueOnce(new Error('fail'));
    renderBrowse([]);
    await user.click(screen.getByTestId('showcase-add'));
    await user.click(screen.getByTestId('showcase-add-upload'));
    const input = screen.getByTestId('showcase-upload-input');
    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ];
    await user.upload(input, files);
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        showcaseUrls: ['https://cdn/ok.jpg'],
      }),
    );
  });

  it('disables Add at max 10', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `https://cdn/${i}.jpg`);
    renderBrowse(ten);
    expect(screen.getByTestId('showcase-add')).toBeDisabled();
  });

  it('defaults to grid and toggles to feed', async () => {
    const user = userEvent.setup();
    renderBrowse(['https://cdn/a.jpg', 'https://cdn/b.jpg']);
    expect(screen.getByTestId('showcase-browse-grid')).toBeInTheDocument();
    await user.click(screen.getByTestId('showcase-browse-layout'));
    expect(screen.getByTestId('showcase-browse-feed')).toBeInTheDocument();
  });
});
