import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniversalShareSheet } from './UniversalShareSheet';
import { api } from '@/lib/apiClient';
import type { ConnectionView } from '@ekum/domain-types';

vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/apiClient')>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/shareInvite', () => ({
  canNativeShare: () => false,
  catalogShareCopy: () => ({ title: 't', text: 'x' }),
  companyShareCopy: () => ({ title: 'Shop', text: 'See Surat Silk House on Ekum' }),
  shareMessageText: (text: string, url: string) => `${text}\n${url}`,
  shareOrCopyInvite: vi.fn().mockResolvedValue('copied'),
}));

const jaipur: ConnectionView = {
  id: 'conn-1',
  status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z',
  canPause: true,
  canResume: false,
  canBlock: true,
  canUnblock: false,
  company: {
    id: 'c1',
    name: 'Jaipur Emporium',
    city: 'Jaipur',
    verification: 'none',
    logoUrl: null,
  },
};

function renderUniversal(payload: Parameters<typeof UniversalShareSheet>[0]['payload']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(api.get).mockImplementation(async (path: string) => {
    if (path === '/connections') return [jaipur] as never;
    if (path === '/broadcasts/lists') return [] as never;
    if (path === '/access-requests/outgoing') return [] as never;
    if (path === '/settings') {
      return { tradeDefaults: { orderPathPreference: 'direct' } } as never;
    }
    throw new Error(`unexpected get ${path}`);
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UniversalShareSheet open onClose={() => {}} payload={payload} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UniversalShareSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens content-hugging sheet with quiet Create group and louder Send than native', async () => {
    renderUniversal({
      kind: 'catalog',
      collections: [{ collectionId: 'col1', name: 'Monsoon' }],
    });

    await waitFor(() => {
      expect(screen.getByText('Jaipur Emporium')).toBeInTheDocument();
    });
    // Find is a link after typing — not a second idle Find field.
    expect(screen.queryByLabelText('Find on Ekum')).toBeNull();

    const create = screen.getByTestId('share-create-group');
    expect(create.className).toMatch(/text-xs/);
    expect(create.className).toMatch(/text-accent/);
    expect(create.className).not.toMatch(/bg-accent/);

    const send = screen.getByTestId('catalog-share-send');
    const native = screen.getByTestId('catalog-share-link');
    // No recipients yet — Send sits quiet (line wash), not solid accent.
    expect(send.className).toMatch(/bg-line/);
    expect(send.className).not.toMatch(/bg-accent/);
    expect(native.className).not.toMatch(/bg-accent/);
    expect(screen.getByTestId('share-composer-text').closest('div')?.className).toMatch(
      /bg-foam/,
    );

    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Jaipur Emporium/i }));
    expect(screen.getByTestId('catalog-share-send').className).toMatch(/bg-accent/);

    // One sheet scroll (no nested list scroller); composer in footer; hugs content.
    expect(screen.getByTestId('share-recipient-scroll').className).not.toMatch(/overflow-y-auto/);
    expect(screen.getByTestId('share-composer-band')).toContainElement(
      screen.getByTestId('share-composer'),
    );
    expect(screen.queryByTestId('sheet-full-scroll')).toBeNull();
  });

  it('company payload keeps native share without recipients', async () => {
    renderUniversal({
      kind: 'company',
      companyId: 'me',
      companyName: 'Surat Silk House',
    });

    await waitFor(() => {
      expect(screen.getByText('Jaipur Emporium')).toBeInTheDocument();
    });
    expect(screen.getByTestId('company-share-send')).toBeDisabled();
    expect(screen.getByTestId('company-share-outside')).toBeEnabled();
    expect(screen.getByTestId('share-create-group')).toBeInTheDocument();
  });
});
