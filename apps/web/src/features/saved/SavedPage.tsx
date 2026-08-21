import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SavedItemView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { BrowseSelectBar } from '@/features/browse/BrowseSelectBar';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { selectAllState } from '@/features/browse/selectAllState';
import { applySelectingPill } from '@/features/browse/selectingPill';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { useShortlistOrderFlow } from '@/features/browse/useShortlistOrderFlow';
import { BatchOrderConfirmSheet } from '@/features/orders/BatchOrderConfirmSheet';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { PageHeader } from '@/ui/PageHeader';
import { AlbumGrid } from '@/ui/cards';
import { useToast } from '@/ui/Toast';
import { useLongPress } from '@/ui/useLongPress';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Sheet,
  cx,
} from '@/ui/kit';
import { CheckIcon } from '@/ui/icons';
import { savedAlbumImageCount } from './savedAlbumCount';
import { SAVED_QUERY_KEY, useSavedList } from './useSaveToggle';

type Layout = 'feed' | 'grid';

function savedToEntry(item: SavedItemView): BrowseShortlistEntry | null {
  if (item.kind !== 'product' || !item.productId) return null;
  return {
    productId: item.productId,
    name: item.name,
    thumbUrl: item.thumbUrl ?? item.images?.[0] ?? null,
    companyId: item.company.id,
    companyName: item.company.name,
  };
}

