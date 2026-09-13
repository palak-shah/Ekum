import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  ProductStatus,
  type BroadcastListView,
  type CollectionView,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import {
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
  type DesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import { useMyCompany } from '@/lib/queries';
import { Button, Chip, EmptyState, FilterRail, LoadingBlock, Sheet, cx } from '@/ui/kit';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { CheckIcon } from '@/ui/icons';
import { AlbumGrid } from '@/ui/cards';
import { collectionStatusSummary } from './collectionStatusSummary';
import { collectionOwnerSourceLine } from './collectionOwnerSourceLine';
import { auditLine, productTileSubtitle } from './productStatusSummary';
import { BulkCollectionPublishSheet } from './BulkCollectionPublishSheet';
import { BulkProductPublishSheet } from './BulkProductPublishSheet';
import {
  readBrowseAlbumPick,
  writeBrowseAlbumPick,
  type BrowseAlbumEntry,
} from '@/features/browse/browseAlbumPick';
import {
  addBrowseShortlistMany,
  type BrowseShortlistEntry,
} from '@/features/browse/browseShortlist';
import { partitionForTravelingSelection } from '@/features/browse/partitionForTravelingSelection';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { selectAllState } from '@/features/browse/selectAllState';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';

function toCatalogShortlistEntry(
  product: ProductView,
  company: { id: string; name: string },
): BrowseShortlistEntry {
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: company.id,
    companyName: company.name,
    allowForward: product.allowForward,
  };
}

function toCatalogAlbumEntry(
  collection: CollectionView,
  company: { id: string; name: string },
): BrowseAlbumEntry {
  return {
    collectionId: collection.id,
    name: collection.name,
    coverImage: collection.coverImage,
    companyId: company.id,
    companyName: company.name,
    productCount: collection.productCount,
    allowForward: collection.allowForward,
  };
}

function addAlbumMany(entries: BrowseAlbumEntry[]) {
  const byId = new Map(readBrowseAlbumPick().map((row) => [row.collectionId, row]));
  for (const entry of entries) {
    byId.set(entry.collectionId, entry);
  }
  writeBrowseAlbumPick([...byId.values()]);
}

type Tab = 'products' | 'collections';
type CollectionFilter = 'all' | 'draft' | 'published' | 'archived';
type ProductFilter = 'all' | 'draft' | 'published' | 'archived';

const COLLECTION_FILTERS: { id: CollectionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
];

const PRODUCT_FILTERS: { id: ProductFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
];

function emptyCollectionCopy(filter: CollectionFilter): { title: string; message: string } {
  switch (filter) {
    case 'published':
      return {
        title: 'No published collections',
        message: 'Publish a pack so buyers can see it.',
      };
    case 'archived':
      return {
        title: 'No archived collections',
        message: 'Archived packs stay here — restore anytime to draft.',
      };
    case 'draft':
      return {
        title: 'No draft collections',
        message: 'Start a new album from photos or designs.',
      };
    default:
      return {
        title: 'No collections yet',
        message: 'Albums of designs from your library.',
      };
  }
}

function emptyProductCopy(filter: ProductFilter): { title: string; message: string } {
  switch (filter) {
    case 'published':
      return {
        title: 'No published designs',
        message: 'Publish a design so buyers can see it on Explore.',
      };
    case 'archived':
      return {
        title: 'No archived designs',
        message: 'Archived designs stay here — restore anytime to draft.',
      };
    case 'draft':
      return {
        title: 'No draft designs',
        message: 'Add a design from New post.',
      };
    default:
      return {
        title: 'No designs yet',
        message: 'Your design library. Group any of them into a collection.',
      };
  }
}

function isCollectionPublishable(collection: CollectionView): boolean {
  return (
    (collection.status === CollectionStatus.Draft ||
      collection.status === CollectionStatus.Ready) &&
    collection.productCount >= 1
  );
}

function isProductPublishable(product: ProductView): boolean {
  return product.status === ProductStatus.Draft && product.images.length >= 1;
}

function tabFromSearch(value: string | null): Tab {
  return value === 'collections' ? 'collections' : 'products';
}

