import type { ReactNode } from 'react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AccessRequestView, ReferralView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { DEFAULT_ACCESS_REQUEST_NOTE } from '@/lib/accessRequestNote';
import { clearInviteReturn, stashInviteReturn } from '@/lib/inviteReturn';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, ErrorState, LoadingBlock } from '@/ui/kit';

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col gap-5">{children}</div>
    </div>
  );
}

export function ReferralLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { status, session } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const referral = useQuery({
    queryKey: ['referral', token],
    queryFn: () => api.publicGet<ReferralView>(`/referrals/${token}`),
    enabled: Boolean(token),
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
      if (referral.data?.target) navigate(`/company/${referral.data.target.id}`, { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  });

  const redeem = useMutation({
    mutationFn: () => api.post<AccessRequestView>(`/referrals/${token}/redeem`, {}),
    onSuccess: (data) => {
      clearInviteReturn();
      showToast('Request sent');
      navigate(`/company/${data.company.id}`, { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  });

  const goJoin = () => {
    const returnTo = `/r/${token}`;
    stashInviteReturn(returnTo);
    navigate('/login', { state: { from: returnTo } });
  };

  if (status === 'loading' || referral.isLoading) {
    return (
      <InviteShell>
        <LoadingBlock label="Opening invite…" />
      </InviteShell>
    );
  }

  if (referral.isError || !referral.data) {
    return (
      <InviteShell>
        <p className="text-xs font-semibold text-accent">Ekum</p>
        <ErrorState message="This invite link is invalid or expired." />
      </InviteShell>
    );
  }

  if (status === 'authenticated' && session?.needsOnboarding) {
    return <Navigate to="/onboarding" replace state={{ from: `/r/${token}` }} />;
  }

  const data = referral.data;
  const isOpenInvite = !data.target;
  const hero = isOpenInvite ? data.referrer : data.target!;
  const guest = status !== 'authenticated';
  const busy = redeem.isPending || requestAccess.isPending;

  const onPrimary = () => {
    if (guest) {
      goJoin();
      return;
    }
    if (isOpenInvite) redeem.mutate();
    else requestAccess.mutate();
  };

  return (
    <InviteShell>
      <p className="text-xs font-semibold text-accent">Ekum</p>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Avatar name={hero.name} imageUrl={hero.logoUrl} size={72} />
        {isOpenInvite ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {data.referrer.name} invited you
              </h1>
              {data.referrer.city ? (
                <p className="text-sm text-muted">{data.referrer.city}</p>
              ) : null}
            </div>
            <p className="max-w-xs text-sm text-muted">
              Connect on Ekum to see their designs and chat about trade.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {data.referrer.name} introduced you to {data.target!.name}
              </h1>
              {data.target!.city ? (
                <p className="text-sm text-muted">{data.target!.city}</p>
              ) : null}
            </div>
            <p className="max-w-xs text-sm text-muted">
              Connect on Ekum to see their designs and chat about trade.
            </p>
          </>
        )}
        {data.note ? (
          <p className="max-w-xs text-sm italic text-muted">“{data.note}”</p>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      <Button fullWidth disabled={busy} onClick={onPrimary}>
        {busy
          ? 'Sending…'
          : guest
            ? 'Join Ekum to connect'
            : 'Request to connect'}
      </Button>
    </InviteShell>
  );
}
