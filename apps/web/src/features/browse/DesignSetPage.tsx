import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import type { ExploreProductPreviewView } from '@ekum/domain-types';
import { parseDesignSetIds } from '@/features/browse/designSetPath';
import {
  designSetSlides,
  designShopLine,
  firstSlideIndexForProduct,
} from '@/features/browse/designSetSlides';
import { api, ApiError } from '@/lib/apiClient';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { PageHeader } from '@/ui/PageHeader';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { EmptyState, ErrorState, LoadingBlock } from '@/ui/kit';
import { LockIcon } from '@/ui/icons';

type SetTile =
  | { id: string; status: 'ok'; product: ExploreProductPreviewView }
  | { id: string; status: 'locked'; name: string }
  | { id: string; status: 'missing' };

/**
 * Virtual design set — clubbed designs from chat / 48h share.
 * Access is per design (same as opening each alone). Not a Collection.
 */
export function DesignSetPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ids = useMemo(() => parseDesignSetIds(params.get('ids')), [params]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['explore-product', id],
      queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${id}`),
      retry: false,
      enabled: ids.length >= 1,
    })),
  });

  const loading = queries.some((q) => q.isLoading);
  const tiles: SetTile[] = useMemo(() => ids.map((id, index) => {
    const q = queries[index];
    if (q?.isSuccess && q.data) {
      if (!q.data.visible) {
        return { id, status: 'locked', name: q.data.name };
      }
      return { id, status: 'ok', product: q.data };
    }
    if (q?.isError) {
      const err = q.error;
      const locked =
        err instanceof ApiError && (err.statusCode === 403 || err.statusCode === 404);
      return {
        id,
        status: locked ? 'locked' : 'missing',
        name: 'Design',
      };
    }
    return { id, status: 'missing' as const };
  }), [ids, queries]);

  const visibleCount = tiles.filter((t) => t.status === 'ok').length;
  const slides = useMemo(() => {
    const products = tiles
      .filter((tile): tile is Extract<SetTile, { status: 'ok' }> => tile.status === 'ok')
      .map((tile) => tile.product);
    return designSetSlides(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        images: product.images.map((url) => toAbsoluteMediaUrl(url) || url),
        companyName: product.company.name,
      })),
    );
  }, [tiles]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    if (autoOpened || slides.length < 1) return;
    setViewerIndex(0);
    setViewerOpen(true);
    setAutoOpened(true);
  }, [autoOpened, slides.length]);

  const openAtProduct = (productId: string) => {
    if (slides.length < 1) return;
    setViewerIndex(firstSlideIndexForProduct(slides, productId));
    setViewerOpen(true);
  };

  if (ids.length < 1) {
    return (
      <div className="flex min-h-full flex-col bg-canvas" data-testid="design-set-page">
        <PageHeader title="Designs" onBack={() => navigate(-1)} />
        <EmptyState title="No designs" message="This set has no designs to open." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-col bg-canvas" data-testid="design-set-page">
        <PageHeader title="Designs" onBack={() => navigate(-1)} />
        <LoadingBlock />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas" data-testid="design-set-page">
      <PageHeader
        title="Designs"
        subtitle={`${ids.length} design${ids.length === 1 ? '' : 's'}${
          visibleCount < ids.length ? ` · ${visibleCount} you can open` : ''
        }`}
        onBack={() => navigate(-1)}
      />
      <div className="grid grid-cols-2 gap-2 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        {tiles.map((tile) => {
          if (tile.status === 'ok') {
            const thumb = tile.product.images[0] ?? null;
            const shop = designShopLine(tile.product.company.name);
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => openAtProduct(tile.product.id)}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left active:opacity-90"
                data-testid="design-set-tile"
              >
                {thumb ? (
                  <img
                    src={toAbsoluteMediaUrl(thumb)}
                    alt=""
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-foam text-lg font-bold text-muted">
                    {tile.product.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-semibold text-ink">{tile.product.name}</p>
                  {shop ? <p className="truncate text-xs text-muted">{shop}</p> : null}
                </div>
              </button>
            );
          }

          return (
            <div
              key={tile.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
              data-testid="design-set-tile-locked"
            >
              <div className="relative flex aspect-[3/4] items-center justify-center bg-foam">
                <LockIcon width={22} height={22} className="text-muted" aria-hidden />
              </div>
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold text-muted">
                  {tile.status === 'locked'
                    ? tile.name && tile.name !== 'Design'
                      ? tile.name
                      : 'Can’t open'
                    : 'Unavailable'}
                </p>
                <p className="text-xs text-muted">Same rules as this design alone</p>
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount === 0 ? (
        <div className="px-3 pb-6">
          <ErrorState message="None of these designs are open to you." />
        </div>
      ) : null}
      <PhotoViewer
        open={viewerOpen && slides.length > 0}
        urls={slides.map((slide) => slide.url)}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerOpen(false)}
        captions={slides.map((slide) => slide.caption)}
        details={slides.map((slide) => slide.detail)}
      />
    </div>
  );
}
