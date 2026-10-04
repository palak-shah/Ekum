import { QueryClient } from '@tanstack/react-query';

/**
 * Server-owned state. Badge endpoints poll on an interval; focus refetch storms
 * were making tab switches feel slow, so window-focus refetch stays off.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
