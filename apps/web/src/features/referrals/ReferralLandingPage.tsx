import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AccessRequestView, ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, Card, ErrorState, LoadingBlock } from '@/ui/kit';

export function ReferralLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
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
      }),
    onSuccess: () => referral.data?.target && navigate(`/company/${referral.data.target.id}`),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  });

  if (referral.isLoading) {
    return <LoadingBlock label="Opening invite…" />;
  }
  if (referral.isError || !referral.data) {
    return (
      <>
        <PageHeader title="Referral" />
        <ErrorState message="This referral link is invalid or expired." />
      </>
    );
  }

  const data = referral.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="You've been referred" />
      <Card className="flex flex-col items-center gap-3 text-center">
        <Avatar name={data.referrer.name} size={56} />
        <p className="text-sm text-ink">
          <span className="font-semibold">{data.referrer.name}</span> vouches for
        </p>
        {data.target ? (
          <>
            <p className="text-lg font-semibold text-ink">{data.target.name}</p>
            <p className="text-sm text-muted">{data.target.city}</p>
          </>
        ) : (
          <p className="text-sm text-muted">an open invite to join Ekum.</p>
        )}
        {data.note ? <p className="text-sm text-muted">“{data.note}”</p> : null}
      </Card>

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

      {data.target ? (
        <Button fullWidth disabled={requestAccess.isPending} onClick={() => requestAccess.mutate()}>
          {requestAccess.isPending ? 'Sending…' : `Request access to ${data.target.name}`}
        </Button>
      ) : (
        <Button fullWidth onClick={() => navigate('/explore')}>
          Explore businesses
        </Button>
      )}
    </div>
  );
}
