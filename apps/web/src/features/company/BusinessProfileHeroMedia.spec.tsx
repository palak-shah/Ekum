import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessProfileHeroMedia } from './BusinessProfileHeroMedia';
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

function renderHero(
  props: Partial<{
    logoUrl: string | null;
    coverUrl: string | null;
    canEdit: boolean;
    showcaseCount: number;
  }> = {},
) {
  const onOpenCoverGallery = vi.fn();
  const onOpenShowcase = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <BusinessProfileHeroMedia
        companyId="seed-company-meena"
        name="Jaipur Emporium"
        logoUrl={props.logoUrl ?? null}
        coverUrl={props.coverUrl ?? null}
        canEdit={props.canEdit ?? true}
        onOpenCoverGallery={onOpenCoverGallery}
        onOpenShowcase={onOpenShowcase}
        showcaseCount={props.showcaseCount ?? 0}
        identity={<p data-testid="hero-identity">Jaipur Emporium</p>}
      />
    </QueryClientProvider>,
  );
  return { onOpenCoverGallery, onOpenShowcase };
}

describe('BusinessProfileHeroMedia', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.mocked(api.patch).mockResolvedValue({
      id: 'seed-company-meena',
      logoUrl: null,
      coverUrl: null,
    });
    vi.mocked(uploadImage).mockResolvedValue('https://cdn/new.jpg');
  });

  it('centres avatar overlapping cover with identity under it', () => {
    renderHero({ coverUrl: 'https://cdn/cover.jpg', logoUrl: null });
    const hero = screen.getByTestId('business-profile-hero');
    const avatarBlock = screen.getByTestId('business-profile-avatar-block');
    const identity = screen.getByTestId('business-profile-identity');
    expect(hero).toContainElement(screen.getByTestId('business-profile-cover-shell'));
    expect(hero).toContainElement(avatarBlock);
    expect(avatarBlock).toContainElement(identity);
    expect(avatarBlock.className).toMatch(/-mt-11/);
    expect(avatarBlock.className).toMatch(/items-center/);
    expect(identity.className).toMatch(/text-center/);
    expect(screen.getByTestId('hero-identity')).toBeInTheDocument();
  });

  it('uses a quieter empty Add cover shell (no corner camera)', () => {
    renderHero({ coverUrl: null, logoUrl: null });
    expect(screen.getByTestId('business-profile-add-cover')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-cover-shell').className).toMatch(/aspect-\[3\.2\/1\]/);
    expect(screen.queryByTestId('business-profile-cover-camera')).toBeNull();
    expect(screen.getByTestId('business-profile-avatar-camera')).toBeInTheDocument();
  });

  it('shows corner camera when cover exists', () => {
    renderHero({ coverUrl: 'https://cdn/cover.jpg', logoUrl: null });
    expect(screen.getByTestId('business-profile-cover-camera')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-add-cover')).toBeNull();
  });

  it('view-only shop has cover tap but no cameras', async () => {
    const user = userEvent.setup();
    const { onOpenCoverGallery } = renderHero({
      canEdit: false,
      coverUrl: 'https://cdn/cover.jpg',
      logoUrl: 'https://cdn/logo.jpg',
    });
    expect(screen.queryByTestId('business-profile-cover-camera')).toBeNull();
    expect(screen.queryByTestId('business-profile-avatar-camera')).toBeNull();
    expect(screen.queryByTestId('business-profile-add-cover')).toBeNull();
    await user.click(screen.getByTestId('business-profile-cover'));
    expect(onOpenCoverGallery).toHaveBeenCalledTimes(1);
  });

  it('cover image opens gallery; cover camera does not', async () => {
    const user = userEvent.setup();
    const { onOpenCoverGallery } = renderHero({
      coverUrl: 'https://cdn/cover.jpg',
      logoUrl: null,
    });
    await user.click(screen.getByTestId('business-profile-cover-camera'));
    expect(onOpenCoverGallery).not.toHaveBeenCalled();
    expect(screen.getByTestId('business-profile-cover-menu')).toBeInTheDocument();
    await user.click(screen.getByTestId('business-profile-cover'));
    expect(onOpenCoverGallery).toHaveBeenCalledTimes(1);
  });

  it('shows View Showcase when showcase has photos; Add Showcase when owner empty', () => {
    renderHero({ coverUrl: 'https://cdn/cover.jpg', showcaseCount: 0, canEdit: false });
    expect(screen.queryByTestId('business-profile-view-showcase')).toBeNull();
    cleanup();
    renderHero({ coverUrl: 'https://cdn/cover.jpg', showcaseCount: 0, canEdit: true });
    expect(screen.getByTestId('business-profile-view-showcase')).toHaveTextContent(
      'Add Showcase ›',
    );
    cleanup();
    renderHero({ coverUrl: 'https://cdn/cover.jpg', showcaseCount: 3 });
    expect(screen.getByTestId('business-profile-view-showcase')).toHaveTextContent(
      'View Showcase · 3',
    );
    cleanup();
    renderHero({ coverUrl: null, showcaseCount: 2, canEdit: true });
    expect(screen.getByTestId('business-profile-cover-shell')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-add-cover')).toBeInTheDocument();
    expect(screen.getByTestId('business-profile-view-showcase')).toHaveTextContent(
      'View Showcase · 2',
    );
    cleanup();
    renderHero({ coverUrl: null, showcaseCount: 2, canEdit: false });
    expect(screen.getByTestId('business-profile-cover-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('business-profile-add-cover')).toBeNull();
    expect(screen.getByTestId('business-profile-view-showcase')).toHaveTextContent(
      'View Showcase · 2',
    );
  });

  it('visitor with Showcase and no cover can open View Showcase', async () => {
    const user = userEvent.setup();
    const { onOpenShowcase, onOpenCoverGallery } = renderHero({
      coverUrl: null,
      showcaseCount: 1,
      canEdit: false,
    });
    expect(screen.getByTestId('business-profile-view-showcase')).toHaveTextContent(
      'View Showcase ›',
    );
    await user.click(screen.getByTestId('business-profile-view-showcase'));
    expect(onOpenShowcase).toHaveBeenCalledTimes(1);
    expect(onOpenCoverGallery).not.toHaveBeenCalled();
  });

  it('View Showcase opens showcase gallery; does not open cover gallery', async () => {
    const user = userEvent.setup();
    const { onOpenCoverGallery, onOpenShowcase } = renderHero({
      coverUrl: 'https://cdn/cover.jpg',
      showcaseCount: 2,
    });
    await user.click(screen.getByTestId('business-profile-view-showcase'));
    expect(onOpenShowcase).toHaveBeenCalledTimes(1);
    expect(onOpenCoverGallery).not.toHaveBeenCalled();
  });

  it('uploads cover via Add cover without patching logo', async () => {
    const user = userEvent.setup();
    renderHero({ coverUrl: null, logoUrl: 'https://cdn/logo.jpg' });
    const input = screen.getByTestId('business-profile-cover-input');
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' });
    await user.upload(input, file);
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        coverUrl: 'https://cdn/new.jpg',
      }),
    );
    expect(api.patch).not.toHaveBeenCalledWith(
      '/companies/me',
      expect.objectContaining({ logoUrl: expect.anything() }),
    );
  });

  it('uploads avatar without patching cover', async () => {
    const user = userEvent.setup();
    renderHero({ coverUrl: 'https://cdn/cover.jpg', logoUrl: null });
    const input = screen.getByTestId('business-profile-avatar-input');
    const file = new File(['x'], 'logo.jpg', { type: 'image/jpeg' });
    await user.upload(input, file);
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        logoUrl: 'https://cdn/new.jpg',
      }),
    );
    expect(api.patch).not.toHaveBeenCalledWith(
      '/companies/me',
      expect.objectContaining({ coverUrl: expect.anything() }),
    );
  });

  it('removes cover without sending showcase or logo', async () => {
    const user = userEvent.setup();
    renderHero({ coverUrl: 'https://cdn/cover.jpg', logoUrl: 'https://cdn/logo.jpg' });
    await user.click(screen.getByTestId('business-profile-cover-camera'));
    await user.click(screen.getByTestId('business-profile-cover-remove'));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', { coverUrl: null }),
    );
  });

  it('removes avatar (initials path) without sending cover', async () => {
    const user = userEvent.setup();
    renderHero({ coverUrl: 'https://cdn/cover.jpg', logoUrl: 'https://cdn/logo.jpg' });
    await user.click(screen.getByTestId('business-profile-avatar-camera'));
    await user.click(screen.getByTestId('business-profile-avatar-remove'));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', { logoUrl: null }),
    );
  });
});
