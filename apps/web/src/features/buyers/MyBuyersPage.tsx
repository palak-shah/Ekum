import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AccessRequestView, ConnectionView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, Card, EmptyState, LoadingBlock, SectionHeader, StatusPill } from '@/ui/kit';

export function MyBuyersPage() {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/incoming'),
  });
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['access-requests', 'incoming'] });
    void queryClient.invalidateQueries({ queryKey: ['connections'] });
  };

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      api.post(`/access-requests/${id}/${action}`, {}),
    onSuccess: invalidate,
  });

  const connectionAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'pause' | 'resume' | 'block' | 'unblock' }) =>
      api.post(`/connections/${id}/${action}`, {}),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My buyers" />

      <section className="flex flex-col gap-2">
        <SectionHeader title="Access requests" />
        {requests.isLoading ? (
          <LoadingBlock />
        ) : requests.data && requests.data.length > 0 ? (
          requests.data.map((request) => (
            <Card key={request.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={request.company.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{request.company.name}</p>
                  <p className="truncate text-xs text-muted">{request.company.city}</p>
                </div>
              </div>
              {request.note ? <p className="text-sm text-muted">“{request.note}”</p> : null}
              {request.referredBy ? <p className="text-xs text-muted">Referred by {request.referredBy}</p> : null}
              <div className="flex gap-2">
                <Button onClick={() => decide.mutate({ id: request.id, action: 'approve' })} disabled={decide.isPending}>
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => decide.mutate({ id: request.id, action: 'decline' })}
                  disabled={decide.isPending}
                >
                  Decline
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No pending requests" message="Access requests from buyers will appear here." />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Connections" />
        {connections.isLoading ? (
          <LoadingBlock />
        ) : connections.data && connections.data.length > 0 ? (
          connections.data.map((connection) => (
            <Card key={connection.id} className="flex items-center gap-3">
              <Link to={`/company/${connection.company.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={connection.company.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{connection.company.name}</p>
                  <p className="truncate text-xs text-muted">
                    {connection.role === 'owner' ? 'Buys from you' : 'You buy from them'}
                  </p>
                </div>
              </Link>
              <StatusPill status={connection.status} />
              {connection.role === 'owner' ? (
                <ConnectionMenu
                  status={connection.status}
                  onAction={(action) => connectionAction.mutate({ id: connection.id, action })}
                />
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState title="No connections yet" message="Approved buyers and suppliers show up here." />
        )}
      </section>
    </div>
  );
}

function ConnectionMenu({
  status,
  onAction,
}: {
  status: string;
  onAction: (action: 'pause' | 'resume' | 'block' | 'unblock') => void;
}) {
  if (status === 'blocked') {
    return (
      <button className="text-xs font-medium text-accent" onClick={() => onAction('unblock')}>
        Unblock
      </button>
    );
  }
  if (status === 'paused') {
    return (
      <button className="text-xs font-medium text-accent" onClick={() => onAction('resume')}>
        Resume
      </button>
    );
  }
  return (
    <button className="text-xs font-medium text-muted" onClick={() => onAction('pause')}>
      Pause
    </button>
  );
}
