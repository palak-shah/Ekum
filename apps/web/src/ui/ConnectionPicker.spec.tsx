import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { EXPLORE_BUSINESSES_SEARCH_HREF } from '@/features/explore/exploreDiscoveryHref';
import { ConnectionPicker } from './ConnectionPicker';
import type { ConnectionView } from '@ekum/domain-types';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async () => []),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderPicker(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ConnectionPicker empty network', () => {
  it('shows Find on Ekum and Find in Explore when embedded with no connections', () => {
    renderPicker(
        <ConnectionPicker
          mode="single"
          embedded
          connections={[]}
          value={null}
          onChange={() => {}}
          emptyMessage="Connect with a business first — or find one on Ekum."
        />,
    );

    expect(screen.getByTestId('find-on-ekum')).toBeInTheDocument();
    const link = screen.getByTestId('find-in-explore-link');
    expect(link).toHaveAttribute('href', EXPLORE_BUSINESSES_SEARCH_HREF);
    expect(link).toHaveTextContent('Find in Explore');
  });

  it('can hide Find on Ekum', () => {
    renderPicker(
      <ConnectionPicker
        mode="single"
        embedded
        findOnEkum={false}
        connections={[]}
        value={null}
        onChange={() => {}}
      />,
    );

    expect(screen.queryByTestId('find-on-ekum')).toBeNull();
  });

  it('link mode shows Find on Ekum immediately when there are no connections', () => {
    renderPicker(
      <ConnectionPicker
        mode="multi"
        embedded
        findOnEkum="link"
        connections={[]}
        value={[]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByTestId('find-on-ekum-link')).toBeInTheDocument();
    expect(screen.queryByLabelText('Find on Ekum')).toBeNull();
  });

  it('link mode hides Find on Ekum until the business search has 2+ characters', async () => {
    const user = userEvent.setup();
    const row: ConnectionView = {
      id: 'c1',
      status: 'active',
      createdAt: '2026-01-01',
      canPause: true,
      canResume: false,
      canBlock: true,
      canUnblock: false,
      company: {
        id: 'co-1',
        name: 'Jaipur Emporium',
        city: 'Jaipur',
        verification: 'none',
        logoUrl: null,
      },
    };
    renderPicker(
      <ConnectionPicker
        mode="multi"
        embedded
        findOnEkum="link"
        connections={[row]}
        value={[]}
        onChange={() => {}}
      />,
    );

    expect(screen.queryByTestId('find-on-ekum')).toBeNull();
    await user.type(screen.getByPlaceholderText('Search name or city…'), 'Ja');
    expect(screen.getByTestId('find-on-ekum-link')).toBeInTheDocument();
  });
});
