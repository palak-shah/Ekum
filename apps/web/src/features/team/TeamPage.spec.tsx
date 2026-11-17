import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TeamPage } from './TeamPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

afterEach(() => cleanup());

describe('TeamPage invite query', () => {
  it('opens Invite staff when landed with invite=1', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/companies/me') {
        return {
          id: 'shop',
          name: 'Jaipur Emporium',
          city: 'Jaipur',
          role: 'owner',
          permissions: {
            uploads: true,
            chats: true,
            orders: true,
            payments: true,
            team: true,
          },
        };
      }
      if (path === '/team/members') {
        return [
          {
            userId: 'meena',
            name: 'Meena',
            phoneMasked: '98******01',
            role: 'owner',
            permissions: {
              uploads: true,
              chats: true,
              orders: true,
              payments: true,
              team: true,
            },
            contactRole: null,
          },
        ];
      }
      return [];
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/team?invite=1']}>
          <Routes>
            <Route path="/team" element={<TeamPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Invite staff' })).toBeInTheDocument();
  });
});
