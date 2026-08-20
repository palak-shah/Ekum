import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConnectionView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Card, EmptyState, LoadingBlock, StatusPill } from '@/ui/kit';

export function ConnectionsPage() {
  const queryClient = useQueryClient();
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });

  const connectionAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'pause' | 'resume' | 'block' | 'unblock' }) =>
      api.post(`/connections/${id}/${action}`, {}),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Connections"
        action={
          <Link to="/network/requests" className="text-sm font-medium text-accent">
            Requests
          </Link>
        }
      />
      {connections.isLoading ? (
        <LoadingBlock />
      ) : connections.data && connections.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {connections.data.map((connection) => (
            <Card key={connection.id} className="flex items-center gap-3">
              <Link
                to={`/company/${connection.company.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar name={connection.company.name} imageUrl={connection.company.logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{connection.company.name}</p>
                  <p className="truncate text-xs text-muted">
                    {connection.role === 'owner' ? 'They buy from you' : 'You buy from them'}
                  </p>
                </div>
              </Link>
              <StatusPill status={connection.status} />
              {connection.role === 'owner' ? (
                <OwnerConnectionAction
                  status={connection.status}
                  onAction={(action) => connectionAction.mutate({ id: connection.id, action })}
                />
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No connections yet"
          message="Approve access requests or invite suppliers and buyers to connect."
        />
      )}
    </div>
  );
}

function OwnerConnectionAction({
  status,
  onAction,
}: {
  status: string;
  onAction: (action: 'pause' | 'resume' | 'block' | 'unblock') => void;
}) {
  if (status === 'blocked') {
    return (
      <button type="button" className="text-xs font-medium text-accent" onClick={() => onAction('unblock')}>
        Unblock
      </button>
    );
  }
  if (status === 'paused') {
    return (
      <button type="button" className="text-xs font-medium text-accent" onClick={() => onAction('resume')}>
        Resume
      </button>
    );
  }
  return (
    <button type="button" className="text-xs font-medium text-muted" onClick={() => onAction('pause')}>
      Pause
    </button>
  );
}
