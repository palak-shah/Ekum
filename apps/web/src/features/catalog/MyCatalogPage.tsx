import { useDeferredValue, useEffect, useMemo, useState } from 'react';
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
  designBrowsePhotoClass,
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
  type DesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { Button, Chip, EmptyState, ErrorState, FilterRail, LoadingBlock, SearchInput, Sheet, cx } from '@/ui/kit';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { CheckIcon, PlusIcon } from '@/ui/icons';
import { ListSquareButton } from '@/ui/ListSearchRow';
import { collectionMosaicCount } from '@/ui/albumMosaic';
import { AlbumGrid } from '@/ui/cards';
import { collectionStatusSummary } from './collectionStatusSummary';
import { collectionOwnerSourceLine } from './collectionOwnerSourceLine';
import { libraryAuditLine, productStatusLine, productTileSubtitle } from './productStatusSummary';
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
import {
  CATALOG_STATUS_FILTERS,
  DEFAULT_CATALOG_LIST_FILTER,
  publishedDesignsElsewhereHint,
  uniqueById,
  readCatalogListFilter,
  writeCatalogListFilter,
} from './catalogListFilter';
import { catalogSearchMatches, designFindParts } from './catalogSearch';
import { CatalogFindToggle } from './catalogFindToggle';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { selectAllState } from '@/features/browse/selectAllState';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';
import { SavedPage } from '@/features/saved/SavedPage';
import {
  isYouSavedSearch,
  youLibraryTabFromSearch,
} from '@/features/saved/youSavedHref';

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
    categories: product.categories ?? [],
    unit: product.unit ?? null,
    moq: product.moq ?? null,
    rate: product.rate ?? null,
    rateMax: product.rateMax ?? null,
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
type CollectionFilter = 'draft' | 'published' | 'archived';
type ProductFilter = 'draft' | 'published' | 'archived';

const COLLECTION_FILTERS = CATALOG_STATUS_FILTERS;
const PRODUCT_FILTERS = CATALOG_STATUS_FILTERS;

