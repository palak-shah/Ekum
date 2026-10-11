import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateAfterProductEdit } from './productEditorInvalidate';

describe('invalidateAfterProductEdit', () => {
  it('refreshes album grids that embed the design (collection-preview + collection)', () => {
    const invalidateQueries = vi.fn();
    invalidateAfterProductEdit(
      { invalidateQueries } as unknown as QueryClient,
      'prod-1',
    );
    const keys = invalidateQueries.mock.calls.map((call) => call[0].queryKey);
    expect(keys).toContainEqual(['product', 'prod-1']);
    expect(keys).toContainEqual(['my-products']);
    expect(keys).toContainEqual(['collection-preview']);
    expect(keys).toContainEqual(['collection']);
  });
});
