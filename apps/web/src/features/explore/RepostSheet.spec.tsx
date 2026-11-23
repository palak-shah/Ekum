import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/ui/Toast';
import { api } from '@/lib/apiClient';
import { RepostSheet, type RepostSheetTarget } from './RepostSheet';

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me', capabilities: { publish: true } } }),
}));

const { MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    code?: string;
    details?: unknown;
    constructor(message: string, code?: string, details?: unknown) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }
  return { MockApiError };
});

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            {
              id: 'p1',
              companyId: 'mill',
              audience: 'followers',
              name: 'Silk',
              images: [],
              rate: 100,
              rateMax: null,
              unit: 'pc',
            },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    }),
    post: vi.fn(async () => ({ allowedProductIds: ['p1'], blocked: [] })),
    put: vi.fn(async () => ({})),
    patch: vi.fn(async () => ({})),
    del: vi.fn(async () => ({})),
  },
  ApiError: MockApiError,
}));

function editDetail() {
  return {
    id: 'child-1',
    name: 'My Wedding Edit',
    audience: 'followers',
    rateVisibility: 'on_request',
    audienceCompanyIds: [],
    audienceGroupIds: [],
    allowForward: true,
    allowDownload: false,
    showSourceShops: false,
    rate: null,
    rateMax: null,
    repostPricingMode: null,
    repostMarginValue: null,
    repostEditedRate: null,
    products: [
      {
        id: 'p1',
        companyId: 'mill',
        name: 'Silk',
        images: [],
        excluded: false,
        rate: 100,
        rateMax: null,
        unit: 'pc',
      },
    ],
    memberPricing: [],
  };
}

const target: RepostSheetTarget = {
  kind: 'collection',
  collectionId: 'col-1',
  name: 'Wedding Edit',
  coverImage: 'blob:http://localhost/pack',
};

