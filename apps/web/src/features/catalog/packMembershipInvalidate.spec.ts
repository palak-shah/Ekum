import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateAfterPackMembership } from './packMembershipInvalidate';

describe('invalidateAfterPackMembership', () => {
  it('refetches every album grid so General Collection leftovers are not stale', () => {
    const invalidateQueries = vi.fn();
    invalidateAfterPackMembership({ invalidateQueries } as unknown as QueryClient);
    const keys = invalidateQueries.mock.calls.map((call) => call[0].queryKey);
    expect(keys).toContainEqual(['collection-preview']);
    expect(keys).toContainEqual(['collection']);
    expect(keys).toContainEqual(['my-collections']);
    expect(keys).toContainEqual(['my-products']);
  });
});
