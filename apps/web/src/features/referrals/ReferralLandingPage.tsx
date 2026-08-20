import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AccessRequestView, ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { DEFAULT_ACCESS_REQUEST_NOTE } from '@/lib/accessRequestNote';
import { clearInviteReturn } from '@/lib/inviteReturn';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, Card, ErrorState, LoadingBlock } from '@/ui/kit';

export function ReferralLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const referral = useQuery({
    queryKey: ['referral', token],
    queryFn: () => api.get<ReferralView>(`/referrals/${token}`),
  });

  const requestAccess = useMutation({
    mutationFn: () =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: referral.data?.target?.id,
        referredBy: referral.data?.referrer.name,
        note: DEFAULT_ACCESS_REQUEST_NOTE,
      }),
    onSuccess: () => {
      clearInviteReturn();
      showToast('Request sent');
      if (referral.data?.target) navigate(`/company/${referral.data.target.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  });

  const redeem = useMutation({
    mutationFn: () => api.post<AccessRequestView>(`/referrals/${token}/redeem`, {}),
    onSuccess: (data) => {
      clearInviteReturn();
      showToast('Request sent');
      navigate(`/company/${data.company.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  });

  if (referral.isLoading) {
    return <LoadingBlock label="Opening invite…" />;
  }
  if (referral.isError || !referral.data) {
    return (
      <>
        <PageHeader title="Invite" />
        <ErrorState message="This referral link is invalid or expired." />
      </>
    );
  }

  const data = referral.data;
  const isOpenInvite = !data.target;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={isOpenInvite ? 'Connect' : "You've been referred"} />
      <Card className="flex flex-col items-center gap-3 text-center">
        <Avatar name={data.referrer.name} imageUrl={data.referrer.logoUrl} size={56} />
        {isOpenInvite ? (
          <>
            <p className="text-sm text-muted">Request to connect with</p>
            <p className="text-lg font-semibold text-ink">{data.referrer.name}</p>
            {data.referrer.city ? <p className="text-sm text-muted">{data.referrer.city}</p> : null}
          </>
        ) : (
          <>
            <p className="text-sm text-ink">
              <span className="font-semibold">{data.referrer.name}</span> vouches for
            </p>
            <p className="text-lg font-semibold text-ink">{data.target!.name}</p>
            <p className="text-sm text-muted">{data.target!.city}</p>
          </>
        )}
        {data.note ? <p className="text-sm text-muted">“{data.note}”</p> : null}
      </Card>

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

      {isOpenInvite ? (
        <Button fullWidth disabled={redeem.isPending} onClick={() => redeem.mutate()}>
          {redeem.isPending ? 'Sending…' : `Request access to ${data.referrer.name}`}
        </Button>
      ) : (
        <Button fullWidth disabled={requestAccess.isPending} onClick={() => requestAccess.mutate()}>
          {requestAccess.isPending ? 'Sending…' : `Request access to ${data.target!.name}`}
        </Button>
      )}
    </div>
  );
}
