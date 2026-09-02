import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccessRequestView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, Card, EmptyState, LoadingBlock, SectionHeader } from '@/ui/kit';

/** Incoming (approve) + outgoing pending access requests. */
export function RequestsPage() {
  const queryClient = useQueryClient();
  const incoming = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/incoming'),
  });
  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['connections'] });
  };

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      api.post(`/access-requests/${id}/${action}`, {}),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Requests"
        action={
          <Link to="/network/connections" className="text-sm font-medium text-accent">
            Connections
          </Link>
        }
      />

      <section className="flex flex-col gap-2">
        <SectionHeader title="Incoming" />
        {incoming.isLoading ? (
          <LoadingBlock />
        ) : incoming.data && incoming.data.length > 0 ? (
          incoming.data.map((request) => (
            <Card key={request.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={request.company.name} imageUrl={request.company.logoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{request.company.name}</p>
                  <p className="truncate text-xs text-muted">{request.company.city}</p>
                </div>
              </div>
              {request.note ? <p className="text-sm text-muted">“{request.note}”</p> : null}
              {request.referredBy ? (
                <p className="text-xs text-muted">Referred by {request.referredBy}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  onClick={() => decide.mutate({ id: request.id, action: 'approve' })}
                  disabled={decide.isPending}
                >
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
        <SectionHeader title="Outgoing" />
        {outgoing.isLoading ? (
          <LoadingBlock />
        ) : outgoing.data && outgoing.data.length > 0 ? (
          outgoing.data.map((request) => (
            <Card key={request.id} className="flex items-center gap-3">
              <Link to={`/company/${request.company.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={request.company.name} imageUrl={request.company.logoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{request.company.name}</p>
                  <p className="truncate text-xs text-muted capitalize">{request.status}</p>
                </div>
              </Link>
            </Card>
          ))
        ) : (
          <EmptyState title="No outgoing requests" message="Requests you send to suppliers show up here." />
        )}
      </section>
    </div>
  );
}
