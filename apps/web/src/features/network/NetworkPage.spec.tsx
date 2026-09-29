import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NetworkPage } from './NetworkPage';

const presence = { selling: false, canPublish: false };

vi.mock('@/lib/tradePresence', () => ({
  useTradePresence: () => presence,
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NetworkPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function linkHrefs() {
  return screen.getAllByRole('link').map((link) => link.getAttribute('href'));
}

describe('NetworkPage', () => {
  it('lists I see theirs and They see mine, not Following / Followers', () => {
    presence.selling = false;
    presence.canPublish = false;
    renderPage();
    expect(screen.getByRole('link', { name: /I see theirs/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /They see mine/ })).toBeInTheDocument();
    expect(screen.getByText('Businesses whose collections you can see')).toBeInTheDocument();
    expect(screen.getByText('Businesses you let see your collections')).toBeInTheDocument();
    expect(screen.queryByText('Following')).toBeNull();
    expect(screen.queryByText('Followers')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Requests' })).toBeNull();
    expect(
      screen.queryByText(/Who you trade with, who sees collections/),
    ).toBeNull();
    expect(linkHrefs()).toEqual([
      '/network/following',
      '/network/followers',
      '/network/connections',
      '/referrals',
    ]);
  });

  it('puts Buyer groups after They see mine when you publish', () => {
    presence.selling = true;
    presence.canPublish = true;
    renderPage();
    expect(linkHrefs()).toEqual([
      '/network/following',
      '/network/followers',
      '/broadcast',
      '/network/connections',
      '/referrals',
    ]);
  });
});
