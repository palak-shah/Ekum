import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileVisibility, type OwnCompanyProfile } from '@ekum/domain-types';
import { ProfilePage } from './ProfilePage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ session: { user: { isPlatformAdmin: false } } }),
  useCompanyId: () => 'seed-company-meena',
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const company: OwnCompanyProfile = {
  id: 'seed-company-meena',
  name: 'Jaipur Emporium',
  city: 'Jaipur',
  about: 'Textiles',
  logoUrl: null,
  coverUrl: null,
  showcaseUrls: [],
  profileVisibility: ProfileVisibility.Public,
  profileAccess: true,
  verification: 'not_verified',
  categories: ['Silk'],
  superCategories: [],
  masterCategories: ['womens_apparel'],
  gstNumber: null,
  sellCategories: ['sarees'],
  buyCategories: [],
  contactPerson: 'Meena',
  contactPhone: null,
  showContactPhone: false,
  capabilities: { publish: true, relist: false, refer: true },
  tradePresence: { buying: true, selling: true, trading: false },
  role: 'owner',
  permissions: {
    uploads: true,
    chats: true,
    orders: true,
    payments: true,
    team: true,
  },
  workingHours: {
    opensAt: '10:30',
    closesAt: '19:30',
    weeklyOff: 'sun',
  },
  shopAddress: {
    unit: 'Shop 12',
    street: 'MI Road',
    area: 'Bapu Bazaar',
    pincode: '302001',
  },
  websiteUrl: 'https://jaipur.example/',
};

function renderEdit() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/settings/profile?edit=1']}>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProfilePage business information', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/me') return company;
      if (path === '/catalog/master-categories') return [];
      return [];
    });
    vi.mocked(api.patch).mockClear();
    vi.mocked(api.patch).mockResolvedValue(company);
  });

  it('loads hours, address and website and saves them with other fields', async () => {
    const user = userEvent.setup();
    renderEdit();
    expect(await screen.findByTestId('profile-opens-at')).toHaveAttribute(
      'data-value',
      '10:30',
    );
    expect(screen.getByTestId('profile-opens-at-hour')).toHaveValue('10');
    expect(screen.getByTestId('profile-opens-at-minute')).toHaveValue('30');
    expect(screen.getByTestId('profile-opens-at-meridiem')).toHaveValue('AM');
    expect(screen.getByTestId('profile-closes-at')).toHaveAttribute('data-value', '19:30');
    expect(screen.getByTestId('profile-closes-at-hour')).toHaveValue('7');
    expect(screen.getByTestId('profile-closes-at-meridiem')).toHaveValue('PM');
    expect(screen.getByTestId('profile-weekly-off-sun')).toBeInTheDocument();
    expect(screen.getByTestId('profile-address-unit')).toHaveValue('Shop 12');
    expect(screen.getByTestId('profile-website')).toHaveValue('https://jaipur.example/');
    await user.click(screen.getByTestId('profile-update'));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith(
      '/companies/me',
      expect.objectContaining({
        name: 'Jaipur Emporium',
        city: 'Jaipur',
        workingHours: { opensAt: '10:30', closesAt: '19:30', weeklyOff: 'sun' },
        shopAddress: {
          unit: 'Shop 12',
          street: 'MI Road',
          area: 'Bapu Bazaar',
          pincode: '302001',
        },
        websiteUrl: 'https://jaipur.example/',
      }),
    );
  });

  it('picks 10 AM and 7 PM and stores HH:mm 24h', async () => {
    const user = userEvent.setup();
    renderEdit();
    await screen.findByTestId('profile-opens-at-hour');
    await user.selectOptions(screen.getByTestId('profile-opens-at-hour'), '10');
    await user.selectOptions(screen.getByTestId('profile-opens-at-minute'), '0');
    await user.selectOptions(screen.getByTestId('profile-opens-at-meridiem'), 'AM');
    await user.selectOptions(screen.getByTestId('profile-closes-at-hour'), '7');
    await user.selectOptions(screen.getByTestId('profile-closes-at-minute'), '0');
    await user.selectOptions(screen.getByTestId('profile-closes-at-meridiem'), 'PM');
    expect(screen.getByTestId('profile-opens-at')).toHaveAttribute('data-value', '10:00');
    expect(screen.getByTestId('profile-closes-at')).toHaveAttribute('data-value', '19:00');
    await user.click(screen.getByTestId('profile-update'));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith(
      '/companies/me',
      expect.objectContaining({
        workingHours: { opensAt: '10:00', closesAt: '19:00', weeklyOff: 'sun' },
      }),
    );
  });

  it('blocks save when closing is before opening', async () => {
    const user = userEvent.setup();
    renderEdit();
    await screen.findByTestId('profile-opens-at-hour');
    await user.selectOptions(screen.getByTestId('profile-opens-at-hour'), '10');
    await user.selectOptions(screen.getByTestId('profile-opens-at-minute'), '0');
    await user.selectOptions(screen.getByTestId('profile-opens-at-meridiem'), 'AM');
    await user.selectOptions(screen.getByTestId('profile-closes-at-hour'), '9');
    await user.selectOptions(screen.getByTestId('profile-closes-at-minute'), '0');
    await user.selectOptions(screen.getByTestId('profile-closes-at-meridiem'), 'AM');
    expect(screen.getByText('Closing time must be after opening time.')).toBeInTheDocument();
    await user.click(screen.getByTestId('profile-update'));
    await waitFor(() =>
      expect(screen.getByText('Closing time must be after opening time.')).toBeInTheDocument(),
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('clears hours as a group', async () => {
    const user = userEvent.setup();
    renderEdit();
    await screen.findByTestId('profile-clear-hours');
    await user.click(screen.getByTestId('profile-clear-hours'));
    await user.click(screen.getByTestId('profile-update'));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith(
      '/companies/me',
      expect.objectContaining({
        workingHours: null,
        shopAddress: expect.objectContaining({ unit: 'Shop 12' }),
      }),
    );
  });
});
