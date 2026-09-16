import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ShareLinkView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { stashInviteReturn } from '@/lib/inviteReturn';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { PhotoAlbum } from '@/features/chats/PhotoAlbum';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { Button, ErrorState, LoadingBlock } from '@/ui/kit';

function viewerPath(data: ShareLinkView): string {
  return data.kind === 'collection'
    ? `/collections/${data.targetId}`
    : `/explore/products/${data.targetId}`;
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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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
  // Single album/design: jump to the live viewer. Designs set stays on this page.
  if (authenticated && data.kind !== 'designs') {
    return <Navigate to={viewerPath(data)} replace />;
  }

  const collageUrls = data.designs
    .map((design) => design.image)
    .filter((url): url is string => Boolean(url))
    .map((url) => toAbsoluteMediaUrl(url));
  const openDesign = (designId: string) => {
    if (authenticated) {
      navigate(`/explore/products/${designId}`);
      return;
    }
    goJoin();
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col gap-4 pb-6">
        <p className="text-xs font-semibold text-accent">Ekum</p>
        {data.kind === 'designs' ? (
          <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            {collageUrls.length > 0 ? (
              <PhotoAlbum
                urls={collageUrls}
                size="full"
                interactive
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
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-ink">{data.name}</p>
              <p className="text-xs text-muted">
                {data.companyName} · {kindLabel(data.kind)} · 48 hours
              </p>
            </div>
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
                onClick={() => openDesign(design.id)}
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
        {data.kind === 'designs' && data.open && data.designs.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {data.designs.map((design, index) => (
              <button
                key={design.id}
                type="button"
                onClick={() => {
                  if (authenticated) {
                    navigate(`/explore/products/${design.id}`);
                    return;
                  }
                  if (design.image) {
                    setViewerIndex(index);
                    return;
                  }
                  goJoin();
                }}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left"
                data-testid="share-link-design"
              >
                {design.image ? (
                  <img
                    src={toAbsoluteMediaUrl(design.image)}
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
      <Button
        fullWidth
        onClick={() => {
          if (authenticated && data.kind === 'designs' && data.designs[0]) {
            navigate(`/explore/products/${data.designs[0].id}`);
            return;
          }
          goJoin();
        }}
      >
        {data.open ? 'Open on Ekum' : 'Request access'}
      </Button>
      {viewerIndex !== null && collageUrls.length > 0 ? (
        <PhotoViewer
          open
          urls={collageUrls}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </div>
  );
}
