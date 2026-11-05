import { OrderIntent } from '@ekum/domain-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/apiClient';
import { placeFromPackOrBatch } from './placeFromPackOrBatch';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/lib/apiClient', () => ({
  api: { post },
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
}));

const line = { productId: 'p1', quantity: 4 };

describe('placeFromPackOrBatch', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('posts from-pack when a curated collection id is present', async () => {
    post.mockResolvedValue({ downstream: { id: 'parent' }, failures: [] });
    const result = await placeFromPackOrBatch({
      intent: OrderIntent.Order,
      lines: [line],
      collectionId: 'trader-pack',
    });
    expect(post).toHaveBeenCalledWith(
      '/orders/from-pack',
      expect.objectContaining({ collectionId: 'trader-pack' }),
    );
    expect(post).not.toHaveBeenCalledWith('/orders/batch', expect.anything());
    expect(result.orders.map((order) => order.id)).toEqual(['parent']);
  });

  it('posts batch when there is no pack', async () => {
    post.mockResolvedValue({ orders: [{ id: 'batch-1' }], failures: [] });
    await placeFromPackOrBatch({ intent: OrderIntent.Order, lines: [line] });
    expect(post).toHaveBeenCalledWith(
      '/orders/batch',
      expect.objectContaining({ items: [expect.objectContaining({ productId: 'p1' })] }),
    );
  });

  it('falls back to batch when the album is not curated', async () => {
    post.mockRejectedValueOnce(new ApiError('NOT_CURATED'));
    post.mockResolvedValueOnce({ orders: [{ id: 'batch-1' }], failures: [] });
    await placeFromPackOrBatch({
      intent: OrderIntent.Order,
      lines: [line],
      collectionId: 'own-album',
    });
    expect(post).toHaveBeenNthCalledWith(1, '/orders/from-pack', expect.anything());
    expect(post).toHaveBeenNthCalledWith(2, '/orders/batch', expect.anything());
  });
});
