import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import type { ExploreProductPreviewView } from '@ekum/domain-types';
import { parseDesignSetIds } from '@/features/browse/designSetPath';
import {
  designSetFactLines,
  designSetSlides,
  firstSlideIndexForProduct,
} from '@/features/browse/designSetSlides';
import { designSetOpenIds, designSetToShortlist } from '@/features/browse/designSetShortlist';
import { applySelectingPill } from '@/features/browse/selectingPill';
import { selectAllState } from '@/features/browse/selectAllState';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  type DesignBrowseLayout,
  designBrowsePhotoClass,
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { CatalogFeedPost } from '@/ui/cards';
import { PageHeader } from '@/ui/PageHeader';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { Button, EmptyState, ErrorState, LoadingBlock, cx } from '@/ui/kit';
import { usePageOwnsBottomBand } from '@/features/browse/selectionBottomBand';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { packHandlerName } from '@/features/browse/packOrderSource';
import { sellerIdForEntries, useShortlistOrderFlow } from '@/features/browse/useShortlistOrderFlow';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { useTradePresence } from '@/lib/tradePresence';
import { CheckIcon, LockIcon } from '@/ui/icons';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';

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
  const me = useMyCompany();
  const companyId = me.data?.id ?? null;
  const [params] = useSearchParams();
  const ids = useMemo(() => parseDesignSetIds(params.get('ids')), [params]);
  const quoteThreadId = params.get('thread')?.trim() || '';
  const quoteMessageId = params.get('msg')?.trim() || '';
  const canQuote = Boolean(quoteThreadId && quoteMessageId);
  const [layout, setLayout] = useState<DesignBrowseLayout>(() =>
    readDesignBrowseLayout(companyId),
  );
  const shortlist = useBrowseShortlist();
  const orderFlow = useShortlistOrderFlow();
  const { trading } = useTradePresence();
  const [curateOpen, setCurateOpen] = useState(false);

  useEffect(() => {
    setLayout(readDesignBrowseLayout(companyId));
  }, [companyId]);

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

  const openIds = useMemo(() => designSetOpenIds(tiles), [tiles]);
  const visibleCount = openIds.length;
  const thisSetCount = openIds.filter((id) => shortlist.productIds.has(id)).length;
  const selectAll = selectAllState(openIds, shortlist.productIds);
  const selecting = shortlist.selectMode || thisSetCount > 0;
  const setEntries = shortlist.entries.filter((entry) => openIds.includes(entry.productId));
  const visitorSetCount = setEntries.filter((entry) => entry.companyId !== companyId).length;
  const dockUp = visitorSetCount > 0;
  usePageOwnsBottomBand(dockUp);
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
        rate: product.rate,
        unit: product.unit,
        moq: product.moq,
        categories: product.categories,
      })),
    );
  }, [tiles]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openAtProduct = (productId: string) => {
    if (slides.length < 1) return;
    setViewerIndex(firstSlideIndexForProduct(slides, productId));
    setViewerOpen(true);
  };

  const toggleLayout = () => {
    setLayout((prev) => {
      const next = prev === 'feed' ? 'grid' : 'feed';
      writeDesignBrowseLayout(companyId, next);
      return next;
    });
  };

  const toggleProduct = (product: ExploreProductPreviewView) => {
    shortlist.toggle(designSetToShortlist(product));
  };

  const onDesignActivate = (product: ExploreProductPreviewView) => {
    if (selecting) {
      toggleProduct(product);
      return;
    }
    openAtProduct(product.id);
  };

  const onDesignLongSelect = (product: ExploreProductPreviewView) => {
    setViewerOpen(false);
    shortlist.setSelectMode(true);
    toggleProduct(product);
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
    <div
      className={cx(
        'flex min-h-full flex-col bg-canvas',
        dockUp && 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]',
        !dockUp && thisSetCount > 0 && 'pb-[calc(5rem+5.5rem)]',
      )}
      data-testid="design-set-page"
    >
      <PageHeader
        title="Designs"
        subtitle={`${ids.length} design${ids.length === 1 ? '' : 's'}${
          visibleCount < ids.length ? ` · ${visibleCount} you can open` : ''
        }`}
        onBack={() => navigate(-1)}
        action={
          visibleCount > 0 ? (
            <div className="flex items-center gap-2">
              {selecting ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    data-testid="select-all-float-select-all"
                    disabled={selectAll.allSelected}
                    className="text-xs font-bold text-accent disabled:opacity-40"
                    onClick={() => {
                      const openProducts = tiles.flatMap((tile) =>
                        tile.status === 'ok' ? [tile.product] : [],
                      );
                      shortlist.addMany(openProducts.map(designSetToShortlist));
                    }}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    data-testid="select-all-float-clear"
                    className="text-xs font-bold text-accent"
                    onClick={() => shortlist.removeIds(openIds)}
                  >
                    Clear
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                data-testid="design-set-select"
                className={cx(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                  selecting ? 'bg-accent text-white' : 'text-accent hover:bg-accent/5',
                )}
                onClick={() => {
                  setViewerOpen(false);
                  applySelectingPill(selecting, thisSetCount, {
                    clear: () => shortlist.removeIds(openIds),
                    setSelectMode: shortlist.setSelectMode,
                  });
                }}
              >
                {selecting ? 'Selecting' : 'Select'}
              </button>
              <button
                type="button"
                data-testid="design-set-layout-toggle"
                aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
                onClick={toggleLayout}
              >
                {layout === 'feed' ? 'Grid' : 'Feed'}
              </button>
            </div>
          ) : null
        }
      />
      <div
        className={cx(
          'pb-28 pt-2',
          layout === 'feed' ? 'flex flex-col' : 'grid grid-cols-2 gap-2 px-3',
        )}
      >
        {tiles.map((tile) => {
          if (tile.status === 'ok') {
            return (
              <DesignSetTile
                key={tile.id}
                product={tile.product}
                layout={layout}
                selected={shortlist.productIds.has(tile.product.id)}
                selectMode={selecting}
                onActivate={() => onDesignActivate(tile.product)}
                onLongSelect={() => onDesignLongSelect(tile.product)}
              />
            );
          }

          return (
            <div
              key={tile.id}
              className={cx(
                'overflow-hidden rounded-2xl border border-line bg-surface',
                layout === 'feed' && 'mx-3',
              )}
              data-testid="design-set-tile-locked"
            >
              <div
                className={cx(
                  'relative flex items-center justify-center bg-foam',
                  layout === 'feed' ? 'aspect-[4/5] w-full' : 'aspect-[3/4]',
                )}
              >
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
      {dockUp ? (
        <div
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2 border-t border-line bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
          data-testid="design-set-trade-dock"
        >
          {trading ? (
            <Button variant="secondary" fullWidth onClick={() => setCurateOpen(true)}>
              Curate
            </Button>
          ) : null}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setViewerOpen(false);
              orderFlow.setError(null);
              orderFlow.setQtyOpen(true);
            }}
          >
            Ask for rates
          </Button>
          <Button
            fullWidth
            data-testid="design-set-order"
            onClick={() => {
              setViewerOpen(false);
              orderFlow.setError(null);
              orderFlow.setQtyOpen(true);
            }}
          >
            Order
          </Button>
        </div>
      ) : null}
      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => orderFlow.setQtyOpen(false)}
        sellerId={sellerIdForEntries(setEntries)}
        products={orderFlow.products.filter((product) => openIds.includes(product.id))}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        orderGoesToName={packHandlerName(setEntries)}
        onSendOrder={(lines) => orderFlow.sendOrder(lines, { collectionId: undefined })}
        onAskRates={(lines) => orderFlow.askRates(lines, { collectionId: undefined })}
      />
      <CurateFromSelectionSheet
        open={curateOpen}
        onClose={() => setCurateOpen(false)}
        productIds={setEntries.map((entry) => entry.productId)}
      />
      <PhotoViewer
        open={viewerOpen && slides.length > 0}
        urls={slides.map((slide) => slide.url)}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerOpen(false)}
        captions={slides.map((slide) => slide.caption)}
        details={slides.map((slide) => slide.detail)}
        headerAction={
          canQuote
            ? {
                label: 'Quote',
                testId: 'photo-viewer-quote',
                onClick: () => {
                  const productId = slides[viewerIndex]?.productId;
                  if (!productId) return;
                  setViewerOpen(false);
                  navigate(`/chats/${quoteThreadId}`, {
                    replace: true,
                    state: { quoteDesign: { messageId: quoteMessageId, productId } },
                  });
                },
              }
            : undefined
        }
      />
    </div>
  );
}

