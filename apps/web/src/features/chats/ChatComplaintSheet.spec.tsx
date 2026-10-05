import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { OrderView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { ChatComplaintSheet } from './ChatComplaintSheet';

vi.mock('@/lib/apiClient', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/mediaUpload', () => ({
  uploadImage: vi.fn(),
  isPhoneLike: () => false,
}));

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/ui/ContinuousCamera', () => ({
  ContinuousCamera: () => null,
}));

function renderSheet(
  props: Partial<{
    againstCompanyId: string;
    againstCompanyName: string | null;
    forwardedFromComplaintId: string | null;
    supplierAlternatives: Array<{ companyId: string; name: string; orderId: string }>;
    onChangeSupplier: () => void;
  }> = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ChatComplaintSheet
        open
        onClose={() => undefined}
        threadId="t1"
        againstCompanyId="shop-1"
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('ChatComplaintSheet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ results: [], nextCursor: null });
  });

  it('keeps Send off until What\'s wrong is filled, with Add photos as a link', async () => {
    renderSheet();
    expect(screen.queryByText(/About Surat Silk House/)).toBeNull();
    expect(screen.getByTestId('complaint-send')).toBeDisabled();
    const photos = screen.getByTestId('complaint-add-photos');
    expect(photos.tagName).toBe('BUTTON');
    expect(photos.className).toContain('text-accent');
    expect(photos.className).not.toContain('rounded-xl');
    await waitFor(() => expect(screen.queryByTestId('complaint-attach-order')).toBeNull());
  });

  it('shows prefilled supplier with Change when escalating', () => {
    const onChangeSupplier = vi.fn();
    renderSheet({
      againstCompanyId: 'mill-b',
      againstCompanyName: 'Mill B',
      forwardedFromComplaintId: 'cmp-1',
      supplierAlternatives: [{ companyId: 'mill-a', name: 'Mill A', orderId: 'lot-a' }],
      onChangeSupplier,
    });
    expect(screen.getByTestId('complaint-escalate-supplier')).toHaveTextContent('Mill B');
    expect(screen.getByTestId('complaint-escalate-supplier')).toHaveTextContent(/Supplier/);
    screen.getByTestId('complaint-change-supplier').click();
    expect(onChangeSupplier).toHaveBeenCalled();
  });

  it('lets you attach an order from this shop', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({
      results: [
        {
          id: 'ord-late-lot',
          createdAt: '2026-09-01T12:00:00.000Z',
          status: 'requested',
          counterpart: { id: 'shop-1', name: 'Surat Silk House' },
          items: [{ name: 'Navy satin', image: '/media/navy.jpg', images: [] }],
        } as unknown as OrderView,
      ],
      nextCursor: null,
    });
    renderSheet();
    await user.click(await screen.findByTestId('complaint-attach-order'));
    await user.click(screen.getByTestId('complaint-order-row'));
    const chosen = screen.getByTestId('complaint-order-chosen');
    expect(chosen).toHaveTextContent('Navy satin');
    expect(chosen).not.toHaveTextContent(/Order #/);
  });
});
