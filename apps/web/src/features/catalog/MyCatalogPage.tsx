import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  ProductStatus,
  type BroadcastListView,
  type CollectionView,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, EmptyState, LoadingBlock, Sheet, cx } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { CheckIcon } from '@/ui/icons';
import { collectionStatusSummary } from './collectionStatusSummary';
import { auditLine, productTileSubtitle } from './productStatusSummary';
import { BulkCollectionPublishSheet } from './BulkCollectionPublishSheet';
import { BulkProductPublishSheet } from './BulkProductPublishSheet';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { nextIdSet, selectAllState } from '@/features/browse/selectAllState';
import { useLongPress } from '@/ui/useLongPress';

type Tab = 'products' | 'collections';
type CollectionFilter = 'all' | 'draft' | 'ready' | 'published' | 'archived';
type ProductFilter = 'all' | 'draft' | 'published' | 'archived';

const COLLECTION_FILTERS: { id: CollectionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'ready', label: 'Ready' },
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
    case 'ready':
      return {
        title: 'No ready collections',
        message: 'Mark a draft ready when the pack is reviewable.',
      };
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
  const tab = tabFromSearch(searchParams.get('tab'));
  const [postOpen, setPostOpen] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkPublishOpen, setBulkPublishOpen] = useState(false);

  const setTab = (next: Tab) => {
    setSearchParams(
      next === 'collections' ? { tab: 'collections' } : {},
      { replace: true },
    );
  };

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

  const filteredCollections = useMemo(() => {
    const rows = collections.data ?? [];
    if (collectionFilter === 'all') return rows;
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

  const archivePath =
    tab === 'collections' ? (id: string) => `/collections/${id}/archive` : (id: string) => `/products/${id}/archive`;
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

  const busy = bulkArchive.isPending || bulkRestore.isPending;
  const listCount = tab === 'collections' ? filteredCollections.length : filteredProducts.length;

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        selecting && 'pb-28',
        selecting && visibleIds.length > 0 && 'pt-12',
      )}
    >
      {selecting && visibleIds.length > 0 ? (
        <SelectAllFloat
          open
          count={selectedIds.size}
          action={selectAllState(visibleIds, selectedIds).action}
          onAction={() => setSelectedIds(nextIdSet(visibleIds, selectedIds))}
        />
      ) : null}
      <PageHeader
        title="My designs & collections"
        action={
          listCount > 0 ? (
            selecting ? (
              <button type="button" className="text-sm font-medium text-accent" onClick={exitSelect}>
                Cancel
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-sm font-medium text-muted"
                  onClick={() => setSelecting(true)}
                >
                  Select
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-accent"
                  onClick={() => setPostOpen(true)}
                >
                  New post
                </button>
              </div>
            )
          ) : (
            <button className="text-sm font-medium text-accent" onClick={() => setPostOpen(true)}>
              New post
            </button>
          )
        }
      />

      <div className="flex gap-2">
        {(['products', 'collections'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium capitalize',
              tab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {value === 'products' ? 'Designs' : 'Collections'}
          </button>
        ))}
      </div>

      {tab === 'products' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PRODUCT_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setProductFilter(filter.id)}
                className={cx(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                  productFilter === filter.id ? 'bg-accent text-white' : 'bg-foam text-muted',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {products.isLoading ? (
            <LoadingBlock />
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <SellerProductTile
                  key={product.id}
                  product={product}
                  groups={buyerGroups}
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COLLECTION_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setCollectionFilter(filter.id)}
                className={cx(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                  collectionFilter === filter.id ? 'bg-accent text-white' : 'bg-foam text-muted',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {collections.isLoading ? (
            <LoadingBlock />
          ) : filteredCollections.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredCollections.map((collection) => (
                <SellerCollectionTile
                  key={collection.id}
                  collection={collection}
                  groups={buyerGroups}
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
                <div className="flex gap-2">
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
                </div>
                {selectedIds.size > 0 &&
                publishableIds.length === 0 &&
                archivableIds.length === 0 &&
                restorableIds.length === 0 ? (
                  <p className="text-center text-xs text-muted">No actions for this selection.</p>
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
  selecting,
  selected,
  onToggle,
  onLongSelect,
}: {
  product: ProductView;
  groups: BroadcastListView[];
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onLongSelect: () => void;
}) {
  const subtitle = productTileSubtitle(product, groups);
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const body = (
    <>
      <div className="relative">
        {product.images[0] ? (
          <img src={product.images[0]} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="flex h-32 items-center justify-center bg-foam text-2xl font-bold text-muted">
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
      <div className="flex flex-col gap-1 p-2.5">
        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
        <p className="line-clamp-2 text-xs text-muted">{subtitle}</p>
        {auditLine(product) ? (
          <p className="text-[11px] text-muted/80">{auditLine(product)}</p>
        ) : null}
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
          selected ? 'border-accent' : 'border-line',
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to={`/catalog/products/${product.id}`}
      className="overflow-hidden rounded-2xl border border-line bg-surface"
      {...longPress}
    >
      {body}
    </Link>
  );
}

function SellerCollectionTile({
  collection,
  groups,
  selecting,
  selected,
  onToggle,
  onLongSelect,
}: {
  collection: CollectionView;
  groups: BroadcastListView[];
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
  const subtitle = `${density} · ${summary.line}`;
  const whoWhen = auditLine(collection);
  const showPlus = collection.productCount > 4;
  const longPress = useLongPress(selecting ? undefined : onLongSelect);

  const body = (
    <>
      <div className="relative grid h-36 grid-cols-2 grid-rows-2 gap-0.5 bg-foam">
        {previews.length > 0 ? (
          previews.slice(0, 4).map((url, index) => {
            const isOverflow = index === 3 && showPlus;
            return (
              <div
                key={`${collection.id}-${index}`}
                className={cx(
                  'relative h-full w-full overflow-hidden',
                  previews.length === 1 ? 'col-span-2 row-span-2' : '',
                  previews.length === 2 && index === 0 ? 'row-span-2' : '',
                  previews.length === 3 && index === 0 ? 'row-span-2' : '',
                )}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {isOverflow ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      +{collection.productCount - 3}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-3xl font-bold text-muted">
            {collection.name.charAt(0)}
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
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-base font-semibold text-ink">{collection.name}</p>
        <p className="line-clamp-2 text-xs text-muted">{subtitle}</p>
        {whoWhen ? <p className="text-[11px] text-muted/80">{whoWhen}</p> : null}
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
          selected ? 'border-accent' : 'border-line',
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <Link to={href} className="overflow-hidden rounded-2xl border border-line bg-surface" {...longPress}>
      {body}
    </Link>
  );
}
