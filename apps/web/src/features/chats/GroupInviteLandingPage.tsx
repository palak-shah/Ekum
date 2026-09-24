import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AccessRequestView, GroupInviteLandingView, ThreadDetail } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { DEFAULT_ACCESS_REQUEST_NOTE } from '@/lib/accessRequestNote';
import { clearInviteReturn, stashInviteReturn } from '@/lib/inviteReturn';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, ErrorState, LoadingBlock } from '@/ui/kit';

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col gap-5">{children}</div>
    </div>
  );
}

export function GroupInviteLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { status } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const invite = useQuery({
    queryKey: ['group-invite', token],
    queryFn: () => api.publicGet<GroupInviteLandingView>(`/group-invites/${token}`),
    enabled: Boolean(token),
  });

  const join = useMutation({
    mutationFn: () => api.post<ThreadDetail>(`/group-invites/${token}/join`, {}),
    onSuccess: (detail) => {
      clearInviteReturn();
      navigate(`/chats/${detail.id}`, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not join this group.');
    },
  });

  const requestAccess = useMutation({
    mutationFn: () =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: invite.data?.host.id,
        note: DEFAULT_ACCESS_REQUEST_NOTE,
      }),
    onSuccess: () => {
      showToast('Request sent');
      if (invite.data?.host.id) navigate(`/company/${invite.data.host.id}`, { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send request.'),
  });

  const goLogin = () => {
    const returnTo = `/g/${token}`;
    stashInviteReturn(returnTo);
    navigate('/login', { state: { from: returnTo } });
  };

  if (status === 'loading' || invite.isLoading) {
    return (
      <InviteShell>
        <LoadingBlock label="Opening invite…" />
      </InviteShell>
    );
  }

  if (invite.isError || !invite.data) {
    return (
      <InviteShell>
        <p className="text-xs font-semibold text-accent">Ekum</p>
        <ErrorState message="This invite link is invalid or expired." />
      </InviteShell>
    );
  }

  const view = invite.data;
  const photo = toAbsoluteMediaUrl(view.imageUrl) ?? view.imageUrl;
  const signedIn = status === 'authenticated';
  const needsConnect = error?.toLowerCase().includes('connect');

  return (
    <InviteShell>
      <p className="text-xs font-semibold text-accent">Ekum</p>
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-foam text-lg font-semibold text-muted">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Avatar name={view.title} size={80} />
          )}
        </div>
        <h1 className="text-center text-xl font-semibold tracking-tight text-ink">{view.title}</h1>
        {view.blurb ? <p className="text-center text-sm text-muted">{view.blurb}</p> : null}
        <p className="text-center text-sm text-muted">From {view.host.name}</p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!signedIn ? (
        <Button fullWidth onClick={goLogin}>
          Sign in to join
        </Button>
      ) : needsConnect ? (
        <Button fullWidth disabled={requestAccess.isPending} onClick={() => requestAccess.mutate()}>
          {requestAccess.isPending ? 'Sending…' : `Request to connect with ${view.host.name}`}
        </Button>
      ) : (
        <Button fullWidth disabled={join.isPending} onClick={() => join.mutate()}>
          {join.isPending ? 'Joining…' : 'Join group'}
        </Button>
      )}
    </InviteShell>
  );
}
