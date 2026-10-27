import type { QueryClient } from '@tanstack/react-query';

/** After add/remove members — refresh this album, General Collection leftovers, and You lists. */
export function invalidateAfterPackMembership(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['collection-preview'] }),
    queryClient.invalidateQueries({ queryKey: ['collection'] }),
    queryClient.invalidateQueries({ queryKey: ['my-products'] }),
    queryClient.invalidateQueries({ queryKey: ['my-collections'] }),
    queryClient.invalidateQueries({ queryKey: ['explore'] }),
  ]);
}
