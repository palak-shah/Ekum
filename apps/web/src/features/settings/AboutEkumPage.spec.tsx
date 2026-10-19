import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AboutEkumPage } from './AboutEkumPage';

const publicGet = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  api: {
    publicGet: (...args: unknown[]) => publicGet(...args),
  },
}));

vi.mock('@/lib/appVersion', async () => {
  const actual = await vi.importActual<typeof import('@/lib/appVersion')>('@/lib/appVersion');
  return {
    ...actual,
    clientAppVersion: () => ({
      version: '0.1.0',
      buildId: 'web-build-1',
      gitSha: 'aaaaaaaaaaaaaaaa',
      builtAt: '2026-10-19T06:00:00.000Z',
      deployment: 'test' as const,
    }),
  };
});

function renderAbout() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AboutEkumPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AboutEkumPage', () => {
  beforeEach(() => {
    publicGet.mockReset();
    publicGet.mockResolvedValue({
      service: 'ekum-api',
      version: '0.1.0',
      buildId: 'api-build-1',
      gitSha: 'bbbbbbbbbbbbbbbb',
      builtAt: '2026-10-19T07:00:00.000Z',
      deployment: 'test',
    });
  });

  it('shows App identity, API identity, and TEST badge', async () => {
    renderAbout();
    expect(screen.getByTestId('about-ekum-test-badge')).toHaveTextContent('TEST · 0.1.0 · aaaaaaa');
    expect(screen.getByTestId('about-ekum-app')).toHaveTextContent('web-build-1');
    await waitFor(() => {
      expect(screen.getByTestId('about-ekum-api')).toHaveTextContent('api-build-1');
    });
    expect(publicGet).toHaveBeenCalledWith('/version');
  });
});
