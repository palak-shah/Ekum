import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingBlock, cx } from '@/ui/kit';

export function AdminLayout() {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas">
        <LoadingBlock label="Opening Admin…" />
      </div>
    );
  }

  if (status === 'anonymous' || !session) {
    return <Navigate to="/login" replace />;
  }

  if (!session.user.isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col bg-canvas">
      <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-body uppercase tracking-wide text-muted">Ekum</p>
            <h1 className="text-lg font-emphasis text-ink">Admin Console</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg bg-foam px-3 py-2 text-sm font-emphasis text-ink"
            data-testid="admin-back-to-ekum"
          >
            Back to Ekum
          </Link>
        </div>
        <nav className="mt-3 flex gap-2">
          <NavLink
            to="/admin/tags"
            className={({ isActive }) =>
              cx(
                'rounded-full px-3 py-1.5 text-sm font-emphasis',
                isActive ? 'bg-accent text-white' : 'bg-foam text-muted',
              )
            }
          >
            Tags
          </NavLink>
        </nav>
      </header>
      <main className="ekum-shell-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
