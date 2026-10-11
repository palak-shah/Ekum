import type { QueryClient } from '@tanstack/react-query';

/** After design save / hide / delete — refresh editor lists and album grids that embed the design. */
export function invalidateAfterProductEdit(queryClient: QueryClient, productId: string) {
  void queryClient.invalidateQueries({ queryKey: ['product', productId] });
  void queryClient.invalidateQueries({ queryKey: ['my-products'] });
  void queryClient.invalidateQueries({ queryKey: ['explore', 'feed'] });
  void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  void queryClient.invalidateQueries({ queryKey: ['collection-preview'] });
  void queryClient.invalidateQueries({ queryKey: ['collection'] });
}
