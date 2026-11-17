import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProfileVisibility, type OwnCompanyProfile } from '@ekum/domain-types';
import {
  invalidateProfileVisibilityCaches,
  ProfileVisibilityPage,
} from './ProfileVisibilityPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/auth', () => ({
  useCompanyId: () => 'seed-company-meena',
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const baseCompany: OwnCompanyProfile = {
  id: 'seed-company-meena',
  name: 'Jaipur Emporium',
  city: 'Jaipur',
  about: null,
  logoUrl: null,
  coverUrl: null,
  showcaseUrls: [],
  profileVisibility: ProfileVisibility.Public,
  profileAccess: true,
  verification: 'not_verified',
  categories: [],
  superCategories: [],
  masterCategories: [],
  gstNumber: null,
  sellCategories: [],
  buyCategories: [],
  contactPerson: null,
  contactPhone: null,
  showContactPhone: false,
};

function renderPage(company: OwnCompanyProfile = baseCompany) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(api.get).mockImplementation(async (path: string) => {
    if (path === '/companies/me') return company;
    return company;
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProfileVisibilityPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

describe('ProfileVisibilityPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.mocked(api.patch).mockResolvedValue({
      ...baseCompany,
      profileVisibility: ProfileVisibility.Private,
    });
  });

  it('shows saved Public as current', async () => {
    renderPage({ ...baseCompany, profileVisibility: ProfileVisibility.Public });
    expect(await screen.findByTestId('profile-visibility-public')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByTestId('profile-visibility-current')).toBeInTheDocument();
    expect(screen.getByTestId('profile-visibility-private')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('persists Private through PATCH and keeps Public until success', async () => {
    const user = userEvent.setup();
    let resolvePatch!: (value: OwnCompanyProfile) => void;
    vi.mocked(api.patch).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        }),
    );
    renderPage({ ...baseCompany, profileVisibility: ProfileVisibility.Public });
    await screen.findByTestId('profile-visibility-public');
    await user.click(screen.getByTestId('profile-visibility-private'));
    expect(screen.getByTestId('profile-visibility-saving')).toBeInTheDocument();
    expect(screen.getByTestId('profile-visibility-public')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByTestId('profile-visibility-public')).toBeDisabled();
    expect(screen.getByTestId('profile-visibility-private')).toBeDisabled();
    const next = { ...baseCompany, profileVisibility: ProfileVisibility.Private };
    vi.mocked(api.get).mockResolvedValue(next);
    resolvePatch(next);
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        profileVisibility: ProfileVisibility.Private,
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('profile-visibility-private')).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
  });

  it('restores Public after Private', async () => {
    const user = userEvent.setup();
    vi.mocked(api.patch).mockResolvedValue({
      ...baseCompany,
      profileVisibility: ProfileVisibility.Public,
    });
    renderPage({ ...baseCompany, profileVisibility: ProfileVisibility.Private });
    await screen.findByTestId('profile-visibility-private');
    await user.click(screen.getByTestId('profile-visibility-public'));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        profileVisibility: ProfileVisibility.Public,
      }),
    );
  });

  it('keeps previous selection when PATCH fails', async () => {
    const user = userEvent.setup();
    vi.mocked(api.patch).mockRejectedValue(new Error('fail'));
    renderPage({ ...baseCompany, profileVisibility: ProfileVisibility.Public });
    await screen.findByTestId('profile-visibility-public');
    await user.click(screen.getByTestId('profile-visibility-private'));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(screen.getByTestId('profile-visibility-public')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByTestId('profile-visibility-private')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});

describe('invalidateProfileVisibilityCaches', () => {
  it('invalidates company me/id, explore, and search', () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');
    invalidateProfileVisibilityCaches(client, 'c1');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['company', 'me'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['company', 'c1'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['explore'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['search'] });
  });
});