export function SavedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const orderFlow = useShortlistOrderFlow();
  const saved = useSavedList();
  const [layout, setLayout] = useState<Layout>('grid');
  const [viewer, setViewer] = useState<SavedItemView | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [curateOpen, setCurateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('select') === '1') {
      shortlist.setSelectMode(true);
    }
  }, [searchParams]);

  const unsave = useMutation({
    mutationFn: (id: string) => api.del(`/saved/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
      setViewer(null);
      showToast('Removed from Saved');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not remove.', 'danger'),
  });

  const productItems = (saved.data ?? []).filter((item) => item.kind === 'product');
  const visibleSavedIds = productItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));
  const selectAll = selectAllState(visibleSavedIds, shortlist.productIds);
  const onSelectAllAction = () => {
    if (selectAll.action === 'clear') {
      shortlist.removeIds(visibleSavedIds);
      return;
    }
    shortlist.addMany(
      productItems.map(savedToEntry).filter((entry): entry is BrowseShortlistEntry => Boolean(entry)),
    );
  };
  const canCurate =
    shortlist.count > 0 &&
    shortlist.entries.every((entry) => entry.allowForward !== false);

  const onActivateItem = (item: SavedItemView) => {
    if (item.kind === 'collection' && item.collectionId) {
      navigate(`/collections/${item.collectionId}`);
      return;
    }
    if (shortlist.selectMode && item.kind === 'product') {
      const entry = savedToEntry(item);
      if (entry) shortlist.toggle(entry);
      return;
    }
    if (item.kind === 'product') {
      setViewerIndex(0);
      setViewer(item);
    }
  };

  const onLongSelectItem = (item: SavedItemView) => {
    const entry = savedToEntry(item);
    if (!entry) return;
    shortlist.toggle(entry);
  };

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        shortlist.count > 0 && 'pb-[calc(5rem+5.5rem)]',
      )}
    >
      <PageHeader
        title="Saved"
        action={
          saved.data && saved.data.length > 0 ? (
            <div className="flex items-center gap-1">
              {productItems.length > 0 ? (
                <button
                  type="button"
                  className={cx(
                    'rounded-full px-3 py-1.5 text-xs font-bold tracking-tight',
                    shortlist.selectMode ? 'bg-accent text-white' : 'text-accent hover:bg-accent/5',
                  )}
                  onClick={() =>
                    applySelectingPill(shortlist.selectMode, shortlist.count, shortlist)
                  }
                >
                  {shortlist.selectMode ? 'Selecting' : 'Select'}
                </button>
              ) : null}
              <button
                type="button"
                aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
                onClick={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
              >
                {layout === 'feed' ? 'Grid' : 'Feed'}
              </button>
            </div>
          ) : null
        }
      />

      <SelectAllFloat
        open={shortlist.selectMode && visibleSavedIds.length > 0}
        count={shortlist.count}
        action={selectAll.action}
        onAction={onSelectAllAction}
      />

      {saved.isLoading ? (
        <LoadingBlock label="Loading saved…" />
      ) : saved.isError ? (
        <ErrorState
          message="Couldn’t load Saved. Try again."
          onRetry={() => void saved.refetch()}
        />
      ) : saved.data && saved.data.length > 0 ? (
        <>
          {(saved.data ?? []).some((item) => item.kind === 'collection') ? (
            <p className="text-xs text-muted">
              Albums open to pick designs. Select designs here (or in albums) then Curate or Order.
            </p>
          ) : null}
          {layout === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {saved.data.map((item) => (
                <SavedGridTile
                  key={item.id}
                  item={item}
                  selected={Boolean(
                    item.productId && shortlist.productIds.has(item.productId),
                  )}
                  selectMode={shortlist.selectMode}
                  removing={unsave.isPending}
                  onOpen={() => onActivateItem(item)}
                  onLongSelect={
                    item.kind === 'product' ? () => onLongSelectItem(item) : undefined
                  }
                  onUnsave={() => unsave.mutate(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {saved.data.map((item) => (
                <SavedFeedRow
                  key={item.id}
                  item={item}
                  selected={Boolean(
                    item.productId && shortlist.productIds.has(item.productId),
                  )}
                  selectMode={shortlist.selectMode}
                  removing={unsave.isPending}
                  onOpen={() => onActivateItem(item)}
                  onLongSelect={
                    item.kind === 'product' ? () => onLongSelectItem(item) : undefined
                  }
                  onUnsave={() => unsave.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          message="Save designs from Explore or Select a few inside a collection."
          action={
            <Button variant="secondary" onClick={() => navigate('/explore')}>
              Open Explore
            </Button>
          }
        />
      )}

      <BrowseSelectBar
        count={shortlist.count}
        canCurate={canCurate}
        onCurate={() => setCurateOpen(true)}
        canOrder={shortlist.count > 0}
        onOrder={() => {
          orderFlow.setError(null);
          orderFlow.setQtyOpen(true);
        }}
      />

      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => orderFlow.setQtyOpen(false)}
        sellerId={orderFlow.sellerIdForQty}
        products={orderFlow.products}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        onSendOrder={orderFlow.sendOrder}
        onAskRates={orderFlow.askRates}
      />

      <BatchOrderConfirmSheet
        open={orderFlow.confirmOpen}
        result={orderFlow.result}
        onClose={() => orderFlow.setConfirmOpen(false)}
      />

      <CurateFromSelectionSheet open={curateOpen} onClose={() => setCurateOpen(false)} />

      <SavedPhotosSheet
        item={viewer}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewer(null)}
        onUnsave={() => {
          if (viewer) unsave.mutate(viewer.id);
        }}
        unsaving={unsave.isPending}
      />
    </div>
  );
}

function itemMeta(item: SavedItemView): string {
  if (item.kind === 'product') {
    const bits = [item.company.name];
    if (item.sku) bits.push(item.sku);
    bits.push(formatRate(item.rate ?? null, item.unit ?? null));
    return bits.join(' · ');
  }
  const bits = [item.company.name];
  if (item.productCount != null) {
    bits.push(`${item.productCount} design${item.productCount === 1 ? '' : 's'}`);
  } else {
    bits.push('Collection');
  }
  return bits.join(' · ');
}

function SavedGridTile({
  item,
  onOpen,
  onUnsave,
  onLongSelect,
  selected,
  selectMode,
  removing,
}: {
  item: SavedItemView;
  onOpen: () => void;
  onUnsave: () => void;
  onLongSelect?: () => void;
  selected: boolean;
  selectMode: boolean;
  removing: boolean;
}) {
  const images = item.images?.length ? item.images : item.thumbUrl ? [item.thumbUrl] : [];
  const imageCount = savedAlbumImageCount(item, images);
  const longPress = useLongPress(onLongSelect);

  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-2xl border bg-surface',
        selected ? 'border-accent' : 'border-line',
      )}
    >
      <button type="button" className="block w-full text-left" onClick={onOpen} {...longPress}>
        <div className="p-1.5">
          <AlbumGrid images={images} imageCount={imageCount} alt={item.name} />
        </div>
        <div className="px-2.5 pb-2.5">
          <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
          <p className="truncate text-xs text-muted">{itemMeta(item)}</p>
        </div>
      </button>
      {selectMode && item.kind === 'product' ? (
        <span
          className={cx(
            'pointer-events-none absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
            selected ? 'border-accent bg-accent' : 'border-line bg-white/90 text-transparent',
          )}
        >
          <CheckIcon width={14} height={14} />
        </span>
      ) : (
        <button
          type="button"
          aria-label="Remove from Saved"
          disabled={removing}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/55 text-sm font-bold text-white"
          onClick={(event) => {
            event.stopPropagation();
            onUnsave();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function SavedFeedRow({
  item,
  onOpen,
  onUnsave,
  onLongSelect,
  selected,
  selectMode,
  removing,
}: {
  item: SavedItemView;
  onOpen: () => void;
  onUnsave: () => void;
  onLongSelect?: () => void;
  selected: boolean;
  selectMode: boolean;
  removing: boolean;
}) {
  const images = item.images?.length ? item.images : item.thumbUrl ? [item.thumbUrl] : [];
  const imageCount = savedAlbumImageCount(item, images);
  const longPress = useLongPress(onLongSelect);

  return (
    <article className="-mx-4 border-b border-line/70 pb-3.5">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link to={`/company/${item.company.id}`} className="shrink-0">
          <Avatar name={item.company.name} imageUrl={item.company.logoUrl} size={40} />
        </Link>
        <Link to={`/company/${item.company.id}`} className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">
            {item.company.name}
          </p>
          <p className="truncate text-xs font-medium text-muted">
            {item.kind === 'product' ? 'Design' : 'Collection'}
            {item.company.city ? ` · ${item.company.city}` : ''}
          </p>
        </Link>
        {!selectMode ? (
          <button
            type="button"
            aria-label="Remove from Saved"
            disabled={removing}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-muted hover:bg-foam"
            onClick={onUnsave}
          >
            ×
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className={cx('relative block w-full px-3 text-left', selected && 'opacity-95')}
        onClick={onOpen}
        {...longPress}
      >
        <AlbumGrid images={images} imageCount={imageCount} alt={item.name} />
        {selectMode && item.kind === 'product' ? (
          <span
            className={cx(
              'absolute left-5 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-white',
              selected ? 'border-accent bg-accent' : 'border-line bg-white/90 text-transparent',
            )}
          >
            <CheckIcon width={14} height={14} />
          </span>
        ) : null}
      </button>
      <button type="button" className="mt-2 block w-full px-4 text-left" onClick={onOpen}>
        <p className="text-sm font-semibold tracking-tight text-ink">{item.name}</p>
        <p className="text-xs font-medium text-muted">{itemMeta(item)}</p>
      </button>
    </article>
  );
}

function SavedPhotosSheet({
  item,
  index,
  onIndex,
  onClose,
  onUnsave,
  unsaving,
}: {
  item: SavedItemView | null;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  onUnsave: () => void;
  unsaving: boolean;
}) {
  if (!item || item.kind !== 'product') return null;
  const urls = item.images?.length ? item.images : item.thumbUrl ? [item.thumbUrl] : [];
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const current = urls[safeIndex] ?? null;

  return (
    <Sheet open={Boolean(item)} onClose={onClose} title={item.name}>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted">{itemMeta(item)}</p>
        {current ? (
          <img
            src={current}
            alt=""
            className="max-h-[50vh] w-full rounded-2xl bg-foam object-contain"
          />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-foam text-muted">
            No photos
          </div>
        )}
        {urls.length > 1 ? (
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" disabled={safeIndex <= 0} onClick={() => onIndex(safeIndex - 1)}>
              Prev
            </Button>
            <p className="text-xs font-medium text-muted">
              {safeIndex + 1} / {urls.length}
            </p>
            <Button
              variant="ghost"
              disabled={safeIndex >= urls.length - 1}
              onClick={() => onIndex(safeIndex + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
        {item.productId ? (
          <Link to={`/explore/products/${item.productId}`} className="block" onClick={onClose}>
            <Button fullWidth>Order / ask rates</Button>
          </Link>
        ) : null}
        <Button variant="ghost" fullWidth disabled={unsaving} onClick={onUnsave}>
          {unsaving ? 'Removing…' : 'Remove from Saved'}
        </Button>
      </div>
    </Sheet>
  );
}
