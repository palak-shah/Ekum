import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import type { ConnectionView, PublicCompanySummary } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useToast } from '@/ui/Toast';
import {
  buildConnectedSet,
  buildFollowingSet,
  shouldShowExploreFollow,
} from './exploreCompanyRelationships';

export function useExploreCompanyRelationships() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const company = useMyCompany();
  const ownCompanyId = company.data?.id;
  const [pendingId, setPendingId] = useState<string | null>(null);

  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<PublicCompanySummary[]>('/follows/following'),
    staleTime: 60_000,
  });

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    staleTime: 60_000,
  });

  const followingIds = useMemo(() => buildFollowingSet(following.data), [following.data]);
  const connectedIds = useMemo(() => buildConnectedSet(connections.data), [connections.data]);

  const shouldShowFollow = useCallback(
    (companyId: string) =>
      shouldShowExploreFollow(companyId, ownCompanyId, followingIds, connectedIds),
    [ownCompanyId, followingIds, connectedIds],
  );

  const followMutation = useMutation({
    mutationFn: (payload: { companyId: string; companyName: string }) =>
      api.post('/follows', { companyId: payload.companyId }),
    onMutate: ({ companyId }) => {
      setPendingId(companyId);
    },
    onSuccess: (_, { companyName }) => {
      showToast(`Following ${companyName}`);
      void queryClient.invalidateQueries({ queryKey: ['follows', 'following'] });
      void queryClient.invalidateQueries({ queryKey: ['explore', 'home'] });
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not follow.', 'danger');
    },
    onSettled: () => {
      setPendingId(null);
    },
  });

  const follow = useCallback(
    (companyId: string, companyName: string) => {
      if (pendingId || followMutation.isPending) return;
      if (!shouldShowFollow(companyId)) return;
      followMutation.mutate({ companyId, companyName });
    },
    [followMutation, pendingId, shouldShowFollow],
  );

  const isFollowPending = useCallback(
    (companyId: string) => pendingId === companyId || followMutation.isPending,
    [pendingId, followMutation.isPending],
  );

  return {
    shouldShowFollow,
    follow,
    isFollowPending,
    isLoading: following.isLoading || connections.isLoading,
  };
}
