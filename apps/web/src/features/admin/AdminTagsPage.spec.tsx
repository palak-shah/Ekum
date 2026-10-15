import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MasterOptionKind } from '@ekum/domain-types';
import { AdminTagsPage } from './AdminTagsPage';
import { AdminTagList } from './AdminTagList';
import { AdminBulkPastePanel } from './AdminAddTagsPanel';

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@/lib/apiClient', () => ({
  api: apiMock,
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const categories = [
  {
    id: 'cat-1',
    slug: 'fabrics_dress_material',
    label: 'Fabrics – Dress material',
    active: true,
    sortOrder: 1,
  },
];

const tagPage = {
  items: [
    {
      id: 'tag-1',
      kind: MasterOptionKind.Quality,
      label: 'Cotton',
      active: true,
      categories: [
        { id: 'cat-1', slug: 'fabrics_dress_material', label: 'Fabrics – Dress material' },
      ],
    },
  ],
  total: 1,
  take: 25,
  skip: 0,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminTagsPage />
    </QueryClientProvider>,
  );
}

describe('AdminTagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockImplementation((path: string) => {
      if (path.startsWith('/admin/master-categories')) return Promise.resolve(categories);
      if (path.startsWith('/admin/tags')) return Promise.resolve(tagPage);
      return Promise.resolve([]);
    });
  });

  it('does not list tags until category and option type are picked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('admin-tags-page')).toBeTruthy());
    expect(screen.getByTestId('admin-tags-pick-scope')).toBeTruthy();
    expect(screen.queryByTestId('admin-tag-list')).toBeNull();
    expect(apiMock.get).not.toHaveBeenCalledWith(expect.stringContaining('/admin/tags?'));
  });

  async function pickScope(user: ReturnType<typeof userEvent.setup>) {
    await waitFor(() =>
      expect(
        screen.getByTestId('admin-filter-category').querySelector('option[value="cat-1"]'),
      ).toBeTruthy(),
    );
    await user.selectOptions(screen.getByTestId('admin-filter-category'), 'cat-1');
    await user.selectOptions(screen.getByTestId('admin-filter-kind'), 'quality');
    await waitFor(() =>
      expect(screen.queryByTestId('admin-tags-pick-scope')).toBeNull(),
    );
  }

  it('loads tags and supports unified search/add after scope is set', async () => {
    const user = userEvent.setup();
    renderPage();
    await pickScope(user);

    await waitFor(() => expect(screen.getByTestId('admin-tag-list')).toBeTruthy());
    expect(screen.getByText('Cotton')).toBeTruthy();

    await user.clear(screen.getByTestId('admin-search-add'));
    await user.type(screen.getByTestId('admin-search-add'), 'Cotton');
    await waitFor(() => expect(screen.getByTestId('admin-exact-exists')).toBeTruthy());
    expect(screen.getByTestId('admin-search-add-submit')).toBeDisabled();

    await user.clear(screen.getByTestId('admin-search-add'));
    await user.type(screen.getByTestId('admin-search-add'), 'Linen Soft');
    await waitFor(() =>
      expect(screen.getByTestId('admin-search-add-submit')).not.toBeDisabled(),
    );
    apiMock.post.mockResolvedValue({});
    await user.click(screen.getByTestId('admin-search-add-submit'));
    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith('/admin/tags', {
        categoryId: 'cat-1',
        kind: MasterOptionKind.Quality,
        label: 'Linen Soft',
      }),
    );
  });

  it('shows Load more when more pages exist', async () => {
    const user = userEvent.setup();
    apiMock.get.mockImplementation((path: string) => {
      if (path.startsWith('/admin/master-categories')) return Promise.resolve(categories);
      if (path.startsWith('/admin/tags')) {
        return Promise.resolve({
          items: tagPage.items,
          total: 40,
          take: 25,
          skip: 0,
        });
      }
      return Promise.resolve([]);
    });
    renderPage();
    await pickScope(user);
    await waitFor(() => expect(screen.getByTestId('admin-tags-load-more')).toBeTruthy());
  });

  it('revalidates preview row after edit so invalid labels are not committed', async () => {
    const user = userEvent.setup();
    apiMock.post.mockImplementation((path: string) => {
      if (path === '/admin/tags/bulk/preview') {
        return Promise.resolve({
          rows: [{ index: 0, label: 'Silk Soft', status: 'new' }],
          summary: { new: 1, existing: 0, duplicateInPaste: 0, invalid: 0 },
        });
      }
      return Promise.resolve({});
    });

    renderPage();
    await pickScope(user);

    await user.type(screen.getByTestId('admin-bulk-textarea'), 'Silk Soft');
    await user.click(screen.getByTestId('admin-bulk-preview'));
    await waitFor(() => expect(screen.getByTestId('admin-bulk-commit')).not.toBeDisabled());

    const input = screen.getByLabelText('Preview row 1');
    await user.clear(input);
    await waitFor(() => expect(screen.getByTestId('admin-bulk-commit')).toBeDisabled());
    expect(screen.getByText(/Invalid 1/)).toBeTruthy();

    await user.click(screen.getByTestId('admin-bulk-commit'));
    expect(apiMock.post).not.toHaveBeenCalledWith(
      '/admin/tags/bulk/commit',
      expect.anything(),
    );
  });

  it('commits labels captured at Save click even if preview is cleared after', async () => {
    const user = userEvent.setup();
    let resolveCommit!: (value: unknown) => void;
    const commitPromise = new Promise((resolve) => {
      resolveCommit = resolve;
    });

    apiMock.post.mockImplementation((path: string) => {
      if (path === '/admin/tags/bulk/preview') {
        return Promise.resolve({
          rows: [
            { index: 0, label: 'Silk Soft', status: 'new' },
            { index: 1, label: 'Cotton', status: 'existing' },
          ],
          summary: { new: 1, existing: 1, duplicateInPaste: 0, invalid: 0 },
        });
      }
      if (path === '/admin/tags/bulk/commit') {
        return commitPromise;
      }
      return Promise.resolve({});
    });

    renderPage();
    await pickScope(user);

    await user.type(screen.getByTestId('admin-bulk-textarea'), 'Silk Soft');
    await user.click(screen.getByTestId('admin-bulk-preview'));
    await waitFor(() => expect(screen.getByTestId('admin-bulk-preview-list')).toBeTruthy());

    await user.click(screen.getByTestId('admin-bulk-commit'));
    // Filter change clears preview state while commit is still in flight.
    await user.selectOptions(screen.getByTestId('admin-filter-kind'), 'item_type');

    resolveCommit({
      created: 1,
      skippedDuplicates: 0,
      invalid: 0,
      failed: 0,
    });

    await waitFor(() =>
      expect(apiMock.post).toHaveBeenCalledWith('/admin/tags/bulk/commit', {
        categoryId: 'cat-1',
        kind: MasterOptionKind.Quality,
        labels: ['Silk Soft'],
      }),
    );
  });
});

