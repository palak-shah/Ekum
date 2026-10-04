import type { QueryClient } from '@tanstack/react-query';
import type { CollectionCard, CursorPage, PublicCompanyProfile } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { prefetchCompanyPage } from './prefetchCompanyPage';

/** Chunk + default-tab data warm on Explore shop press. */
export function warmCompanyFromExplore(queryClient: QueryClient, companyId: string): void {
  if (!companyId) return;
  prefetchCompanyPage();
  void queryClient.prefetchQuery({
    queryKey: ['company', companyId],
    queryFn: () => api.get<PublicCompanyProfile>(`/companies/${companyId}`),
  });
  void queryClient.prefetchQuery({
    queryKey: ['company', companyId, 'collections'],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>(`/companies/${companyId}/collections`, { limit: 20 }),
  });
}
