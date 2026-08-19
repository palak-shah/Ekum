import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SavedItemView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, Card, EmptyState, LoadingBlock } from '@/ui/kit';
import { SAVED_QUERY_KEY, useSavedList } from './useSaveToggle';

function itemPath(item: SavedItemView): string {
  if (item.kind === 'product' && item.productId) {
    return `/explore/products/${item.productId}`;
  }
  if (item.kind === 'collection' && item.collectionId) {
    return `/collections/${item.collectionId}`;
  }
  return '/saved';
}

function kindLabel(kind: SavedItemView['kind']): string {
  return kind === 'product' ? 'Design' : 'Collection';
}

export function SavedPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const saved = useSavedList();

  const unsave = useMutation({
    mutationFn: (id: string) => api.del(`/saved/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
      showToast('Removed from Saved');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not remove.', 'danger'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Saved" />
      {saved.isLoading ? (
        <LoadingBlock label="Loading saved…" />
      ) : saved.data && saved.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {saved.data.map((item) => (
            <Card key={item.id} className="flex items-center gap-3">
              <Link to={itemPath(item)} className="flex min-w-0 flex-1 items-center gap-3">
                {item.thumbUrl ? (
                  <img
                    src={item.thumbUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foam text-sm font-bold text-muted">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="truncate text-xs text-muted">
                    {item.company.name}
                    {' · '}
                    {kindLabel(item.kind)}
                  </p>
                </div>
              </Link>
              <Button
                variant="secondary"
                disabled={unsave.isPending}
                onClick={() => unsave.mutate(item.id)}
              >
                Remove
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          message="Save a design or collection from Explore to find it here."
        />
      )}
    </div>
  );
}
