import type { QueryClient } from '@tanstack/react-query';

/** After ask / allow / cancel See new packs — feed and shop lists must refetch. */
export function invalidateFollowCatalog(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['follows'] });
  void queryClient.invalidateQueries({ queryKey: ['explore'] });
  void queryClient.invalidateQueries({ queryKey: ['company'] });
  void queryClient.invalidateQueries({ queryKey: ['collection-preview'] });
}

/** After Block — Follows gone, Explore/stories must drop them, lanes + connections refresh. */
export function invalidateAfterBlock(queryClient: QueryClient) {
  invalidateFollowCatalog(queryClient);
  void queryClient.invalidateQueries({ queryKey: ['connections'] });
  void queryClient.invalidateQueries({ queryKey: ['trade-lanes'] });
  void queryClient.invalidateQueries({ queryKey: ['threads'] });
}
