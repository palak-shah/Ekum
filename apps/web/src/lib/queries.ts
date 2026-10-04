import { useQuery } from '@tanstack/react-query';
import type { OwnCompanyProfile } from '@ekum/domain-types';
import { api } from './apiClient';

/** Pause interval polls while the tab is hidden. */
function visibleRefetchInterval(ms: number) {
  return () => (typeof document !== 'undefined' && document.hidden ? false : ms);
}

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
    staleTime: 60_000,
    refetchInterval: visibleRefetchInterval(60_000),
    refetchIntervalInBackground: false,
  });
}

/** Sum of unread messages on Active chats — bottom-nav Chats badge. */
export function useChatUnreadCount() {
  return useQuery({
    queryKey: ['threads', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/threads/unread-count'),
    staleTime: 30_000,
    refetchInterval: visibleRefetchInterval(30_000),
    refetchIntervalInBackground: false,
  });
}

/** Orders list Needs you — bottom-nav Orders badge. */
export function useOrdersNeedsYouCount() {
  return useQuery({
    queryKey: ['orders', 'needs-you-count'],
    queryFn: () => api.get<{ count: number }>('/orders/needs-you-count'),
    staleTime: 30_000,
    refetchInterval: visibleRefetchInterval(30_000),
    refetchIntervalInBackground: false,
  });
}
