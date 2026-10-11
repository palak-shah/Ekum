import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedItemView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { toggleSavedDesigns } from './useSaveToggle';

vi.mock('@/lib/apiClient', () => ({
  api: {
    post: vi.fn(),
    del: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

describe('toggleSavedDesigns', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.del).mockReset();
  });

  it('saves missing product ids', async () => {
    const items = [{ kind: 'product', productId: 'a', id: 's1' }] as SavedItemView[];
    vi.mocked(api.post).mockResolvedValue({} as SavedItemView);
    await expect(toggleSavedDesigns(['a', 'b'], items)).resolves.toBe('saved');
    expect(api.post).toHaveBeenCalledWith('/saved', { productId: 'b' });
    expect(api.del).not.toHaveBeenCalled();
  });

  it('removes when every selected id is already saved', async () => {
    const items = [
      { kind: 'product', productId: 'a', id: 's1' },
      { kind: 'product', productId: 'b', id: 's2' },
    ] as SavedItemView[];
    vi.mocked(api.del).mockResolvedValue(undefined as never);
    await expect(toggleSavedDesigns(['a', 'b'], items)).resolves.toBe('removed');
    expect(api.del).toHaveBeenCalledWith('/saved/s1');
    expect(api.del).toHaveBeenCalledWith('/saved/s2');
    expect(api.post).not.toHaveBeenCalled();
  });
});
