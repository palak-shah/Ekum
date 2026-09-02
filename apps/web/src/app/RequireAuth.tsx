import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { stashInviteReturn } from '@/lib/inviteReturn';
import { LoadingBlock } from '@/ui/kit';

/**
 * Auth + onboarding gate. Anonymous users go to /login; authenticated users
 * without a company are held on /onboarding until they create one.
 * Invite deep links (`/r/:token`, `/t/:token`) are stashed so OTP can return.
 */
export function RequireAuth() {
  const { status, session, refreshSession } = useAuth();
  const location = useLocation();

  if (status === 'loading' || status === 'degraded') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6">
        <LoadingBlock
          label={status === 'degraded' ? 'Reconnecting to Ekum…' : 'Starting Ekum…'}
        />
        {status === 'degraded' ? (
          <button
            type="button"
            className="text-sm font-bold text-accent"
            onClick={() => void refreshSession()}
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (status === 'anonymous' || !session) {
    stashInviteReturn(location.pathname);
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (session.needsOnboarding) {
    stashInviteReturn(location.pathname);
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{
          from:
            location.pathname.startsWith('/r/') ||
            location.pathname.startsWith('/o/') ||
            location.pathname.startsWith('/s/') ||
            location.pathname.startsWith('/t/')
              ? location.pathname
              : undefined,
        }}
      />
    );
  }

  return <Outlet />;
}
