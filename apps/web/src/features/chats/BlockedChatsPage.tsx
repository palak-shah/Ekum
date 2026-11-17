import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConnectionView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import {
  UNBLOCK_ACCESS_CLEARED_TOAST,
  YOUR_BLOCK_REMOVED_TOAST,
} from '@/features/company/seePacksCopy';
import { invalidateAfterBlock } from '@/features/network/invalidateFollowCatalog';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Card, EmptyState, ErrorState, LoadingBlock } from '@/ui/kit';
import { useToast } from '@/ui/Toast';

export function BlockedChatsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });

  const unblock = useMutation({
    mutationFn: (id: string) => api.post<ConnectionView>(`/connections/${id}/unblock`, {}),
    onSuccess: (data) => {
      invalidateAfterBlock(queryClient);
      showToast(data.canBlock ? UNBLOCK_ACCESS_CLEARED_TOAST : YOUR_BLOCK_REMOVED_TOAST);
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not unblock this shop.', 'danger');
    },
  });

  if (connections.isLoading && !connections.data) {
    return <LoadingBlock label="Loading blocked…" />;
  }
  if (connections.isError) {
    return (
      <>
        <PageHeader title="Blocked" onBack={() => navigate('/chats')} />
        <ErrorState message="Could not load blocked shops." />
      </>
    );
  }

  const rows = (connections.data ?? []).filter((row) => row.canUnblock);

  return (
    <div className="flex flex-col gap-3 pb-4">
      <PageHeader title="Blocked" onBack={() => navigate('/chats')} />
      {rows.length === 0 ? (
        <EmptyState
          title="Nobody blocked"
          message="Block a business from a chat or Connections. They stay silent until you Unblock."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((connection) => (
            <Card key={connection.id} className="flex items-center gap-3">
              <Link
                to={`/company/${connection.company.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar name={connection.company.name} imageUrl={connection.company.logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-emphasis text-ink">{connection.company.name}</p>
                  <p className="truncate text-xs text-muted">Blocked</p>
                </div>
              </Link>
              <button
                type="button"
                className="shrink-0 text-xs font-emphasis text-accent"
                disabled={unblock.isPending}
                data-testid={`blocked-unblock-${connection.id}`}
                onClick={() => unblock.mutate(connection.id)}
              >
                Unblock
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
