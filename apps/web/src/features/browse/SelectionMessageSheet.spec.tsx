import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MessageType } from '@ekum/domain-types';
import { ToastProvider } from '@/ui/Toast';
import { api } from '@/lib/apiClient';
import { SelectionMessageSheet } from './SelectionMessageSheet';

vi.mock('@/lib/apiClient', () => ({
  api: { post: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me', name: 'My Shop', logoUrl: null } }),
}));

describe('SelectionMessageSheet', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/threads/direct') return { id: 'thread-c1' } as never;
      if (String(path).includes('/messages')) return { id: 'card-1' } as never;
      throw new Error(`unexpected post ${path}`);
    });
  });

  it('sends one design card with enquireNote — not a Reply text bubble', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <SelectionMessageSheet
            open
            onClose={onClose}
            shopId="c1"
            shopName="Mill"
            collections={[]}
            products={[{ productId: 'p1', name: 'Navy' }]}
          />
        </ToastProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByTestId('selection-message-text'), 'Rate for 50?');
    await user.click(screen.getByTestId('selection-message-send'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/threads/direct', { companyId: 'c1' });
      expect(api.post).toHaveBeenCalledWith('/threads/thread-c1/messages', {
        type: MessageType.ProductCard,
        referenceId: 'p1',
        body: 'Navy',
        metadata: { enquireNote: 'Rate for 50?' },
      });
      expect(onClose).toHaveBeenCalled();
    });
    const textPosts = vi
      .mocked(api.post)
      .mock.calls.filter(
        ([, body]) => (body as { type?: string })?.type === MessageType.Text,
      );
    expect(textPosts).toHaveLength(0);
  });
});
