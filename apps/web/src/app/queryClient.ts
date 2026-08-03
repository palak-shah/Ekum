import { QueryClient } from '@tanstack/react-query';

/**
 * All server-owned state lives here and nowhere else. Refetch-on-focus and a
 * short stale time give the "feels fast" behaviour without a real-time layer in
 * Phase 1.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
