import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateAfterBlock, invalidateFollowCatalog } from './invalidateFollowCatalog';

describe('invalidateFollowCatalog', () => {
  it('refetches follow lists and catalog surfaces', () => {
    const invalidateQueries = vi.fn();
    invalidateFollowCatalog({ invalidateQueries } as unknown as QueryClient);
    expect(invalidateQueries.mock.calls.map((call) => call[0])).toEqual([
      { queryKey: ['follows'] },
      { queryKey: ['explore'] },
      { queryKey: ['company'] },
      { queryKey: ['collection-preview'] },
    ]);
  });
});

describe('invalidateAfterBlock', () => {
  it('also refreshes connections, trade lanes, and threads', () => {
    const invalidateQueries = vi.fn();
    invalidateAfterBlock({ invalidateQueries } as unknown as QueryClient);
    expect(invalidateQueries.mock.calls.map((call) => call[0])).toEqual([
      { queryKey: ['follows'] },
      { queryKey: ['explore'] },
      { queryKey: ['company'] },
      { queryKey: ['collection-preview'] },
      { queryKey: ['connections'] },
      { queryKey: ['trade-lanes'] },
      { queryKey: ['threads'] },
    ]);
  });
});
