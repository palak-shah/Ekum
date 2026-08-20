import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { stashInviteReturn } from '@/lib/inviteReturn';
import { LoadingBlock } from '@/ui/kit';

/**
 * Auth + onboarding gate. Anonymous users go to /login; authenticated users
 * without a company are held on /onboarding until they create one.
 * Invite deep links (`/r/:token`) are stashed so OTP / onboarding can return.
 */
export function RequireAuth() {
  const { status, session } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <LoadingBlock label="Starting Ekum…" />
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
        state={{ from: location.pathname.startsWith('/r/') ? location.pathname : undefined }}
      />
    );
  }

  return <Outlet />;
}