function tree(next: RepostSheetTarget, client: QueryClient) {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>
          <RepostSheet open onClose={() => undefined} target={next} />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RepostSheet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            { id: 'p1', companyId: 'mill', audience: 'followers', name: 'Silk', images: [] },
          ],
        };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockReset();
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      return { id: 'new-col' };
    });
  });

  it('keeps a typed name when the target object identity changes', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(tree(target, client));
    const name = await screen.findByTestId('repost-name');
    await user.clear(name);
    await user.type(name, 'My Wedding Edit');
    expect(name).toHaveValue('My Wedding Edit');
    rerender(tree({ ...target, coverImage: 'blob:http://localhost/other' }, client));
    expect(screen.getByTestId('repost-name')).toHaveValue('My Wedding Edit');
  });

  it('omits a non-http cover URL on create', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    const publish = await screen.findByTestId('repost-publish');
    await user.click(publish);
    const createCall = vi
      .mocked(api.post)
      .mock.calls.find((call) => call[0] === '/collections');
    expect(createCall?.[1]).not.toHaveProperty('coverImage');
  });

  it('sends an absolute http cover and keeps a typed name after a clash', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      if (path === '/collections') {
        throw new MockApiError('You already have this collection.', 'COLLECTION_NAME_TAKEN');
      }
      return { id: 'new-col' };
    });
    render(
      tree({ ...target, coverImage: 'https://cdn.example/pack.jpg' }, client),
    );
    const name = await screen.findByTestId('repost-name');
    await user.clear(name);
    await user.type(name, 'My Wedding Edit');
    await user.click(screen.getByTestId('repost-publish'));
    expect(await screen.findByText('You already have this collection.')).toBeTruthy();
    expect(screen.getByTestId('repost-name')).toHaveValue('My Wedding Edit');
    const createCalls = vi
      .mocked(api.post)
      .mock.calls.filter((call) => call[0] === '/collections');
    expect(createCalls.at(-1)?.[1]).toMatchObject({
      name: 'My Wedding Edit',
      coverImage: 'https://cdn.example/pack.jpg',
    });
  });

  it('hides Who and Repost when pack preview has no designs', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        return { id: 'col-1', products: [] };
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    expect(await screen.findByTestId('repost-unavailable-summary')).toHaveTextContent(
      'These designs can’t go in a collection yet.',
    );
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('repost-name')).toBeNull();
    expect(screen.queryByText('Who can see this?')).toBeNull();
  });

  it('hides Who and Repost when pack preview fails', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/explore/collections/')) {
        throw new Error('not found');
      }
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load these designs.");
    expect(screen.queryByTestId('repost-publish')).toBeNull();
    expect(screen.queryByTestId('repost-name')).toBeNull();
    expect(screen.queryByText('Who can see this?')).toBeNull();
  });

  it('gates calc behind Show rates; Edit shows design rows', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(tree(target, client));
    expect(await screen.findByTestId('repost-show-rates')).toBeTruthy();
    expect(screen.queryByTestId('repost-pricing')).toBeNull();
    await user.click(screen.getByTestId('repost-rates-on'));
    expect(await screen.findByTestId('repost-pricing-choices')).toBeTruthy();
    expect(screen.queryByTestId('repost-pricing-edit-list')).toBeNull();
    await user.click(screen.getByTestId('repost-pricing-edit'));
    expect(await screen.findByTestId('repost-pricing-edit-list')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-edit-row-p1')).toHaveTextContent('Supplier');
  });

  it('create open upgrades to Edit when repost-of finds an existing child', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/repost-of') return { collectionId: 'child-1' };
      if (path === '/collections/child-1') return editDetail();
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      if (path.startsWith('/explore/collections/')) {
        return {
          id: 'col-1',
          products: [
            {
              id: 'p1',
              companyId: 'mill',
              audience: 'followers',
              name: 'Silk',
              images: [],
              rate: 100,
              rateMax: null,
              unit: 'pc',
            },
          ],
        };
      }
      return {};
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet open onClose={() => undefined} target={target} />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit repost' })).toBeTruthy();
    expect(await screen.findByTestId('repost-publish')).toHaveTextContent('Save');
    expect(screen.getByTestId('repost-edit-rates-cue')).toBeTruthy();
  });

  it('edit without stamp id resolves via repost-of then shows Save', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/repost-of') {
        return { collectionId: 'child-1' };
      }
      if (path === '/collections/child-1') return editDetail();
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      if (path === '/collections') {
        throw new Error('must not create when repost-of resolves');
      }
      return {};
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet open onClose={() => undefined} target={target} editCollectionId={null} />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit repost' })).toBeTruthy();
    expect(await screen.findByTestId('repost-name')).toHaveValue('My Wedding Edit');
    expect(screen.getByTestId('repost-publish')).toHaveTextContent('Save');
    expect(vi.mocked(api.post).mock.calls.some((c) => c[0] === '/collections')).toBe(false);
    expect(
      vi.mocked(api.get).mock.calls.some(
        (c) => c[0] === '/collections/repost-of' && (c[1] as { sourceCollectionId?: string })?.sourceCollectionId === 'col-1',
      ),
    ).toBe(true);
  });

  it('edit without stamp falls back to ALREADY_REPOSTED details when repost-of misses', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/repost-of') {
        throw new MockApiError('No repost of that post yet.', 'NOT_FOUND');
      }
      if (path === '/collections/child-1') return editDetail();
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      if (path === '/collections') {
        throw new MockApiError('You already reposted this.', 'ALREADY_REPOSTED', {
          collectionId: 'child-1',
        });
      }
      return {};
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet open onClose={() => undefined} target={target} editCollectionId={null} />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit repost' })).toBeTruthy();
    expect(await screen.findByTestId('repost-name')).toHaveValue('My Wedding Edit');
    expect(screen.getByTestId('repost-publish')).toHaveTextContent('Save');
  });

  it('edit mode prefills from child pack and Save publishes without create', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/child-1') return editDetail();
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      if (path === '/collections/child-1/publish') return editDetail();
      return { id: 'should-not-create' };
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet
              open
              onClose={() => undefined}
              target={target}
              editCollectionId="child-1"
            />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit repost' })).toBeTruthy();
    expect(await screen.findByTestId('repost-name')).toHaveValue('My Wedding Edit');
    expect(await screen.findByTestId('repost-show-rates')).toBeTruthy();
    expect(screen.getByText('Who can see this?')).toBeTruthy();
    expect(screen.getByTestId('repost-edit-rates-cue')).toHaveTextContent(
      'New rates apply to new orders.',
    );
    await user.click(screen.getByTestId('repost-rates-on'));
    expect(await screen.findByTestId('repost-pricing-choices')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-edit')).toBeTruthy();
    expect(screen.getByTestId('repost-pricing-same')).toBeTruthy();
    await user.click(screen.getByTestId('repost-pricing-edit'));
    expect(await screen.findByTestId('repost-pricing-edit-list')).toBeTruthy();
    // Same keeps Save enabled (Edit without ₹ would disable it).
    await user.click(screen.getByTestId('repost-pricing-same'));
    const save = await screen.findByTestId('repost-publish');
    expect(save).toHaveTextContent('Save');
    expect(screen.queryByTestId('repost-link-48h')).toBeNull();
    await user.click(save);
    expect(vi.mocked(api.post).mock.calls.some((c) => c[0] === '/collections')).toBe(false);
    expect(
      vi.mocked(api.post).mock.calls.some((c) => c[0] === '/collections/child-1/publish'),
    ).toBe(true);
    const orderish = (path: unknown) =>
      typeof path === 'string' && /(^|\/)orders(\/|$)/.test(path);
    expect(vi.mocked(api.post).mock.calls.some((c) => orderish(c[0]))).toBe(false);
    expect(vi.mocked(api.put).mock.calls.some((c) => orderish(c[0]))).toBe(false);
    expect(vi.mocked(api.patch).mock.calls.some((c) => orderish(c[0]))).toBe(false);
  });

  it('editTitle Edit post overrides default Edit repost heading', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/col-own') return { ...editDetail(), id: 'col-own', name: 'My pack' };
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      return {};
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet
              open
              onClose={() => undefined}
              target={{
                kind: 'collection',
                collectionId: 'col-own',
                name: 'My pack',
                coverImage: null,
              }}
              editCollectionId="col-own"
              editTitle="Edit post"
            />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit post' })).toBeTruthy();
    expect(await screen.findByTestId('repost-publish')).toHaveTextContent('Save');
    expect(screen.queryByTestId('repost-remove')).toBeNull();
  });

  it('Edit repost shows Remove repost and confirms via remove-repost API', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/child-1') return editDetail();
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return { allowedProductIds: ['p1'], blocked: [] };
      }
      if (path === '/collections/child-1/remove-repost') {
        return { id: 'child-1', status: 'draft' };
      }
      return {};
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet
              open
              onClose={onClose}
              target={target}
              editCollectionId="child-1"
              editTitle="Edit repost"
            />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('repost-remove')).toBeTruthy();
    await user.click(screen.getByTestId('repost-remove'));
    expect(await screen.findByRole('heading', { name: 'Remove this repost?' })).toBeTruthy();
    await user.click(screen.getByTestId('owner-pack-lifecycle-confirm'));
    expect(
      vi.mocked(api.post).mock.calls.some((c) => c[0] === '/collections/child-1/remove-repost'),
    ).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  function savedEditDetail(overrides: Record<string, unknown> = {}) {
    return {
      ...editDetail(),
      rateVisibility: 'visible',
      repostPricingMode: 'edit',
      repostEditedRate: 125,
      memberPricing: [
        {
          productId: 'p1',
          pricingMode: 'edit',
          marginValue: null,
          editedRate: 125,
          editOwnBase: null,
          hasOverride: true,
        },
      ],
      ...overrides,
    };
  }

  it.each([
    {
      name: 'Edit',
      detail: () => savedEditDetail(),
      expectRatesOn: true,
      assertUi: async () => {
        expect(await screen.findByTestId('repost-pricing-choices')).toBeTruthy();
        expect(await screen.findByTestId('repost-pricing-edit-list')).toBeTruthy();
        expect(screen.getByTestId('repost-pricing-edit-row-p1')).toBeTruthy();
      },
    },
    {
      name: 'Same',
      detail: () =>
        savedEditDetail({
          repostPricingMode: 'same',
          repostEditedRate: null,
          memberPricing: [],
        }),
      expectRatesOn: true,
      assertUi: async () => {
        expect(await screen.findByTestId('repost-pricing-choices')).toBeTruthy();
        expect(screen.getByTestId('repost-pricing-same')).toBeTruthy();
      },
    },
    {
      name: 'fixed margin',
      detail: () =>
        savedEditDetail({
          repostPricingMode: 'margin_fixed',
          repostMarginValue: 20,
          repostEditedRate: 125,
          memberPricing: [],
        }),
      expectRatesOn: true,
      assertUi: async () => {
        expect(await screen.findByTestId('repost-pricing-choices')).toBeTruthy();
        expect(screen.getByTestId('repost-pricing-margin').className).toContain('border-accent');
        expect(screen.getByTestId('repost-pricing-same').className).not.toContain('border-accent');
        expect(screen.getByTestId('repost-pricing-edit').className).not.toContain('border-accent');
        expect(screen.getByTestId('repost-pricing-margin-value')).toHaveValue('20');
        expect(screen.queryByTestId('repost-pricing-edit-list')).toBeNull();
      },
    },
    {
      name: 'percent margin',
      detail: () =>
        savedEditDetail({
          repostPricingMode: 'margin_percent',
          repostMarginValue: 10,
          repostEditedRate: null,
          memberPricing: [],
        }),
      expectRatesOn: true,
      assertUi: async () => {
        expect(await screen.findByTestId('repost-pricing-choices')).toBeTruthy();
        expect(screen.getByTestId('repost-pricing-margin')).toBeTruthy();
      },
    },
    {
      name: 'On Request',
      detail: () =>
        savedEditDetail({
          rateVisibility: 'on_request',
          repostPricingMode: 'edit',
          repostEditedRate: 125,
        }),
      expectRatesOn: false,
      assertUi: async () => {
        expect(screen.queryByTestId('repost-pricing-choices')).toBeNull();
      },
    },
  ])(
    'edit hydrate restores Show rates + $name; no-op Save omits pricing wipe when rates off',
    async ({ detail, expectRatesOn, assertUi, name }) => {
      const user = userEvent.setup();
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const pack = detail();
      vi.mocked(api.get).mockImplementation(async (path: string) => {
        if (path === '/collections/child-1') return pack;
        if (path === '/connections') return [];
        if (path === '/broadcasts/lists') return [];
        if (path === '/settings') return { tradeDefaults: {} };
        if (path === '/collections') return [];
        return {};
      });
      vi.mocked(api.post).mockImplementation(async (path: string) => {
        if (path === '/collections/curate-check') {
          return { allowedProductIds: ['p1'], blocked: [] };
        }
        if (path === '/collections/child-1/publish') return pack;
        return {};
      });
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <ToastProvider>
              <RepostSheet
                open
                onClose={() => undefined}
                target={target}
                editCollectionId="child-1"
              />
            </ToastProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(await screen.findByRole('heading', { name: 'Edit repost' })).toBeTruthy();
      // Wait for edit detail hydrate (heading shows while still “Loading designs…”).
      expect(await screen.findByTestId('repost-show-rates')).toBeTruthy();
      if (expectRatesOn) {
        expect(screen.getByTestId('repost-rates-on').className).toContain('border-accent');
      } else {
        expect(screen.getByTestId('repost-rates-off').className).toContain('border-accent');
        expect(screen.queryByTestId('repost-pricing')).toBeNull();
      }
      await assertUi();
      if (name === 'Edit') {
        expect(screen.getByTestId('repost-pricing-edit-rate-p1')).toHaveValue('125');
      }
      const save = await screen.findByTestId('repost-publish');
      await user.click(save);
      const publishCall = vi
        .mocked(api.post)
        .mock.calls.find((c) => c[0] === '/collections/child-1/publish');
      expect(publishCall).toBeTruthy();
      const body = publishCall?.[1] as Record<string, unknown>;
      if (name === 'On Request') {
        // Rates off must not send Same wipe.
        expect(body.repostPricingMode).toBeUndefined();
        expect(body.rateVisibility).toBe('on_request');
      } else {
        expect(body.rateVisibility).toBe('visible');
        expect(body.repostPricingMode).toBe(pack.repostPricingMode);
        if (pack.repostPricingMode === 'edit') {
          expect(body.repostEditedRate).toBe(125);
        }
      }
    },
  );

  it('edit Save still publishes when curate-check blocks all members (settings-only)', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/collections/child-1') return editDetail();
      if (path === '/connections') return [];
      if (path === '/broadcasts/lists') return [];
      if (path === '/settings') return { tradeDefaults: {} };
      if (path === '/collections') return [];
      return {};
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/collections/curate-check') {
        return {
          allowedProductIds: [],
          blocked: [{ productId: 'p1', code: 'FOLLOW_LOOK_ONLY' }],
        };
      }
      if (path === '/collections/child-1/publish') return editDetail();
      return {};
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ToastProvider>
            <RepostSheet
              open
              onClose={() => undefined}
              target={target}
              editCollectionId="child-1"
            />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Edit repost' })).toBeTruthy();
    expect(await screen.findByTestId('repost-unavailable-summary')).toBeTruthy();
    const save = await screen.findByTestId('repost-publish');
    expect(save).not.toBeDisabled();
    await user.click(save);
    expect(
      vi.mocked(api.post).mock.calls.some((c) => c[0] === '/collections/child-1/publish'),
    ).toBe(true);
    expect(screen.queryByText(/can't go in a collection now/i)).toBeNull();
  });
});
