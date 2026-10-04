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

  it('shows see-collections checkbox plus Allow / Decline on asked rows', async () => {
    renderPage('/network/followers');
    expect(await screen.findByRole('heading', { name: 'They see mine' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Asked' })).toBeNull();
    expect(await screen.findByTestId('follow-ask-row')).toBeInTheDocument();
    expect(screen.getByTestId('follow-ask-why')).toHaveTextContent(
      'Wants to see your new packs',
    );
    expect(
      await screen.findByRole('checkbox', { name: 'They can see my collections' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('checkbox', { name: 'They can share my collections' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByTestId('they-see-mine-asked')).toHaveTextContent('Asked · 1');
  });

  it('shows see and share checks on Seeing packs, without Change', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/follows/asks') return [];
      if (path === '/follows/followers') {
        return [
          {
            company: {
              id: 'c-see',
              name: 'Surat Silk House',
              city: 'Surat',
              logoUrl: null,
              verification: 'none',
            },
            accessKind: 'look',
            createdAt: '2026-09-28T00:00:00.000Z',
          },
        ];
      }
      return [];
    });
    renderPage('/network/followers?tab=following');
    expect(await screen.findByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.getByText('Surat')).toBeInTheDocument();
    expect(screen.queryByText(/They can see$/)).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'They can see my collections' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('checkbox', { name: 'They can see my collections' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('checkbox', { name: 'They can share my collections' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Stop them seeing' })).toBeInTheDocument();
    expect(screen.getByTestId('they-see-mine-search')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Seeing packs/ })).toBeNull();
  });

  it('keeps a stopped business on the list', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/follows/asks') return [];
      if (path === '/follows/followers') {
        return [
          {
            company: {
              id: 'c-stop',
              name: 'Surat Silk House',
              city: 'Surat',
              logoUrl: null,
              verification: 'none',
            },
            accessKind: 'look',
            stopped: true,
            createdAt: '2026-09-28T00:00:00.000Z',
          },
        ];
      }
      return [];
    });
    renderPage('/network/followers');
    expect(await screen.findByText('Surat Silk House')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'They can see my collections' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Stop them seeing' })).toBeNull();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('keeps asks on top of the same list, not a tap-through', async () => {
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
      if (path === '/follows/followers') {
        return [
          {
            company: {
              id: 'c-see',
              name: 'Surat Silk House',
              city: 'Surat',
              logoUrl: null,
              verification: 'none',
            },
            accessKind: 'look',
            createdAt: '2026-09-28T00:00:00.000Z',
          },
        ];
      }
      return [];
    });
    renderPage('/network/followers');
    expect(await screen.findByRole('heading', { name: 'They see mine' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Asked' })).toBeNull();
    expect(await screen.findByRole('button', { name: 'Allow' })).toBeInTheDocument();
    expect(screen.getByText('Surat Silk House')).toBeInTheDocument();
    const ask = screen.getByTestId('follow-ask-row');
    const seeing = screen.getByTestId('follow-allowed-row-c-see');
    expect(ask.compareDocumentPosition(seeing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
