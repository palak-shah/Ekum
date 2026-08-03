import { useQuery } from '@tanstack/react-query';
import type { OwnCompanyProfile } from '@ekum/domain-types';
import { api } from './apiClient';

/** The signed-in company's own profile, including progressive capabilities. */
export function useMyCompany() {
  return useQuery({
    queryKey: ['company', 'me'],
    queryFn: () => api.get<OwnCompanyProfile>('/companies/me'),
    staleTime: 5 * 60_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60_000,
  });
}
