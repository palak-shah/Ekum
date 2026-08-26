import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AuthTokens, SessionUser, TeamInviteView } from '@ekum/domain-types';
import { api, ApiError, setTokens } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { clearInviteReturn, stashInviteReturn } from '@/lib/inviteReturn';
import { useToast } from '@/ui/Toast';
import { Avatar, Button, Card, ErrorState, LoadingBlock } from '@/ui/kit';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length < 4) return '••••';
  return `••••${digits.slice(-4)}`;
}

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="ekum-rise flex flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}

export function TeamInviteLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { status, session, login, logout } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const invite = useQuery({
    queryKey: ['team-invite', token],
    queryFn: () => api.publicGet<TeamInviteView>(`/team/invites/${token}`),
    enabled: Boolean(token),
  });

  const join = useMutation({
    mutationFn: () =>
      api.post<{ tokens: AuthTokens; companyId: string }>(`/team/invites/${token}/join`, {}),
    onSuccess: async (result) => {
      setTokens(result.tokens);
      const me = await api.get<{ user: SessionUser; needsOnboarding: boolean }>('/auth/me');
      login({
        tokens: result.tokens,
        user: me.user,
        needsOnboarding: me.needsOnboarding,
      });
      clearInviteReturn();
      showToast('You joined the team.');
      navigate('/', { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not join.'),
  });

  const goSignIn = () => {
    const returnTo = `/t/${token}`;
    stashInviteReturn(returnTo);
    navigate('/login', { state: { from: returnTo } });
  };

  const switchToInvitePhone = async () => {
    const returnTo = `/t/${token}`;
    stashInviteReturn(returnTo);
    await logout();
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
        <ErrorState message="This team invite is not valid." />
      </InviteShell>
    );
  }

  const data = invite.data;
  const blocked = data.expired || data.used;
  const isAnonymous = status === 'anonymous' || !session;
  const needsOnboarding = session?.needsOnboarding ?? false;
  const signedInMasked = session?.user.phone ? maskPhone(session.user.phone) : null;
  const phoneMismatch =
    !isAnonymous && signedInMasked != null && signedInMasked !== data.phoneMasked;
  const hasOtherBusiness =
    status === 'authenticated' && session && !needsOnboarding && session.user.companyId !== data.company.id;
  const alreadyOnTeam =
    status === 'authenticated' && session && !needsOnboarding && session.user.companyId === data.company.id;
  const wrongPhone = phoneMismatch || error === 'Sign in with the phone on this invite.';

  return (
    <InviteShell>
      <div className="text-center">
        <p className="text-xs font-semibold text-accent">Team invite</p>
        <h1 className="mt-1 text-xl font-bold text-ink">Join {data.company.name}</h1>
      </div>

      <Card className="flex flex-col items-center gap-3 text-center">
        <Avatar name={data.company.name} imageUrl={data.company.logoUrl} size={56} />
        <p className="text-sm text-muted">You&apos;ll join as</p>
        <p className="text-lg font-semibold text-ink">{data.name}</p>
        <p className="text-sm text-muted">Phone {data.phoneMasked}</p>
        {data.company.city ? <p className="text-sm text-muted">{data.company.city}</p> : null}
      </Card>

      {blocked ? (
        <p className="text-center text-sm text-muted">
          {data.used ? 'This invite was already used.' : 'This invite has expired.'}
        </p>
      ) : null}

      {wrongPhone && !blocked ? (
        <p className="text-center text-sm text-danger">
          This invite is for {data.phoneMasked}.
          {signedInMasked ? ` You're signed in as ${signedInMasked}.` : ''}
        </p>
      ) : error && !wrongPhone ? (
        <p className="text-center text-sm text-danger">{error}</p>
      ) : null}

      {isAnonymous && !blocked ? (
        <>
          <p className="text-center text-sm text-muted">
            Sign in with {data.phoneMasked} to join the team.
          </p>
          <Button fullWidth onClick={goSignIn}>
            Sign in to join
          </Button>
        </>
      ) : null}

      {!isAnonymous && alreadyOnTeam ? (
        <Button fullWidth onClick={() => navigate('/', { replace: true })}>
          Go to Ekum
        </Button>
      ) : null}

      {!isAnonymous && hasOtherBusiness ? (
        <p className="text-center text-sm text-muted">
          This phone already has a business on Ekum. Team invites are for staff without their own
          business.
        </p>
      ) : null}

      {!isAnonymous && wrongPhone && !blocked ? (
        <Button fullWidth onClick={() => void switchToInvitePhone()}>
          Sign in with {data.phoneMasked}
        </Button>
      ) : null}

      {!isAnonymous && !blocked && !alreadyOnTeam && !hasOtherBusiness && !wrongPhone ? (
        <Button fullWidth disabled={join.isPending} onClick={() => join.mutate()}>
          {join.isPending ? 'Joining…' : `Join ${data.company.name}`}
        </Button>
      ) : null}
    </InviteShell>
  );
}
