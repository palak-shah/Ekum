import type { OwnCompanyProfile } from '@ekum/domain-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type ProfileMediaPatch =
  | { logoUrl: string | null }
  | { coverUrl: string | null }
  | { showcaseUrls: string[] };

/** PATCH one profile image field; invalidate own + public company caches. */
export async function patchProfileMedia(
  queryClient: QueryClient,
  companyId: string,
  patch: ProfileMediaPatch,
): Promise<OwnCompanyProfile> {
  const next = await api.patch<OwnCompanyProfile>('/companies/me', patch);
  void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  void queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  return next;
}
