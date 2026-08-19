import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSavedItemDto, SavedItemView, SavedListView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';

export const SAVED_QUERY_KEY = ['saved'] as const;

export function useSavedList() {
  return useQuery({
    queryKey: SAVED_QUERY_KEY,
    queryFn: () => api.get<SavedListView>('/saved'),
  });
}

type SaveTarget =
  | { productId: string; collectionId?: never }
  | { collectionId: string; productId?: never };

function findSavedItem(items: SavedItemView[] | undefined, target: SaveTarget) {
  if (!items) return undefined;
  if (target.productId) {
    return items.find((item) => item.kind === 'product' && item.productId === target.productId);
  }
  return items.find(
    (item) => item.kind === 'collection' && item.collectionId === target.collectionId,
  );
}

/** Save / unsave a discoverable design or collection (Follow-style toggle). */
export function useSaveToggle(target: SaveTarget) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const saved = useSavedList();
  const match = findSavedItem(saved.data, target);
  const isSaved = Boolean(match);

  const toggle = useMutation({
    mutationFn: async () => {
      if (match) {
        await api.del(`/saved/${match.id}`);
        return 'removed' as const;
      }
      const body: CreateSavedItemDto = target.productId
        ? { productId: target.productId }
        : { collectionId: target.collectionId };
      await api.post<SavedItemView>('/saved', body);
      return 'saved' as const;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
      showToast(result === 'removed' ? 'Removed from Saved' : 'Saved');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not update Saved.', 'danger'),
  });

  return {
    isSaved,
    isPending: toggle.isPending,
    toggle: () => toggle.mutate(),
  };
}