describe('AdminBulkPastePanel', () => {
  it('renders bulk paste controls', () => {
    render(
      <AdminBulkPastePanel
        canMutate
        categoryLabel="Fabrics"
        kind={MasterOptionKind.Quality}
        bulkText=""
        onBulkTextChange={() => undefined}
        preview={null}
        onPreview={() => undefined}
        onRefreshPreview={() => undefined}
        onCommit={() => undefined}
        onRemovePreviewRow={() => undefined}
        onEditPreviewLabel={() => undefined}
        previewPending={false}
        commitPending={false}
      />,
    );
    expect(screen.getByTestId('admin-bulk-textarea')).toBeTruthy();
    expect(screen.getByTestId('admin-bulk-preview')).toBeTruthy();
  });
});

describe('AdminTagList', () => {
  it('shows Restore for archived tags', () => {
    render(
      <AdminTagList
        tags={[
          {
            id: 'tag-2',
            kind: MasterOptionKind.ItemType,
            label: 'Saree',
            active: false,
            categories: [],
          },
        ]}
        loading={false}
        total={1}
        hasMore={false}
        loadingMore={false}
        onLoadMore={() => undefined}
        onArchive={() => undefined}
        onRestore={() => undefined}
        onDelete={() => undefined}
        onSaveEdit={() => undefined}
        editPending={false}
      />,
    );
    expect(screen.getByTestId('admin-tag-restore')).toBeTruthy();
  });
});
