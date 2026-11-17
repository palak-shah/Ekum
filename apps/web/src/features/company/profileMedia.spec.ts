import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { patchProfileMedia } from './profileMedia';
import { api } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: { patch: vi.fn() },
}));

describe('patchProfileMedia', () => {
  it('patches and invalidates me + company id', async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(api.patch).mockResolvedValue({ id: 'c1', coverUrl: 'https://x.jpg' });
    await patchProfileMedia(client, 'c1', { coverUrl: 'https://x.jpg' });
    expect(api.patch).toHaveBeenCalledWith('/companies/me', { coverUrl: 'https://x.jpg' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['company', 'me'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['company', 'c1'] });
  });
});
