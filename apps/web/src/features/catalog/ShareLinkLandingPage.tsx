import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MEDIA_VARIANT, type ShareLinkClaimView, type ShareLinkView } from '@ekum/domain-types';
import { designSetPath } from '@/features/browse/designSetPath';
import { DesignAlbumGrid } from '@/features/chats/DesignAlbumGrid';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { stashInviteReturn } from '@/lib/inviteReturn';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { Button, ErrorState, LoadingBlock } from '@/ui/kit';
import { ManagedImage } from '@/ui/ManagedImage';

function fallbackViewerPath(data: ShareLinkView): string {
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
  const claimed = useRef(false);
  const [claimError, setClaimError] = useState(false);
  const [claiming, setClaiming] = useState(false);

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

  const authenticated =
    status === 'authenticated' && session && !session.needsOnboarding;

  useEffect(() => {
    if (!authenticated || !token || claimed.current || link.isLoading || link.isError) {
      return;
    }
    if (!link.data || link.data.expired) return;
    claimed.current = true;
    setClaiming(true);
    void (async () => {
      try {
        const result = await api.post<ShareLinkClaimView>(`/share-links/${token}/claim`);
        navigate(result.path || fallbackViewerPath(link.data), { replace: true });
      } catch {
        setClaimError(true);
        setClaiming(false);
        claimed.current = false;
      }
    })();
  }, [authenticated, token, link.isLoading, link.isError, link.data, navigate]);

  if (status === 'loading' || link.isLoading || (authenticated && claiming && !claimError)) {
    return <LoadingBlock label="Opening…" />;
  }

  if (link.isError || !link.data || link.data.expired) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <ErrorState message="This link has expired." />
        <Button className="mt-4" fullWidth variant="secondary" onClick={() => navigate('/explore')}>
          Go to Explore
        </Button>
      </div>
    );
  }

  const data = link.data;

  if (status === 'authenticated' && session?.needsOnboarding) {
    return <Navigate to="/onboarding" replace state={{ from: `/s/${token}` }} />;
  }

  if (authenticated && claimError) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <ErrorState message="Couldn’t open this link." />
        <Button className="mt-4" fullWidth onClick={() => navigate(fallbackViewerPath(data), { replace: true })}>
          Try opening anyway
        </Button>
        <Button className="mt-2" fullWidth variant="secondary" onClick={() => navigate('/explore')}>
          Go to Explore
        </Button>
      </div>
    );
  }

  if (authenticated) {
    return <LoadingBlock label="Opening…" />;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <p className="text-xs font-emphasis text-accent">Ekum</p>
        {data.kind === 'designs' ? (
          <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            <div className="px-4 pb-1 pt-3">
              <p className="text-sm font-emphasis text-ink">{data.name}</p>
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
              <ManagedImage
                src={toAbsoluteMediaUrl(data.image)}
                alt=""
                variant={MEDIA_VARIANT.Thumbnail2}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-accent text-lg font-emphasis text-white">
                Ekum
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            {data.image ? (
              <ManagedImage src={data.image} alt="" variant={MEDIA_VARIANT.Thumbnail2} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-accent text-lg font-emphasis text-white">
                Ekum
              </div>
            )}
            <div className="px-4 py-3">
              <p className="text-sm font-emphasis text-ink">{data.name}</p>
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
                  <ManagedImage
                    src={design.image}
                    alt=""
                    variant={MEDIA_VARIANT.Thumbnail1}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-foam text-lg font-body text-muted">
                    {design.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="truncate px-2 py-1.5 text-xs font-emphasis text-ink">
                  {design.name}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <Button fullWidth onClick={goJoin}>
        {data.open ? 'Open on Ekum' : 'Request to access'}
      </Button>
    </div>
  );
}
