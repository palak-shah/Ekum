import type { QueryClient } from '@tanstack/react-query';

/**
 * After design save / hide / delete — refresh editor lists and album grids that embed the design.
 * `productId` is absent on Create (no cached single-design query yet).
 */
export function invalidateAfterProductEdit(queryClient: QueryClient, productId?: string) {
  if (productId) {
    void queryClient.invalidateQueries({ queryKey: ['product', productId] });
  }
  void queryClient.invalidateQueries({ queryKey: ['my-products'] });
  void queryClient.invalidateQueries({ queryKey: ['explore', 'feed'] });
  void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  void queryClient.invalidateQueries({ queryKey: ['collection-preview'] });
  void queryClient.invalidateQueries({ queryKey: ['collection'] });
}
