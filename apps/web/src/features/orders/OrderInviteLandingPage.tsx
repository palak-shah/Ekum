import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { OrderInviteView, OrderView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { clearInviteReturn } from '@/lib/inviteReturn';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, Card, ErrorState, LoadingBlock } from '@/ui/kit';

export function OrderInviteLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const invite = useQuery({
    queryKey: ['order-invite', token],
    queryFn: () => api.publicGet<OrderInviteView>(`/order-invites/${token}`),
  });

  const accept = useMutation({
    mutationFn: () => api.post<OrderView>(`/order-invites/${token}/accept`, {}),
    onSuccess: (order) => {
      clearInviteReturn();
      showToast('Accepted.');
      navigate(`/orders/${order.id}`, { replace: true });
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not accept.', 'danger'),
  });

  const decline = useMutation({
    mutationFn: () => api.post<OrderView>(`/order-invites/${token}/decline`, {}),
    onSuccess: () => {
      clearInviteReturn();
      showToast('Declined.');
      navigate('/orders', { replace: true });
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not decline.', 'danger'),
  });

  if (invite.isLoading) {
    return <LoadingBlock label="Opening order…" />;
  }
  if (invite.isError || !invite.data) {
    return (
      <>
        <PageHeader title="Order" />
        <ErrorState message="This link is not valid." />
      </>
    );
  }

  const data = invite.data;
  if (data.expired || data.used) {
    return (
      <>
        <PageHeader title="Order" />
        <ErrorState message="This link has expired." />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader title="Accept this order" />
      <Card className="flex flex-col gap-2">
        <p className="text-sm text-ink">
          <span className="font-semibold">{data.sellerName}</span> logged a ticket for{' '}
          {data.buyerName}.
        </p>
        <p className="text-xs text-muted">
          {data.itemCount} design{data.itemCount === 1 ? '' : 's'}
        </p>
      </Card>
      <Button fullWidth onClick={() => accept.mutate()} disabled={accept.isPending}>
        {accept.isPending ? 'Accepting…' : 'Accept'}
      </Button>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => decline.mutate()}
        disabled={decline.isPending}
      >
        Decline
      </Button>
    </div>
  );
}
