import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NetworkPage } from './NetworkPage';

const presence = { selling: false, canPublish: false, trading: false };

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
  it('lists Following, Followers, and Connections with locked hints', () => {
    presence.selling = false;
    presence.canPublish = false;
    renderPage();
    expect(screen.getByRole('link', { name: /Following/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Followers/ })).toBeInTheDocument();
    expect(screen.getByText('Businesses you see updates from.')).toBeInTheDocument();
    expect(screen.getByText('Businesses who can see your updates.')).toBeInTheDocument();
    expect(screen.getByText('Businesses you can communicate with.')).toBeInTheDocument();
    expect(screen.queryByText('I see theirs')).toBeNull();
    expect(screen.queryByText('They see mine')).toBeNull();
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

  it('puts Buyer groups after Followers when you publish', () => {
    presence.selling = true;
    presence.canPublish = true;
    presence.trading = false;
    renderPage();
    expect(linkHrefs()).toEqual([
      '/network/following',
      '/network/followers',
      '/broadcast',
      '/network/connections',
      '/referrals',
    ]);
  });

  it('puts Direct links on Network when trading', () => {
    presence.selling = false;
    presence.canPublish = false;
    presence.trading = true;
    renderPage();
    expect(linkHrefs()).toEqual([
      '/network/following',
      '/network/followers',
      '/network/direct-links',
      '/network/connections',
      '/referrals',
    ]);
    expect(screen.getByRole('link', { name: /Direct links/ })).toBeInTheDocument();
    expect(screen.getByText('Supplier and buyer who order together')).toBeInTheDocument();
  });
});