export function MyCatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const companyId = me.data?.id;
  const tab = tabFromSearch(searchParams.get('tab'));
  const [postOpen, setPostOpen] = useState(false);
  const [layout, setLayout] = useState<DesignBrowseLayout>(() =>
    readDesignBrowseLayout(companyId),
  );
  const location = useLocation();
  const navState = location.state as {
    productFilter?: ProductFilter;
    collectionFilter?: CollectionFilter;
  } | null;
  const navProductFilter = navState?.productFilter;
  const navCollectionFilter = navState?.collectionFilter;
  const initialProductFilter: ProductFilter =
    navProductFilter && PRODUCT_FILTERS.some((f) => f.id === navProductFilter)
      ? navProductFilter
      : 'all';
  const initialCollectionFilter: CollectionFilter =
    navCollectionFilter && COLLECTION_FILTERS.some((f) => f.id === navCollectionFilter)
      ? navCollectionFilter
      : 'all';

  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>(initialCollectionFilter);
  const [productFilter, setProductFilter] = useState<ProductFilter>(initialProductFilter);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkPublishOpen, setBulkPublishOpen] = useState(false);

  useEffect(() => {
    setLayout(readDesignBrowseLayout(companyId));
  }, [companyId]);

  const toggleLayout = () => {
    setLayout((prev) => {
      const next = prev === 'feed' ? 'grid' : 'feed';
      writeDesignBrowseLayout(companyId, next);
      return next;
    });
  };

  const setTab = (next: Tab) => {
    setSearchParams(
      next === 'collections' ? { tab: 'collections' } : {},
      { replace: true },
    );
  };


  useEffect(() => {
    if (!navProductFilter && !navCollectionFilter) return;
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [location.pathname, location.search, navProductFilter, navCollectionFilter, navigate]);

  const products = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: tab === 'products',
  });
  const collections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: tab === 'collections',
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled: tab === 'collections' || tab === 'products',
  });

  const buyerGroups = broadcastLists.data ?? [];
  const myCompany = me.data
    ? { id: me.data.id, name: me.data.name }
    : null;

  const filteredCollections = useMemo(() => {
    const rows = collections.data ?? [];
    if (collectionFilter === 'all') return rows;
    if (collectionFilter === 'draft') {
      return rows.filter(
        (row) =>
          row.status === CollectionStatus.Draft || row.status === CollectionStatus.Ready,
      );
    }
    return rows.filter((row) => row.status === collectionFilter);
  }, [collections.data, collectionFilter]);

  const filteredProducts = useMemo(() => {
    const rows = products.data ?? [];
    if (productFilter === 'all') return rows;
    return rows.filter((row) => row.status === productFilter);
  }, [products.data, productFilter]);

  const visibleIds =
    tab === 'collections'
      ? filteredCollections.map((c) => c.id)
      : filteredProducts.map((p) => p.id);

  const selectedCollections = useMemo(
    () => filteredCollections.filter((c) => selectedIds.has(c.id)),
    [filteredCollections, selectedIds],
  );
  const selectedProducts = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)),
    [filteredProducts, selectedIds],
  );

  const publishableIds =
    tab === 'collections'
      ? selectedCollections.filter(isCollectionPublishable).map((c) => c.id)
      : selectedProducts.filter(isProductPublishable).map((p) => p.id);
  const archivableIds =
    tab === 'collections'
      ? selectedCollections
          .filter((c) => c.status !== CollectionStatus.Archived)
          .map((c) => c.id)
      : selectedProducts.filter((p) => p.status !== ProductStatus.Archived).map((p) => p.id);
  const hideableIds =
    tab === 'collections'
      ? selectedCollections
          .filter((c) => c.status === CollectionStatus.Published)
          .map((c) => c.id)
      : selectedProducts.filter((p) => p.status === ProductStatus.Published).map((p) => p.id);
  const restorableIds =
    tab === 'collections'
      ? selectedCollections
          .filter((c) => c.status === CollectionStatus.Archived)
          .map((c) => c.id)
      : selectedProducts.filter((p) => p.status === ProductStatus.Archived).map((p) => p.id);

  useEffect(() => {
    setSelecting(false);
    setSelectedIds(new Set());
    setBulkPublishOpen(false);
  }, [tab]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(visibleIds);
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleIds.join(',')]);

  const exitSelect = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startSelect = (id: string) => {
    setSelecting(true);
    setSelectedIds(new Set([id]));
  };

  const sendToSelection = () => {
    if (!myCompany || selectedIds.size < 1) return;
    if (tab === 'products') {
      const { published, toast } = partitionForTravelingSelection(selectedProducts);
      if (toast) showToast(toast);
      if (published.length < 1) return;
      addBrowseShortlistMany(published.map((row) => toCatalogShortlistEntry(row, myCompany)));
    } else {
      const { published, toast } = partitionForTravelingSelection(selectedCollections);
      if (toast) showToast(toast);
      if (published.length < 1) return;
      addAlbumMany(published.map((row) => toCatalogAlbumEntry(row, myCompany)));
    }
    exitSelect();
    navigate('/selection');
  };

  const archivePath =
    tab === 'collections' ? (id: string) => `/collections/${id}/archive` : (id: string) => `/products/${id}/archive`;
  const hidePath =
    tab === 'collections'
      ? (id: string) => `/collections/${id}/unpublish`
      : (id: string) => `/products/${id}/unpublish`;
  const restorePath =
    tab === 'collections'
      ? (id: string) => `/collections/${id}/unarchive`
      : (id: string) => `/products/${id}/unarchive`;
  const listKey = tab === 'collections' ? 'my-collections' : 'my-products';

  const bulkArchive = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => api.post(archivePath(id), {})));
      return {
        ok: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onSuccess: ({ ok, failed }) => {
      void queryClient.invalidateQueries({ queryKey: [listKey] });
      showToast(
        failed === 0 ? `Archived ${ok}` : `Archived ${ok}, ${failed} failed`,
        failed === 0 ? undefined : 'danger',
      );
      exitSelect();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not archive.', 'danger');
    },
  });

  const bulkHide = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => api.post(hidePath(id), {})));
      return {
        ok: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onSuccess: ({ ok, failed }) => {
      void queryClient.invalidateQueries({ queryKey: [listKey] });
      showToast(
        failed === 0 ? `Hidden ${ok}` : `Hidden ${ok}, ${failed} failed`,
        failed === 0 ? undefined : 'danger',
      );
      exitSelect();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not hide.', 'danger');
    },
  });

  const bulkRestore = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => api.post(restorePath(id), {})));
      return {
        ok: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onSuccess: ({ ok, failed }) => {
      void queryClient.invalidateQueries({ queryKey: [listKey] });
      showToast(
        failed === 0 ? `Restored ${ok}` : `Restored ${ok}, ${failed} failed`,
        failed === 0 ? undefined : 'danger',
      );
      exitSelect();
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not restore.', 'danger');
    },
  });

  const busy = bulkArchive.isPending || bulkHide.isPending || bulkRestore.isPending;
  const tabHasItems =
    tab === 'products' ? filteredProducts.length > 0 : filteredCollections.length > 0;

  const onCatalogBack = () => {
    // React Router: initial entry uses key "default"; prefer this over history.state.idx.
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate('/more');
  };

  return (
    <div
      className={cx(
        'flex flex-col gap-2.5',
        selecting && 'pb-28',
      )}
    >
      <PageHeader
        title="My designs"
        onBack={onCatalogBack}
        action={
          tabHasItems && !selecting ? (
            <button
              type="button"
              data-testid="catalog-layout-toggle"
              aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
              onClick={toggleLayout}
            >
              {layout === 'feed' ? 'Grid' : 'Feed'}
            </button>
          ) : null
        }
      />

      {/* Mode like Chats; Add like “Mark all read” — not a second pill family. */}
      <div className="flex items-center gap-2">
        {(['products', 'collections'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              tab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {value === 'products' ? 'Designs' : 'Collections'}
          </button>
        ))}
        {selecting ? (
          <button
            type="button"
            className="ml-auto text-sm font-semibold text-accent"
            onClick={exitSelect}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            className="ml-auto text-sm font-semibold text-accent"
            onClick={() => setPostOpen(true)}
          >
            Add
          </button>
        )}
      </div>

      <SelectAllFloat
        open={selecting && visibleIds.length > 0}
        count={selectedIds.size}
        allSelected={selectAllState(visibleIds, selectedIds).allSelected}
        onSelectAll={() => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const id of visibleIds) next.add(id);
            return next;
          });
        }}
        onClear={() => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const id of visibleIds) next.delete(id);
            return next;
          });
        }}
      />

      <FilterRail>
        {(tab === 'collections' ? COLLECTION_FILTERS : PRODUCT_FILTERS).map((item) => {
          const active =
            tab === 'collections'
              ? collectionFilter === item.id
              : productFilter === item.id;
          return (
            <Chip
              key={item.id}
              active={active}
              onClick={() =>
                tab === 'collections'
                  ? setCollectionFilter(item.id as CollectionFilter)
                  : setProductFilter(item.id as ProductFilter)
              }
            >
              {item.label}
            </Chip>
          );
        })}
      </FilterRail>

      {tab === 'products' ? (
        <>
          {products.isLoading ? (
            <LoadingBlock />
          ) : filteredProducts.length > 0 ? (
            <div
              className={
                layout === 'feed' ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-3'
              }
              data-testid="catalog-products-layout"
              data-layout={layout}
            >
              {filteredProducts.map((product) => (
                <SellerProductTile
                  key={product.id}
                  product={product}
                  groups={buyerGroups}
                  variant={layout}
                  selecting={selecting}
                  selected={selectedIds.has(product.id)}
                  onToggle={() => toggleSelected(product.id)}
                  onLongSelect={() => startSelect(product.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={emptyProductCopy(productFilter).title}
              message={emptyProductCopy(productFilter).message}
              action={
                productFilter === 'all' || productFilter === 'draft' ? (
                  <Button onClick={() => setPostOpen(true)}>New post</Button>
                ) : undefined
              }
            />
          )}
        </>
      ) : (
        <>
          {collections.isLoading ? (
            <LoadingBlock />
          ) : filteredCollections.length > 0 ? (
            <div
              className={
                layout === 'feed' ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-3'
              }
              data-testid="catalog-collections-layout"
              data-layout={layout}
            >
              {filteredCollections.map((collection) => (
                <SellerCollectionTile
                  key={collection.id}
                  collection={collection}
                  groups={buyerGroups}
                  variant={layout}
                  selecting={selecting}
                  selected={selectedIds.has(collection.id)}
                  onToggle={() => toggleSelected(collection.id)}
                  onLongSelect={() => startSelect(collection.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={emptyCollectionCopy(collectionFilter).title}
              message={emptyCollectionCopy(collectionFilter).message}
              action={
                collectionFilter === 'all' || collectionFilter === 'draft' ? (
                  <Button onClick={() => navigate('/catalog/collections/new')}>New collection</Button>
                ) : undefined
              }
            />
          )}
        </>
      )}

      {selecting && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
              <div className="mx-auto flex max-w-md flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {restorableIds.length > 0 ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={busy}
                      onClick={() => bulkRestore.mutate(restorableIds)}
                    >
                      {bulkRestore.isPending ? 'Restoring…' : `Restore ${restorableIds.length}`}
                    </Button>
                  ) : null}
                  {hideableIds.length > 0 ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={busy}
                      onClick={() => bulkHide.mutate(hideableIds)}
                    >
                      {bulkHide.isPending ? 'Hiding…' : `Hide · draft ${hideableIds.length}`}
                    </Button>
                  ) : null}
                  {archivableIds.length > 0 ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={busy}
                      onClick={() => bulkArchive.mutate(archivableIds)}
                    >
                      {bulkArchive.isPending ? 'Archiving…' : `Archive ${archivableIds.length}`}
                    </Button>
                  ) : null}
                  {publishableIds.length > 0 ? (
                    <Button
                      className="min-w-0 flex-1"
                      disabled={busy}
                      onClick={() => setBulkPublishOpen(true)}
                    >
                      Publish {publishableIds.length}
                    </Button>
                  ) : null}
                  {selectedIds.size > 0 ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={busy}
                      data-testid="catalog-to-selection"
                      onClick={sendToSelection}
                    >
                      To selection
                    </Button>
                  ) : null}
                </div>
                {selectedIds.size > 0 &&
                publishableIds.length === 0 &&
                hideableIds.length === 0 &&
                archivableIds.length === 0 &&
                restorableIds.length === 0 ? (
                  <p className="text-center text-xs text-muted">
                    Use To selection for Order, Curate, Bookmark, or Share.
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {tab === 'collections' ? (
        <BulkCollectionPublishSheet
          open={bulkPublishOpen}
          onClose={() => setBulkPublishOpen(false)}
          collectionIds={publishableIds}
          onDone={exitSelect}
        />
      ) : (
        <BulkProductPublishSheet
          open={bulkPublishOpen}
          onClose={() => setBulkPublishOpen(false)}
          productIds={publishableIds}
          onDone={exitSelect}
        />
      )}

      <Sheet open={postOpen} onClose={() => setPostOpen(false)} title="What are you posting?">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setPostOpen(false);
              navigate('/catalog/products/new');
            }}
            className="rounded-2xl border border-line px-4 py-3.5 text-left"
          >
            <p className="text-sm font-bold text-ink">Single design</p>
            <p className="mt-0.5 text-xs text-muted">One product post on Explore</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setPostOpen(false);
              navigate('/catalog/collections/new');
            }}
            className="rounded-2xl border border-line px-4 py-3.5 text-left"
          >
            <p className="text-sm font-bold text-ink">Collection</p>
            <p className="mt-0.5 text-xs text-muted">Album of designs as one post</p>
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function SellerProductTile({
  product,
  groups,
  variant,
  selecting,
  selected,
  onToggle,
  onLongSelect,
}: {
  product: ProductView;
  groups: BroadcastListView[];
  variant: DesignBrowseLayout;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onLongSelect: () => void;
}) {
  const subtitle = productTileSubtitle(product, groups);
  const navigate = useNavigate();
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const feed = variant === 'feed';
  const body = (
    <>
      <div className="relative">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt=""
            className={cx('w-full object-cover', feed ? 'aspect-[3/4]' : 'h-32')}
          />
        ) : (
          <div
            className={cx(
              'flex items-center justify-center bg-foam font-bold text-muted',
              feed ? 'aspect-[3/4] text-4xl' : 'h-32 text-2xl',
            )}
          >
            {product.name.charAt(0)}
          </div>
        )}
        {selecting ? (
          <span
            className={cx(
              'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2',
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-white bg-ink/30 text-transparent',
            )}
          >
            <CheckIcon width={16} height={16} />
          </span>
        ) : null}
      </div>
      <div className={cx('flex flex-col gap-1', feed ? 'p-3' : 'p-2.5')}>
        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
        <p className="line-clamp-2 text-xs text-muted">{subtitle}</p>
        {auditLine(product) ? (
          <p className="text-[11px] text-muted">{auditLine(product)}</p>
        ) : null}
      </div>
    </>
  );

  if (selecting) {
    return (
      <button
        type="button"
        data-testid="catalog-product-tile"
        onClick={onToggle}
        className={cx(
          'overflow-hidden rounded-2xl border bg-surface text-left',
          LONG_PRESS_SURFACE_CLASS,
          selected ? 'border-accent' : 'border-line',
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="catalog-product-tile"
      className={cx(
        'overflow-hidden rounded-2xl border border-line bg-surface text-left',
        LONG_PRESS_SURFACE_CLASS,
      )}
      onClick={() => navigate(`/catalog/products/${product.id}`)}
      {...longPress}
    >
      {body}
    </button>
  );
}

function SellerCollectionTile({
  collection,
  groups,
  variant,
  selecting,
  selected,
  onToggle,
  onLongSelect,
}: {
  collection: CollectionView;
  groups: BroadcastListView[];
  variant: DesignBrowseLayout;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onLongSelect: () => void;
}) {
  const summary = collectionStatusSummary(collection, groups);
  const previews =
    collection.previewImages?.length > 0
      ? collection.previewImages
      : collection.coverImage
        ? [collection.coverImage]
        : [];

  const href =
    collection.status === CollectionStatus.Archived
      ? `/catalog/collections/${collection.id}`
      : `/collections/${collection.id}`;

  const photos = collection.photoCount ?? collection.previewImages?.length ?? 0;
  const designs = collection.productCount;
  const density = `${photos === 1 ? '1 photo' : `${photos} photos`} · ${
    designs === 1 ? '1 design' : `${designs} designs`
  }`;
  const sourceLine = collectionOwnerSourceLine(
    collection.companyId,
    collection.memberShops ?? [],
  );
  const subtitle = sourceLine
    ? `${density} · ${sourceLine} · ${summary.line}`
    : `${density} · ${summary.line}`;
  const whoWhen = auditLine(collection);
  const showPlus = collection.productCount > 4;
  const navigate = useNavigate();
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const mosaicCount = showPlus
    ? Math.max(collection.productCount, previews.length)
    : previews.length;
  const feed = variant === 'feed';

  const body = (
    <>
      <div className={cx('relative', feed && 'px-0')}>
        <AlbumGrid images={previews} imageCount={mosaicCount} alt={collection.name} />
        {selecting ? (
          <span
            className={cx(
              'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2',
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-white bg-ink/30 text-transparent',
            )}
          >
            <CheckIcon width={16} height={16} />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-base font-semibold text-ink">{collection.name}</p>
        <p className="line-clamp-2 text-xs text-muted">{subtitle}</p>
        {whoWhen ? <p className="text-[11px] text-muted">{whoWhen}</p> : null}
      </div>
    </>
  );

  if (selecting) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          'overflow-hidden rounded-2xl border bg-surface text-left',
          LONG_PRESS_SURFACE_CLASS,
          selected ? 'border-accent' : 'border-line',
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cx(
        'overflow-hidden rounded-2xl border border-line bg-surface text-left',
        LONG_PRESS_SURFACE_CLASS,
      )}
      onClick={() => navigate(href)}
      {...longPress}
    >
      {body}
    </button>
  );
}
