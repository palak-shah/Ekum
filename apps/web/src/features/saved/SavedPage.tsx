import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SavedItemView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import { readBrowseAlbumPick, writeBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { selectAllState } from '@/features/browse/selectAllState';
import { applySelectingPill } from '@/features/browse/selectingPill';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { PageHeader } from '@/ui/PageHeader';
import { PhotoViewer } from '@/ui/PhotoViewer';
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
type Tab = 'designs' | 'collections';

function tabFromSearch(value: string | null): Tab {
  return value === 'collections' ? 'collections' : 'designs';
}

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

function savedToAlbumEntry(item: SavedItemView): BrowseAlbumEntry | null {
  if (item.kind !== 'collection' || !item.collectionId) return null;
  return {
    collectionId: item.collectionId,
    name: item.name,
    coverImage: item.thumbUrl ?? item.images?.[0] ?? null,
    companyId: item.company.id,
    companyName: item.company.name,
    productCount: item.productCount,
  };
}

function addAlbumMany(entries: BrowseAlbumEntry[]) {
  const byId = new Map(readBrowseAlbumPick().map((row) => [row.collectionId, row]));
  for (const entry of entries) {
    byId.set(entry.collectionId, entry);
  }
  writeBrowseAlbumPick([...byId.values()]);
}

export function SavedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const saved = useSavedList();
  const tab = tabFromSearch(searchParams.get('tab'));
  const [layout, setLayout] = useState<Layout>('grid');
  const [viewer, setViewer] = useState<SavedItemView | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const setTab = (next: Tab) => {
    setSearchParams(next === 'collections' ? { tab: 'collections' } : {}, { replace: true });
  };

  useEffect(() => {
    if (searchParams.get('select') !== '1') return;
    if (tab === 'collections') {
      albumPick.setSelectMode(true);
    } else {
      shortlist.setSelectMode(true);
    }
    // Intentional: only react to URL; setters are stable enough for this entry path.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirror prior select=1 effect
  }, [searchParams, tab, setSearchParams]);

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
  const collectionItems = (saved.data ?? []).filter((item) => item.kind === 'collection');
  const tabItems = tab === 'designs' ? productItems : collectionItems;
  const visibleSavedIds = productItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));
  const visibleCollectionIds = collectionItems
    .map((item) => item.collectionId)
    .filter((id): id is string => Boolean(id));
  const designSelectAll = selectAllState(visibleSavedIds, shortlist.productIds);
  const albumSelectAll = selectAllState(visibleCollectionIds, albumPick.collectionIds);
  const activeSelect = tab === 'collections' ? albumPick : shortlist;
  const selectMode =
    tab === 'collections' ? albumPick.selectMode : shortlist.selectMode;

  const onActivateItem = (item: SavedItemView) => {
    if (selectMode && item.kind === 'collection') {
      const entry = savedToAlbumEntry(item);
      if (entry) albumPick.toggle(entry);
      return;
    }
    if (item.kind === 'collection' && item.collectionId) {
      navigate(`/collections/${item.collectionId}`);
      return;
    }
    if (selectMode && item.kind === 'product') {
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
    if (item.kind === 'product') {
      const entry = savedToEntry(item);
      if (entry) shortlist.toggle(entry);
      return;
    }
    const entry = savedToAlbumEntry(item);
    if (entry) albumPick.toggle(entry);
  };

  const showSelectChrome =
    (tab === 'designs' && productItems.length > 0) ||
    (tab === 'collections' && collectionItems.length > 0);
  const showLayoutToggle = tabItems.length > 0;
  const floaterClearance = shortlist.count + albumPick.count > 0;
  const headerSubtitle =
    saved.isLoading || saved.isError
      ? undefined
      : tab === 'designs'
        ? productItems.length === 1
          ? '1 design'
          : `${productItems.length} designs`
        : collectionItems.length === 1
          ? '1 collection'
          : `${collectionItems.length} collections`;

  return (
    <div className={cx('flex flex-col gap-4', floaterClearance && 'pb-[calc(5rem+5.5rem)]')}>
      <PageHeader
        title="Saved"
        subtitle={headerSubtitle}
        action={
          showSelectChrome || showLayoutToggle ? (
            <div className="flex items-center gap-1">
              {showSelectChrome ? (
                <button
                  type="button"
                  className={cx(
                    'rounded-full px-3 py-1.5 text-xs font-bold tracking-tight',
                    activeSelect.selectMode
                      ? 'bg-accent text-white'
                      : 'text-accent hover:bg-accent/5',
                  )}
                  onClick={() =>
                    applySelectingPill(activeSelect.selectMode, activeSelect.count, activeSelect)
                  }
                >
                  {activeSelect.selectMode ? 'Selecting' : 'Select'}
                </button>
              ) : null}
              {showLayoutToggle ? (
                <button
                  type="button"
                  aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
                  onClick={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
                >
                  {layout === 'feed' ? 'Grid' : 'Feed'}
                </button>
              ) : null}
            </div>
          ) : null
        }
      />

      <SelectAllFloat
        open={tab === 'designs' && shortlist.selectMode && visibleSavedIds.length > 0}
        count={shortlist.count}
        allSelected={designSelectAll.allSelected}
        onSelectAll={() =>
          shortlist.addMany(
            productItems
              .map(savedToEntry)
              .filter((entry): entry is BrowseShortlistEntry => Boolean(entry)),
          )
        }
        onClear={() => shortlist.removeIds(visibleSavedIds)}
      />

      <SelectAllFloat
        open={tab === 'collections' && albumPick.selectMode && visibleCollectionIds.length > 0}
        count={albumPick.count}
        allSelected={albumSelectAll.allSelected}
        onSelectAll={() =>
          addAlbumMany(
            collectionItems
              .map(savedToAlbumEntry)
              .filter((entry): entry is BrowseAlbumEntry => Boolean(entry)),
          )
        }
        onClear={() => albumPick.removeIds(visibleCollectionIds)}
      />

      {saved.isLoading ? (
        <LoadingBlock label="Loading saved…" />
      ) : saved.isError ? (
        <ErrorState
          message="Couldn’t load Saved. Try again."
          onRetry={() => void saved.refetch()}
        />
      ) : (
        <>
          <div className="flex gap-2">
            {(['designs', 'collections'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cx(
                  'rounded-full px-4 py-1.5 text-sm font-medium',
                  tab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
                )}
              >
                {value === 'designs' ? 'Designs' : 'Collections'}
              </button>
            ))}
          </div>

          {tabItems.length > 0 ? (
            layout === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {tabItems.map((item) => (
                  <SavedGridTile
                    key={item.id}
                    item={item}
                    selected={
                      item.kind === 'product'
                        ? Boolean(item.productId && shortlist.productIds.has(item.productId))
                        : Boolean(
                            item.collectionId && albumPick.collectionIds.has(item.collectionId),
                          )
                    }
                    selectMode={selectMode}
                    removing={unsave.isPending}
                    onOpen={() => onActivateItem(item)}
                    onLongSelect={() => onLongSelectItem(item)}
                    onUnsave={() => unsave.mutate(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {tabItems.map((item) => (
                  <SavedFeedRow
                    key={item.id}
                    item={item}
                    selected={
                      item.kind === 'product'
                        ? Boolean(item.productId && shortlist.productIds.has(item.productId))
                        : Boolean(
                            item.collectionId && albumPick.collectionIds.has(item.collectionId),
                          )
                    }
                    selectMode={selectMode}
                    removing={unsave.isPending}
                    onOpen={() => onActivateItem(item)}
                    onLongSelect={() => onLongSelectItem(item)}
                    onUnsave={() => unsave.mutate(item.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyState
              title={tab === 'designs' ? 'No bookmarked designs' : 'No bookmarked collections'}
              message={
                tab === 'designs'
                  ? 'Bookmark designs from Explore or inside a collection.'
                  : 'Bookmark a collection from Explore or a collection page.'
              }
              action={
                <Button variant="secondary" onClick={() => navigate('/explore')}>
                  Open Explore
                </Button>
              }
            />
          )}
        </>
      )}

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
  const savedBy = item.savedBy?.name?.trim();
  if (item.kind === 'product') {
    const bits = [item.company.name];
    if (item.sku) bits.push(item.sku);
    bits.push(formatRate(item.rate ?? null, item.unit ?? null));
    if (savedBy) bits.push(savedBy);
    return bits.join(' · ');
  }
  const bits = [item.company.name];
  if (item.productCount != null) {
    bits.push(`${item.productCount} design${item.productCount === 1 ? '' : 's'}`);
  } else {
    bits.push('Collection');
  }
  if (savedBy) bits.push(savedBy);
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
        <AlbumGrid images={images} imageCount={imageCount} alt={item.name} />
        <div className="px-2.5 py-2.5">
          <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
          <p className="truncate text-xs text-muted">{itemMeta(item)}</p>
        </div>
      </button>
      {selectMode ? (
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
        {selectMode ? (
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
  const [photoOpen, setPhotoOpen] = useState(false);
  useEffect(() => {
    if (!item) setPhotoOpen(false);
  }, [item]);

  if (!item || item.kind !== 'product') return null;
  const urls = item.images?.length ? item.images : item.thumbUrl ? [item.thumbUrl] : [];
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const current = urls[safeIndex] ?? null;

  return (
    <>
    <Sheet
      open={Boolean(item)}
      onClose={onClose}
      title={item.name}
      footer={
        <div className="flex flex-col gap-2">
          {item.productId ? (
            <Link to={`/explore/products/${item.productId}`} className="block" onClick={onClose}>
              <Button fullWidth>Order / ask rates</Button>
            </Link>
          ) : null}
          <Button variant="ghost" fullWidth disabled={unsaving} onClick={onUnsave}>
            {unsaving ? 'Removing…' : 'Remove from Saved'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted">{itemMeta(item)}</p>
        {current ? (
          <button
            type="button"
            className="block w-full overflow-hidden rounded-2xl bg-foam"
            onClick={() => setPhotoOpen(true)}
            aria-label="View photo"
          >
            <img
              src={current}
              alt=""
              className="max-h-[50vh] w-full object-contain"
            />
          </button>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-foam text-muted">
            No photos
          </div>
        )}
      </div>
    </Sheet>
    <PhotoViewer
      open={photoOpen && urls.length > 0}
      urls={urls}
      index={safeIndex}
      onIndex={onIndex}
      onClose={() => setPhotoOpen(false)}
    />
    </>
  );
}