function DesignSetTile({
  product,
  layout,
  selected,
  selectMode,
  onActivate,
  onLongSelect,
}: {
  product: ExploreProductPreviewView;
  layout: DesignBrowseLayout;
  selected: boolean;
  selectMode: boolean;
  onActivate: () => void;
  onLongSelect: () => void;
}) {
  const images = product.images.map((url) => toAbsoluteMediaUrl(url) || url).filter(Boolean);
  const thumb = images[0] ?? null;
  const { meta, detail } = designSetFactLines({
    images,
    companyName: product.company.name,
    rate: product.rate,
    unit: product.unit,
    moq: product.moq,
    categories: product.categories,
  });
  const extraPhotos = Math.max(0, images.length - 1);
  const longPress = useLongPress(onLongSelect);

  if (layout === 'feed') {
    return (
      <CatalogFeedPost
        name={product.name}
        meta={meta || undefined}
        detail={detail || undefined}
        href={`/explore/products/${product.id}`}
        images={thumb ? [thumb] : []}
        imageCount={1}
        company={product.company}
        selected={selected}
        selectMode={selectMode}
        onMediaClick={onActivate}
        onLongSelect={onLongSelect}
        mediaTestId="design-set-tile"
        openTestId="design-set-tile-open"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className={cx(
        'overflow-hidden rounded-2xl border bg-surface text-left active:opacity-90',
        selected ? 'border-accent bg-accent/5' : 'border-line',
        LONG_PRESS_SURFACE_CLASS,
      )}
      data-testid="design-set-tile"
      {...longPress}
    >
      {thumb ? (
        <span className="relative block">
          <img src={thumb} alt="" className={designBrowsePhotoClass('grid')} />
          {selectMode ? (
            <span
              className={cx(
                'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
                selected ? 'border-accent bg-accent' : 'border-line bg-white/90 text-transparent',
              )}
            >
              <CheckIcon width={14} height={14} />
            </span>
          ) : null}
          {extraPhotos > 0 ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">
              +{extraPhotos}
            </span>
          ) : null}
        </span>
      ) : (
        <div className={designBrowsePhotoClass('grid', 'placeholder')}>
          {product.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="px-2.5 py-2">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        {meta ? (
          <p className="truncate text-xs font-medium text-muted">{meta}</p>
        ) : null}
        {detail ? (
          <p className="truncate text-xs font-medium text-muted">{detail}</p>
        ) : null}
      </div>
    </button>
  );
}