function emptyCollectionCopy(filter: CollectionFilter): { title: string; message: string } {
  switch (filter) {
    case 'published':
      return {
        title: 'No published collections',
        message: 'Publish a pack so buyers can see it on Explore.',
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
  }
}

function emptyProductCopy(filter: ProductFilter): { title: string; message: string } {
  switch (filter) {
    case 'published':
      return {
        title: 'No published designs',
        message:
          'Publish a design for Explore, or publish a pack — pack designs show here too (not as separate Explore tiles).',
      };
    case 'archived':
      return {
        title: 'No archived designs',
        message: 'Archived designs stay here — restore anytime to draft.',
      };
    case 'draft':
      return {
        title: 'No draft designs',
        message: 'Add designs, or create a collection — photos become designs here.',
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

function tabFromSearch(params: URLSearchParams): Tab {
  return youLibraryTabFromSearch(params);
}

function CatalogLayoutToggle({
  layout,
  onToggle,
  className,
}: {
  layout: DesignBrowseLayout;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid="catalog-layout-toggle"
      aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
      className={cx(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5',
        className,
      )}
      onClick={onToggle}
    >
      {layout === 'feed' ? 'Grid' : 'Feed'}
    </button>
  );
}

export function MyCatalogPage({
  embedded = false,
  catalogTabs = true,
}: {
  embedded?: boolean;
  catalogTabs?: boolean;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const { selling, trading } = useTradePresence();
  const companyId = me.data?.id;
  const canCurateOwn = selling || trading;
  const youSaved = embedded && (!catalogTabs || isYouSavedSearch(searchParams));
  const tab = tabFromSearch(searchParams);
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
  const storedProductFilter = readCatalogListFilter(companyId, 'products');
  const storedCollectionFilter = readCatalogListFilter(companyId, 'collections');
  const initialProductFilter: ProductFilter =
    navProductFilter && PRODUCT_FILTERS.some((f) => f.id === navProductFilter)
      ? navProductFilter
      : storedProductFilter ?? DEFAULT_CATALOG_LIST_FILTER;
  const initialCollectionFilter: CollectionFilter =
    navCollectionFilter && COLLECTION_FILTERS.some((f) => f.id === navCollectionFilter)
      ? navCollectionFilter
      : storedCollectionFilter ?? DEFAULT_CATALOG_LIST_FILTER;

  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>(initialCollectionFilter);
  const [productFilter, setProductFilter] = useState<ProductFilter>(initialProductFilter);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkPublishOpen, setBulkPublishOpen] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const deferredListSearch = useDeferredValue(listSearch);

  useEffect(() => {
    setLayout(readDesignBrowseLayout(companyId));
    if (!companyId || navProductFilter || navCollectionFilter) return;
    const storedProducts = readCatalogListFilter(companyId, 'products');
    const storedCollections = readCatalogListFilter(companyId, 'collections');
    if (storedProducts) setProductFilter(storedProducts);
    if (storedCollections) setCollectionFilter(storedCollections);
  }, [companyId]);

  useEffect(() => {
    writeCatalogListFilter(companyId, 'products', productFilter);
  }, [companyId, productFilter]);

  useEffect(() => {
    writeCatalogListFilter(companyId, 'collections', collectionFilter);
  }, [companyId, collectionFilter]);

  const toggleLayout = () => {
    setLayout((prev) => {
      const next = prev === 'feed' ? 'grid' : 'feed';
      writeDesignBrowseLayout(companyId, next);
      return next;
    });
  };

  const writeLibraryParams = (nextTab: Tab, saved: boolean) => {
    const next = new URLSearchParams();
    if (nextTab === 'collections') next.set('tab', 'collections');
    if (saved) next.set('saved', '1');
    if (searchParams.get('select') === '1') next.set('select', '1');
    setSearchParams(next, { replace: true });
  };

  const setTab = (next: Tab) => {
    if (next === 'products' && tab === 'collections') {
      setProductFilter(collectionFilter);
    }
    if (next === 'collections' && tab === 'products') {
      setCollectionFilter(productFilter);
    }
    writeLibraryParams(next, youSaved && catalogTabs);
  };


  useEffect(() => {
    if (!navProductFilter && !navCollectionFilter) return;
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [location.pathname, location.search, navProductFilter, navCollectionFilter, navigate]);

  const products = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
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

  const statusCollections = useMemo(() => {
    const rows = collections.data ?? [];
    if (collectionFilter === 'draft') {
      return rows.filter(
        (row) =>
          row.status === CollectionStatus.Draft || row.status === CollectionStatus.Ready,
      );
    }
    return rows.filter((row) => row.status === collectionFilter);
  }, [collections.data, collectionFilter]);

  const statusProducts = useMemo(() => {
    const rows = products.data ?? [];
    return uniqueById(rows.filter((row) => row.status === productFilter));
  }, [products.data, productFilter]);

  const filteredCollections = useMemo(
    () =>
      statusCollections.filter((row) =>
        catalogSearchMatches(
          deferredListSearch,
          row.name,
          row.description,
          row.categories,
          row.memberFind,
          ...(row.memberShops ?? []).map((shop) => shop.name),
        ),
      ),
    [statusCollections, deferredListSearch],
  );

  const filteredProducts = useMemo(
    () =>
      statusProducts.filter((row) =>
        catalogSearchMatches(
          deferredListSearch,
          ...designFindParts(row),
          row.collectionNames,
        ),
      ),
    [statusProducts, deferredListSearch],
  );
  const listSearchActive = Boolean(deferredListSearch.trim());
  const publishedDesignCount = useMemo(
    () =>
      (products.data ?? []).filter((row) => row.status === ProductStatus.Published).length,
    [products.data],
  );
  const publishedElsewhereHint =
    productFilter === 'draft' ? publishedDesignsElsewhereHint(publishedDesignCount) : null;

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

  const sendToSelection = (intent?: 'order' | 'curate') => {
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
    navigate('/selection', {
      state: {
        openOrder: intent === 'order',
        openCurate: intent === 'curate',
      },
    });
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
    tab === 'products' ? statusProducts.length > 0 : statusCollections.length > 0;

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
        selecting && (hideableIds.length > 0 ? 'pb-40' : 'pb-28'),
      )}
    >
      {embedded ? null : (
        <PageHeader
          title="My designs"
          onBack={onCatalogBack}
          action={
            tabHasItems ? (
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
      )}

      <div className="flex items-center gap-2">
        {embedded || catalogTabs ? (
          <div
            className="flex min-h-12 min-w-0 flex-1 rounded-xl bg-linen p-0.5"
            role="tablist"
            aria-label="Published content"
          >
            {(['products', 'collections'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                data-testid={value === 'products' ? 'you-tab-designs' : 'you-tab-collections'}
                onClick={() => setTab(value)}
                className={cx(
                  'min-h-11 min-w-0 flex-1 rounded-[10px] px-2 text-[13px] font-semibold tracking-tight',
                  tab === value ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-muted',
                )}
              >
                {value === 'products' ? 'Designs' : 'Collections'}
              </button>
            ))}
          </div>
        ) : null}
        {!catalogTabs && (youSaved || tabHasItems) ? (
          <div className="ml-auto flex items-center gap-1">
            <CatalogFindToggle
              testId="you-library-search-toggle"
              open={searchOpen}
              label={tab === 'collections' ? 'Find collections' : 'Find designs'}
              onToggle={() => {
                if (searchOpen) {
                  setSearchOpen(false);
                  setListSearch('');
                  return;
                }
                setSearchOpen(true);
              }}
            />
            <CatalogLayoutToggle
              layout={layout}
              onToggle={toggleLayout}
            />
          </div>
        ) : null}
        {selecting && !youSaved ? (
          <button
            type="button"
            className="ml-auto text-sm font-semibold text-accent"
            onClick={exitSelect}
          >
            Cancel
          </button>
        ) : catalogTabs ? (
          <ListSquareButton
            data-testid="you-library-add"
            aria-label="Add"
            onClick={() => setPostOpen(true)}
          >
            <PlusIcon width={20} height={20} />
          </ListSquareButton>
        ) : null}
      </div>

      {catalogTabs || !embedded ? (
        <div className="flex items-center gap-2">
        <FilterRail className="min-w-0 flex-1">
          {(tab === 'collections' ? COLLECTION_FILTERS : PRODUCT_FILTERS).map((item) => {
            const active =
              !youSaved &&
              (tab === 'collections'
                ? collectionFilter === item.id
                : productFilter === item.id);
            return (
              <Chip
                key={item.id}
                active={active}
                onClick={() => {
                  if (youSaved) writeLibraryParams(tab, false);
                  if (tab === 'collections') {
                    setCollectionFilter(item.id as CollectionFilter);
                  } else {
                    setProductFilter(item.id as ProductFilter);
                  }
                }}
              >
                {item.label}
              </Chip>
            );
          })}
          {embedded && catalogTabs ? (
            <Chip
              data-testid="you-tab-saved"
              active={youSaved}
              onClick={() => writeLibraryParams(tab, true)}
            >
              Saved
            </Chip>
          ) : null}
        </FilterRail>
        <CatalogFindToggle
          testId="you-library-search-toggle"
          open={searchOpen}
          label={tab === 'collections' ? 'Find collections' : 'Find designs'}
          onToggle={() => {
            if (searchOpen) {
              setSearchOpen(false);
              setListSearch('');
              return;
            }
            setSearchOpen(true);
          }}
        />
        {embedded && catalogTabs ? (
          <CatalogLayoutToggle layout={layout} onToggle={toggleLayout} />
        ) : null}
        </div>
      ) : null}

      {searchOpen ? (
        <SearchInput
          data-testid="you-library-search"
          aria-label={tab === 'collections' ? 'Find collections' : 'Find designs'}
          placeholder={tab === 'collections' ? 'Find collections' : 'Find designs'}
          value={listSearch}
          onChange={(event) => setListSearch(event.target.value)}
        />
      ) : null}

      {youSaved ? (
        <SavedPage
          embedded
          hideKindTabs
          kind={tab === 'collections' ? 'collections' : 'designs'}
          layout={layout}
          onToggleLayout={toggleLayout}
          searchQuery={deferredListSearch}
        />
      ) : (
        <>
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

      {tab === 'products' ? (
        <>
          {products.isLoading ? (
            <LoadingBlock />
          ) : products.isError ? (
            <ErrorState
              message="Couldn't load designs. Try again."
              onRetry={() => void products.refetch()}
            />
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
              title={
                listSearchActive
                  ? 'No designs match'
                  : emptyProductCopy(productFilter).title
              }
              message={
                listSearchActive
                  ? 'Try another name, SKU, or tag.'
                  : (publishedElsewhereHint ?? emptyProductCopy(productFilter).message)
              }
              action={
                listSearchActive
                  ? undefined
                  : publishedElsewhereHint ? (
                      <Button onClick={() => setProductFilter('published')}>Show published</Button>
                    ) : productFilter === 'draft' ? (
                      <Button onClick={() => setPostOpen(true)}>Add</Button>
                    ) : undefined
              }
            />
          )}
        </>
      ) : (
        <>
          {collections.isLoading ? (
            <LoadingBlock />
          ) : collections.isError ? (
            <ErrorState
              message="Couldn't load collections. Try again."
              onRetry={() => void collections.refetch()}
            />
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
              title={
                listSearchActive
                  ? 'No collections match'
                  : emptyCollectionCopy(collectionFilter).title
              }
              message={
                listSearchActive
                  ? 'Try another name or shop.'
                  : emptyCollectionCopy(collectionFilter).message
              }
              action={
                listSearchActive ? undefined : collectionFilter === 'draft' ? (
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
                {hideableIds.length > 0 ? (
                  <Button
                    fullWidth
                    disabled={busy}
                    data-testid="catalog-order-for-buyer"
                    onClick={() => sendToSelection('order')}
                  >
                    Order for buyer
                  </Button>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {hideableIds.length > 0 && canCurateOwn ? (
                    <Button
                      variant="secondary"
                      className="min-w-0 flex-1"
                      disabled={busy}
                      data-testid="catalog-curate"
                      onClick={() => sendToSelection('curate')}
                    >
                      Curate
                    </Button>
                  ) : null}
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
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
        </>
      )}

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
  const subtitle = productTileSubtitle(product);
  const statusLine = productStatusLine(product, groups);
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
            className={designBrowsePhotoClass(variant)}
          />
        ) : (
          <div className={designBrowsePhotoClass(variant, 'placeholder')}>
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
      <div className={cx('flex min-w-0 flex-col gap-1 overflow-hidden', feed ? 'p-3' : 'p-2.5')}>
        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        <p className="truncate text-xs font-medium text-ink" data-testid="catalog-product-status">
          {statusLine}
        </p>
        {libraryAuditLine(product) ? (
          <p className="text-[11px] text-muted">{libraryAuditLine(product)}</p>
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
  const previews = collection.previewImages ?? [];

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
  const whoWhen = libraryAuditLine(collection);
  const navigate = useNavigate();
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const mosaicCount = collectionMosaicCount({
    productCount: collection.productCount,
    previewCount: previews.length,
  });
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
      <div className="flex min-w-0 flex-col gap-1 overflow-hidden p-3">
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
