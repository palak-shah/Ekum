import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ShareLinkView } from '@ekum/domain-types';
import { designSetPath } from '@/features/browse/designSetPath';
import { DesignAlbumGrid } from '@/features/chats/DesignAlbumGrid';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { stashInviteReturn } from '@/lib/inviteReturn';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { Button, ErrorState, LoadingBlock } from '@/ui/kit';

function viewerPath(data: ShareLinkView): string {
  if (data.kind === 'collection') return `/collections/${data.targetId}`;
  if (data.kind === 'designs') {
    return designSetPath(data.designs.map((d) => d.id));
  }
  return `/explore/products/${data.targetId}`;
}

function kindLabel(kind: ShareLinkView['kind']): string {
  if (kind === 'collection') return 'Collection';
  if (kind === 'designs') return 'Designs';
  return 'Design';
}

export function ShareLinkLandingPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { status, session } = useAuth();

  const link = useQuery({
    queryKey: ['share-link', token],
    queryFn: () => api.publicGet<ShareLinkView>(`/share-links/${token}`),
    enabled: Boolean(token),
  });

  const goJoin = () => {
    const returnTo = `/s/${token}`;
    stashInviteReturn(returnTo);
    navigate('/login', { state: { from: returnTo } });
  };

  if (status === 'loading' || link.isLoading) {
    return <LoadingBlock label="Opening…" />;
  }

  if (link.isError || !link.data || link.data.expired) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <ErrorState message="This link has expired." />
      </div>
    );
  }

  const data = link.data;
  const authenticated =
    status === 'authenticated' && session && !session.needsOnboarding;

  if (status === 'authenticated' && session?.needsOnboarding) {
    return <Navigate to="/onboarding" replace state={{ from: `/s/${token}` }} />;
  }
  if (authenticated) {
    return <Navigate to={viewerPath(data)} replace />;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <p className="text-xs font-semibold text-accent">Ekum</p>
        {data.kind === 'designs' ? (
          <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            <div className="px-4 pb-1 pt-3">
              <p className="text-sm font-semibold text-ink">{data.name}</p>
              <p className="text-xs text-muted">
                {data.companyName} · {kindLabel(data.kind)} · 48 hours
              </p>
            </div>
            {data.open && data.designs.length > 0 ? (
              <DesignAlbumGrid
                items={data.designs}
                interactive
                onOpenDesign={() => goJoin()}
              />
            ) : data.image ? (
              <img
                src={toAbsoluteMediaUrl(data.image)}
                alt=""
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-accent text-lg font-bold text-white">
                Ekum
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            {data.image ? (
              <img src={data.image} alt="" className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-accent text-lg font-bold text-white">
                Ekum
              </div>
            )}
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-ink">{data.name}</p>
              <p className="text-xs text-muted">
                {kindLabel(data.kind)} · 48 hours
              </p>
            </div>
          </div>
        )}
        {data.open && data.designs.length > 0 && data.kind !== 'designs' ? (
          <div className="grid grid-cols-2 gap-2">
            {data.designs.map((design) => (
              <button
                key={design.id}
                type="button"
                onClick={goJoin}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left"
              >
                {design.image ? (
                  <img
                    src={design.image}
                    alt=""
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-foam text-lg font-bold text-muted">
                    {design.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="truncate px-2 py-1.5 text-xs font-semibold text-ink">
                  {design.name}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <Button fullWidth onClick={goJoin}>
        {data.open ? 'Open on Ekum' : 'Request access'}
      </Button>
    </div>
  );
}
