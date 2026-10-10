import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { postCatalogCardsToThread } from './postCatalogCardsToThread';

vi.mock('@/lib/apiClient', () => ({
  api: { post: vi.fn() },
}));

describe('postCatalogCardsToThread', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.post).mockResolvedValue({ id: 'm1' } as never);
  });

  it('posts each album as collection_card and one design as product_card', async () => {
    await postCatalogCardsToThread('t1', {
      collections: [{ collectionId: 'col1', name: 'Wedding' }],
      products: [{ productId: 'p1', name: 'Navy' }],
    });
    expect(api.post).toHaveBeenCalledWith('/threads/t1/messages', {
      type: MessageType.CollectionCard,
      referenceId: 'col1',
      body: 'Wedding',
    });
    expect(api.post).toHaveBeenCalledWith('/threads/t1/messages', {
      type: MessageType.ProductCard,
      referenceId: 'p1',
      body: 'Navy',
    });
  });

  it('posts 2+ designs as one design_album', async () => {
    await postCatalogCardsToThread('t1', {
      products: [
        { productId: 'p1', name: 'A' },
        { productId: 'p2', name: 'B' },
      ],
    });
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/threads/t1/messages', {
      type: MessageType.DesignAlbum,
      metadata: { productIds: ['p1', 'p2'] },
      body: '2 designs',
    });
  });

  it('puts enquireNote on the design_album metadata', async () => {
    await postCatalogCardsToThread('t1', {
      products: [
        { productId: 'p1', name: 'A' },
        { productId: 'p2', name: 'B' },
      ],
      enquireNote: 'Discount?',
    });
    expect(api.post).toHaveBeenCalledWith('/threads/t1/messages', {
      type: MessageType.DesignAlbum,
      metadata: { productIds: ['p1', 'p2'], enquireNote: 'Discount?' },
      body: '2 designs',
    });
  });
});
