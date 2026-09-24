import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FollowersPage } from './FollowersPage';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderPage(path = '/network/followers?tab=asked') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/network/followers" element={<FollowersPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FollowersPage inbox', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/follows/asks') {
        return [
          {
            company: {
              id: 'c-ask',
              name: 'Ahmedabad Loom Co',
              city: 'Ahmedabad',
              logoUrl: null,
              verification: 'none',
            },
            createdAt: '2026-09-24T00:00:00.000Z',
          },
        ];
      }
      if (path === '/follows/followers') return [];
      return [];
    });
  });

  it('shows Look through / Put in a pack / Deny on asked rows', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: 'Look through' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Look through' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Put in a pack' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
  });
});
