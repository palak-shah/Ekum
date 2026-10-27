import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProductStatus } from '@ekum/domain-types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SELECTION_NEEDS_PUBLISHED_TOAST } from './selectionEligibility';
import { DesignSheet } from './DesignSheet';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn().mockResolvedValue([]), post: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me-shop', name: 'Me' } }),
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}));

vi.mock('@/features/catalog/BulkProductPublishSheet', () => ({
  BulkProductPublishSheet: ({
    open,
    productIds,
  }: {
    open: boolean;
    productIds: string[];
  }) => (open ? <div data-testid="bulk-product-publish-sheet">{productIds.join(',')}</div> : null),
}));

vi.mock('@/features/saved/useSaveToggle', () => ({
  useSaveToggle: () => ({
    isSaved: false,
    isPending: false,
    toggle: vi.fn(),
  }),
}));

vi.mock('@/features/orders/HowManyEachSheet', () => ({
  HowManyEachSheet: ({ open }: { open: boolean }) =>
    open ? <div data-testid="design-sheet-how-many" /> : null,
}));

vi.mock('@/features/browse/browseCart', () => ({
  addCartDesignsMany: vi.fn(),
}));

const product = {
  id: 'd1',
  name: 'Chiffon Roll',
  images: ['https://example.com/a.jpg'],
  companyId: 'other-shop',
  companyName: 'Other',
  allowForward: true,
  categories: ['Fabric'],
  description: null,
  unit: 'mtr',
  dispatchUnit: null,
  moq: null,
  rate: 128,
  rateMax: null,
};

function renderSheet(props: Partial<ComponentProps<typeof DesignSheet>> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DesignSheet
          product={product}
          index={0}
          onIndex={() => undefined}
          onClose={() => undefined}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  showToast.mockClear();
  cleanup();
});

describe('DesignSheet', () => {
  it('puts item tags left of the rate, and the description under that row', () => {
    renderSheet({
      product: {
        ...product,
        categories: ['Readymade', 'S'],
        description: 'Soft roll.',
      },
    });
    const tags = screen.getByTestId('design-sheet-item-tags');
    const rate = screen.getByTestId('design-sheet-rate');
    const description = screen.getByTestId('design-sheet-description');
    expect(tags).toHaveTextContent('Readymade');
    expect(tags).toHaveTextContent('S');
    expect(rate).toHaveTextContent('₹');
    expect(description).toHaveTextContent('Soft roll.');
    expect(tags.compareDocumentPosition(rate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rate.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(product.id)).toBeNull();
  });

  it('shows trade footer without Bookmark or Select design (BM-11)', () => {
    renderSheet();
    expect(screen.getByTestId('design-sheet-trade')).toBeTruthy();
    expect(screen.getByTestId('design-sheet-cart')).toHaveTextContent('Add to cart');
    expect(screen.getByTestId('design-sheet-message')).toHaveTextContent('Message');
    expect(screen.getByTestId('design-sheet-share')).toHaveTextContent('Share');
    expect(screen.getByTestId('design-sheet-order')).toHaveTextContent('Order');
    expect(screen.queryByRole('button', { name: /Bookmark this design/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Select design/i })).toBeNull();
  });

  it('puts Bookmark in ⋯; own collection gets Remove and Delete', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    renderSheet({
      canEdit: true,
      canRemove: true,
      canDelete: true,
      collectionId: 'col1',
      onEdit,
      onRemove,
      onDelete,
      product: { ...product, companyId: 'me-shop' },
    });
    expect(screen.getByTestId('design-sheet-message')).toBeDisabled();
    await user.click(screen.getByTestId('design-sheet-more'));
    expect(screen.getByTestId('design-sheet-bookmark')).toHaveTextContent(/Bookmark/i);
    expect(screen.getByTestId('design-sheet-edit')).toHaveTextContent('Edit design');
    expect(screen.getByTestId('design-sheet-remove')).toHaveTextContent(
      'Remove from this collection',
    );
    expect(screen.getByTestId('design-sheet-delete')).toHaveTextContent('Delete design');
  });

  it('catalog album Remove says catalog', async () => {
    const user = userEvent.setup();
    renderSheet({
      canRemove: true,
      collectionId: 'cat1',
      removeLabel: 'Remove from this catalog',
      onRemove: () => undefined,
    });
    await user.click(screen.getByTestId('design-sheet-more'));
    expect(screen.getByTestId('design-sheet-remove')).toHaveTextContent(
      'Remove from this catalog',
    );
  });

  it('hides Remove when there is no collection context', async () => {
    const user = userEvent.setup();
    renderSheet({
      canEdit: true,
      canRemove: true,
      canDelete: true,
      onEdit: () => undefined,
      onRemove: () => undefined,
      onDelete: () => undefined,
    });
    await user.click(screen.getByTestId('design-sheet-more'));
    expect(screen.getByTestId('design-sheet-bookmark')).toBeTruthy();
    expect(screen.getByTestId('design-sheet-edit')).toBeTruthy();
    expect(screen.queryByTestId('design-sheet-remove')).toBeNull();
    expect(screen.getByTestId('design-sheet-delete')).toBeTruthy();
  });

  it('Order opens How many without writing the cart', async () => {
    const { addCartDesignsMany } = await import('@/features/browse/browseCart');
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByTestId('design-sheet-order'));
    expect(screen.getByTestId('design-sheet-how-many')).toBeTruthy();
    expect(addCartDesignsMany).not.toHaveBeenCalled();
  });

  it('Add to cart writes the cart', async () => {
    const { addCartDesignsMany } = await import('@/features/browse/browseCart');
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByTestId('design-sheet-cart'));
    expect(addCartDesignsMany).toHaveBeenCalled();
  });

  it('draft Order and cart toast Publish first; album ⋯ Publish is one tap', async () => {
    const { addCartDesignsMany } = await import('@/features/browse/browseCart');
    const { api } = await import('@/lib/apiClient');
    vi.mocked(addCartDesignsMany).mockClear();
    vi.mocked(api.post).mockResolvedValue({ published: 1 });
    const user = userEvent.setup();
    renderSheet({
      canEdit: true,
      onEdit: () => undefined,
      collectionId: 'col1',
      product: {
        ...product,
        companyId: 'me-shop',
        status: ProductStatus.Draft,
      },
    });
    await user.click(screen.getByTestId('design-sheet-order'));
    expect(screen.queryByTestId('design-sheet-how-many')).toBeNull();
    expect(showToast).toHaveBeenCalledWith(SELECTION_NEEDS_PUBLISHED_TOAST);
    await user.click(screen.getByTestId('design-sheet-cart'));
    expect(addCartDesignsMany).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('design-sheet-more'));
    expect(screen.getByTestId('design-sheet-publish')).toHaveTextContent('Publish');
    await user.click(screen.getByTestId('design-sheet-publish'));
    expect(screen.queryByTestId('bulk-product-publish-sheet')).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/collections/col1/publish-members', {
      productIds: ['d1'],
    });
  });
});
