import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  ProductStatus,
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
import { Button, EmptyState, ErrorState, LoadingBlock, SearchInput, Sheet, cx } from '@/ui/kit';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import {
  CollectionIcon,
  FilterIcon,
  LockIcon,
  MoreHorizontalIcon,
  OrdersIcon,
  PaperPlaneIcon,
  PlusIcon,
  ProductIcon,
  RepostIcon,
  ReturnIcon,
} from '@/ui/icons';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { BottomTradeDock, DockIconButton } from '@/features/browse/BottomTradeDock';
import { youLibraryPublishedSelectChrome } from '@/features/catalog/youLibrarySelectDock';
import { CatalogFeedPost } from '@/ui/cards';
import { DesignPhotoCarousel } from '@/ui/DesignPhotoCarousel';
import { YouCollectionListRow } from '@/features/catalog/YouCollectionListRow';
import { youCollectionRowMore } from '@/features/catalog/youLibraryRowMore';
import { useYouLibrarySelectMenu } from '@/features/catalog/youLibrarySelectMenu';
import { BulkCollectionPublishSheet } from './BulkCollectionPublishSheet';
import { BulkProductPublishSheet } from './BulkProductPublishSheet';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { DesignSheet } from '@/features/browse/DesignSheet';
import {
  readBrowseAlbumPick,
  writeBrowseAlbumPick,
  type BrowseAlbumEntry,
} from '@/features/browse/browseAlbumPick';
import {
  addBrowseShortlistMany,
  writeBrowseShortlist,
  type BrowseShortlistEntry,
} from '@/features/browse/browseShortlist';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import {
  curateDefaultPackName,
  partitionRelistableAlbums,
} from '@/features/browse/curateAlbumResolve';
import { OrderCollectionResolveSheet } from '@/features/browse/OrderCollectionResolveSheet';
import {
  collectionIdForPackOrder,
  packHandlerName,
} from '@/features/browse/packOrderSource';
import { partitionForTravelingSelection } from '@/features/browse/partitionForTravelingSelection';
import {
  clearResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import {
  entriesAsProducts,
  sellerIdForEntries,
  useShortlistOrderFlow,
} from '@/features/browse/useShortlistOrderFlow';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  CATALOG_STATUS_FILTERS,
  DEFAULT_CATALOG_LIST_FILTER,
  publishedDesignsElsewhereHint,
  uniqueById,
} from './catalogListFilter';
import { YouLibraryFilterMenu, type YouLibraryFindScope } from './YouLibraryFilterMenu';
import { catalogSearchMatches, designFindParts } from './catalogSearch';
import { BrowseLotChrome } from '@/features/browse/BrowseLotChrome';
import { usePageOwnsBottomBand } from '@/features/browse/selectionBottomBand';
import { selectAllState } from '@/features/browse/selectAllState';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';
import { SavedPage } from '@/features/saved/SavedPage';
import {
  isYouSavedSearch,
  youLibraryTabFromSearch,
  youLibraryWriteSearch,
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
    dispatchUnit: product.dispatchUnit ?? null,
    piecesPerPack: product.piecesPerPack ?? null,
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

function emptyCollectionCopy(filter: CollectionFilter): { title: string; message: string } {
  switch (filter) {
    case 'published':
      return {
        title: 'No collections',
        message: 'Publish a collection so buyers can see it on Explore.',
      };
    case 'archived':
      return {
        title: 'No archived collections',
        message: 'Archived collections stay here — restore anytime to draft.',
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
        title: 'No designs',
        message:
          'Publish a design for Explore, or publish a collection — collection designs show here too (not as separate Explore tiles).',
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
  const companyId = me.data?.id;
  const { selling, trading } = useTradePresence();
  const canCurateOwn = selling || trading;
  const youSaved = embedded && (!catalogTabs || isYouSavedSearch(searchParams));
  const tab = tabFromSearch(searchParams);
  const [postOpen, setPostOpen] = useState(false);
  const [sheetProduct, setSheetProduct] = useState<ProductView | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
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
    navProductFilter && CATALOG_STATUS_FILTERS.some((f) => f.id === navProductFilter)
      ? navProductFilter
      : DEFAULT_CATALOG_LIST_FILTER;
  const initialCollectionFilter: CollectionFilter =
    navCollectionFilter && CATALOG_STATUS_FILTERS.some((f) => f.id === navCollectionFilter)
      ? navCollectionFilter
      : DEFAULT_CATALOG_LIST_FILTER;

  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>(initialCollectionFilter);
  const [productFilter, setProductFilter] = useState<ProductFilter>(initialProductFilter);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const orderFlow = useShortlistOrderFlow();
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [curateResolveOpen, setCurateResolveOpen] = useState(false);
  const [curateOpen, setCurateOpen] = useState(false);
  const [curateProductIds, setCurateProductIds] = useState<string[] | undefined>(undefined);
  const [curateDefaultName, setCurateDefaultName] = useState('');
  const [qtyEntries, setQtyEntries] = useState<BrowseShortlistEntry[] | null>(null);
  // Select dock owns the bottom — hide Home · Chats · ＋ (same as pack manage).
  usePageOwnsBottomBand(selecting && !youSaved);
  const [bulkPublishOpen, setBulkPublishOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lifecycleMoreOpen, setLifecycleMoreOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<CollectionView | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [soloPublishIds, setSoloPublishIds] = useState<string[] | null>(null);
  const [rowShare, setRowShare] = useState<
    { collectionId: string; name: string; image: string | null }[] | null
  >(null);
  const [listSearch, setListSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(
    () =>
      youSaved ||
      initialProductFilter !== 'published' ||
      initialCollectionFilter !== 'published',
  );
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const deferredListSearch = useDeferredValue(listSearch);

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

  const writeLibraryParams = (nextTab: Tab, saved: boolean) => {
    setSearchParams(
      youLibraryWriteSearch({
        tab: nextTab,
        saved,
        select: searchParams.get('select') === '1',
        archived: nextTab === 'collections' && searchParams.get('view') === 'archived' && !saved,
        drafts: nextTab === 'collections' && searchParams.get('view') === 'draft' && !saved,
      }),
      { replace: true },
    );
  };

  const closeLibraryFind = () => {
    setSearchOpen(false);
    setFilterMenuOpen(false);
    setListSearch('');
    setProductFilter('published');
    setCollectionFilter('published');
    if (youSaved) writeLibraryParams(tab, false);
  };

  const archivedCollections = !youSaved && searchParams.get('view') === 'archived';
  const draftCollections = !youSaved && searchParams.get('view') === 'draft';
  const findScope: YouLibraryFindScope = youSaved
    ? 'saved'
    : tab === 'products'
      ? productFilter
      : 'published';
  const findFilterApplied = tab === 'products' && !youSaved && findScope !== 'published';
  const findFilterSummary =
    findScope === 'draft' ? 'Draft' : findScope === 'archived' ? 'Archived' : null;
  const viewSummary = youSaved
    ? 'Bookmark'
    : archivedCollections
      ? 'Archived'
      : draftCollections
        ? 'Drafts'
        : findFilterSummary;

  const applyFindScope = (scope: YouLibraryFindScope) => {
    if (scope === 'saved') {
      writeLibraryParams(tab, true);
      return;
    }
    if (youSaved) writeLibraryParams(tab, false);
    if (tab === 'collections') setCollectionFilter(scope);
    else setProductFilter(scope);
  };

  useEffect(() => {
    if (youSaved) setSearchOpen(true);
  }, [youSaved]);

  const setTab = (next: Tab) => {
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
  const myCompany = me.data
    ? { id: me.data.id, name: me.data.name }
    : null;

  const statusCollections = useMemo(() => {
    const rows = collections.data ?? [];
    if (archivedCollections) {
      return rows.filter((row) => row.status === CollectionStatus.Archived);
    }
    if (draftCollections) {
      return rows.filter(
        (row) => row.status === CollectionStatus.Draft || row.status === CollectionStatus.Ready,
      );
    }
    return rows.filter((row) => row.status !== CollectionStatus.Archived);
  }, [collections.data, archivedCollections, draftCollections]);

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
  const shareCollections =
    tab === 'collections'
      ? selectedCollections
          .filter((c) => c.status === CollectionStatus.Published)
          .map((c) => ({
            collectionId: c.id,
            name: c.name,
            image: c.coverImage,
          }))
      : [];
  const shareProducts =
    tab === 'products'
      ? selectedProducts
          .filter((p) => p.status === ProductStatus.Published)
          .map((p) => ({
            productId: p.id,
            name: p.name,
            image: p.images[0] ?? null,
          }))
      : [];
  const restorableIds =
    tab === 'collections'
      ? selectedCollections
          .filter((c) => c.status === CollectionStatus.Archived)
          .map((c) => c.id)
      : selectedProducts.filter((p) => p.status === ProductStatus.Archived).map((p) => p.id);
  const publishedSelectChrome = youLibraryPublishedSelectChrome({
    hideableCount: hideableIds.length,
  });
  const showPublishedTradeDock = publishedSelectChrome.dock.length > 0;
  const showLifecycleMore =
    tab === 'products' &&
    (hideableIds.length > 0 || (publishableIds.length > 0 && archivableIds.length > 0));

  useEffect(() => {
    setSelecting(false);
    setSelectedIds(new Set());
    setBulkPublishOpen(false);
    setOpenSwipeId(null);
  }, [tab]);

  useEffect(() => {
    if (!openSwipeId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`[data-testid="you-collection-swipe-${openSwipeId}"]`)) return;
      setOpenSwipeId(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [openSwipeId]);

  useEffect(() => {
    if (selecting) setOpenSwipeId(null);
  }, [selecting]);

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
    setShareOpen(false);
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

  const openCurateWithDesigns = (
    source: BrowseShortlistEntry[],
    expandedAlbumNames: string[] = [],
  ) => {
    if (source.length === 0) {
      showToast('Pick at least one design.');
      return;
    }
    setCurateDefaultName(
      curateDefaultPackName({
        expandedAlbumNames,
        allowedDesignNames: source.map((entry) => entry.name),
      }),
    );
    setCurateProductIds(source.map((entry) => entry.productId));
    setCurateOpen(true);
  };

  /** Stage published picks, then Order / Repost on this page — never auto-write the cart. */
  const sendToSelection = (intent?: 'order' | 'curate') => {
    if (!myCompany || selectedIds.size < 1) return;
    let designs: BrowseShortlistEntry[] = [];
    let albums: BrowseAlbumEntry[] = [];
    if (tab === 'products') {
      const { published, toast } = partitionForTravelingSelection(selectedProducts);
      if (toast) showToast(toast);
      if (published.length < 1) return;
      designs = published.map((row) => toCatalogShortlistEntry(row, myCompany));
      addBrowseShortlistMany(designs);
    } else {
      const { published, toast } = partitionForTravelingSelection(selectedCollections);
      if (toast) showToast(toast);
      if (published.length < 1) return;
      albums = published.map((row) => toCatalogAlbumEntry(row, myCompany));
      addAlbumMany(albums);
    }
    exitSelect();
    if (intent === 'order') {
      orderFlow.setError(null);
      if (albums.length > 0) {
        setOrderResolveOpen(true);
        return;
      }
      setQtyEntries(designs);
      orderFlow.setQtyOpen(true);
      return;
    }
    if (intent === 'curate') {
      if (albums.length > 0) {
        setCurateResolveOpen(true);
        return;
      }
      openCurateWithDesigns(designs, []);
    }
  };

  const orderCollection = (collection: CollectionView) => {
    if (!myCompany) return;
    const { published, toast } = partitionForTravelingSelection([collection]);
    if (toast) showToast(toast);
    if (published.length < 1) return;
    const albums = published.map((row) => toCatalogAlbumEntry(row, myCompany));
    addAlbumMany(albums);
    orderFlow.setError(null);
    setOrderResolveOpen(true);
  };

  const shareCollection = (collection: CollectionView) => {
    if (collection.status !== CollectionStatus.Published) {
      showToast('Publish this collection before you share.');
      return;
    }
    setRowShare([
      {
        collectionId: collection.id,
        name: collection.name,
        image: collection.libraryThumb ?? collection.coverImage,
      },
    ]);
    setShareOpen(true);
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

  useYouLibrarySelectMenu({
    selecting: selecting && !youSaved && tab === 'collections' && selectedIds.size > 0,
    canDraft: hideableIds.length > 0,
    canPublish: publishableIds.length > 0,
    canArchive: archivableIds.length > 0,
    onDraft: () => bulkHide.mutate(hideableIds),
    onPublish: () => setBulkPublishOpen(true),
    onArchive: () => bulkArchive.mutate(archivableIds),
  });

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
      {embedded ? null : <PageHeader title="My designs" onBack={onCatalogBack} />}

      <div className="flex items-center gap-2.5">
        {embedded || catalogTabs ? (
          <div
            className="relative z-10 flex w-fit shrink-0 gap-4"
            role="tablist"
            aria-label="Library"
            data-testid="you-library-kind-tabs"
          >
            {(['collections', 'products'] as const).map((value) => {
              const TabIcon = value === 'products' ? ProductIcon : CollectionIcon;
              return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                data-testid={value === 'products' ? 'you-tab-designs' : 'you-tab-collections'}
                onClick={() => setTab(value)}
                className={cx(
                  'relative isolate inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-0.5 text-[15px] tracking-tight touch-manipulation',
                  tab === value
                    ? 'border-accent font-emphasis text-ink'
                    : 'border-transparent font-body text-muted',
                )}
              >
                <TabIcon width={16} height={16} className="shrink-0" aria-hidden />
                {value === 'products' ? 'Designs' : 'Collections'}
              </button>
              );
            })}
          </div>
        ) : null}
        {catalogTabs && !selecting && tab === 'products' ? (
          <button
            type="button"
            data-testid="you-library-add"
            aria-label="Add"
            onClick={() => setPostOpen(true)}
            className="relative z-0 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-[0_2px_8px_rgba(15,76,71,0.35)] hover:bg-accent-dark"
          >
            <PlusIcon width={20} height={20} />
          </button>
        ) : null}
      </div>

      {catalogTabs && tab === 'collections' && !selecting && !youSaved && !archivedCollections ? (
        <button
          type="button"
          data-testid="you-new-collection"
          onClick={() => navigate('/catalog/collections/new')}
          className="flex w-full items-center gap-3 border-b border-line px-1 py-2 text-left hover:bg-foam/40"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-line text-accent">
            <PlusIcon width={22} height={22} />
          </span>
          <span className="text-[15px] font-emphasis tracking-tight text-accent">New collection</span>
        </button>
      ) : null}

      {catalogTabs || youSaved || tabHasItems ? (
        <BrowseLotChrome
          findOpen={searchOpen}
          findLabel={tab === 'collections' ? 'Find collections' : 'Find designs'}
          findTestId="you-library-search-toggle"
          onFindToggle={() => {
            if (searchOpen) {
              closeLibraryFind();
              return;
            }
            setSearchOpen(true);
          }}
          findPanel={
            <div className="flex flex-col gap-1.5">
              <ListSearchRow
                search={
                  <SearchInput
                    data-testid="you-library-search"
                    aria-label={tab === 'collections' ? 'Find collections' : 'Find designs'}
                    placeholder={tab === 'collections' ? 'Find collections' : 'Find designs'}
                    value={listSearch}
                    onChange={(event) => setListSearch(event.target.value)}
                  />
                }
                action={
                  tab === 'products' && !youSaved ? (
                    <ListSquareButton
                      ref={filterAnchorRef}
                      data-testid="you-library-filter"
                      data-filter-active={findFilterApplied ? 'true' : 'false'}
                      aria-label="Filter"
                      aria-expanded={filterMenuOpen}
                      aria-haspopup="menu"
                      aria-pressed={findFilterApplied}
                      active={findFilterApplied || filterMenuOpen}
                      onClick={() => setFilterMenuOpen((open) => !open)}
                    >
                      <FilterIcon
                        width={20}
                        height={20}
                        className={findFilterApplied || filterMenuOpen ? 'text-white' : undefined}
                      />
                    </ListSquareButton>
                  ) : undefined
                }
              />
              {tab === 'products' && !youSaved ? (
                <YouLibraryFilterMenu
                  open={filterMenuOpen}
                  onClose={() => setFilterMenuOpen(false)}
                  anchorRef={filterAnchorRef}
                  value={findScope}
                  onChange={applyFindScope}
                />
              ) : null}
              {viewSummary ? (
                <div className="relative z-10 flex flex-wrap items-center gap-x-3 px-0.5">
                  <p className="text-xs font-body text-muted" data-testid="you-library-view-summary">
                    Showing <span className="text-ink">{viewSummary}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (youSaved) {
                        writeLibraryParams(tab, false);
                        return;
                      }
                      if (archivedCollections || draftCollections) {
                        setSearchParams(
                          youLibraryWriteSearch({
                            tab: 'collections',
                            select: searchParams.get('select') === '1',
                          }),
                          { replace: true },
                        );
                        return;
                      }
                      applyFindScope('published');
                    }}
                    className="inline-flex min-h-8 items-center text-xs font-emphasis tracking-tight text-accent"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
          }
          selecting={selecting}
          selectedCount={selectedIds.size}
          allSelected={selectAllState(visibleIds, selectedIds).allSelected}
          onEnterSelect={() => setSelecting(true)}
          onSelectAll={() => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              for (const id of visibleIds) next.add(id);
              return next;
            });
          }}
          onClear={exitSelect}
          canSelect={!youSaved && tabHasItems}
          selectTestId="you-library-select"
          layout={tab === 'products' ? layout : undefined}
          layoutTestId="you-library-layout-toggle"
          onLayoutToggle={tab === 'products' ? toggleLayout : undefined}
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
                layout === 'feed' ? 'flex flex-col' : 'grid grid-cols-2 gap-3'
              }
              data-testid="catalog-products-layout"
              data-layout={layout}
            >
              {filteredProducts.map((product) => (
                <SellerProductTile
                  key={product.id}
                  product={product}
                  variant={layout}
                  selecting={selecting}
                  selected={selectedIds.has(product.id)}
                  onToggle={() => toggleSelected(product.id)}
                  onLongSelect={() => startSelect(product.id)}
                  onOpenPublished={() => {
                    setSheetIndex(0);
                    setSheetProduct(product);
                  }}
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
                      <Button onClick={closeLibraryFind}>Show live</Button>
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
          ) : (
            <div className="flex flex-col gap-1" data-testid="catalog-collections-layout" data-layout="list">
              {filteredCollections.length > 0 ? (
                filteredCollections.map((collection) => (
                  <YouCollectionListRow
                    key={collection.id}
                    collection={collection}
                    selecting={selecting}
                    selected={selectedIds.has(collection.id)}
                    actionFocus={
                      rowMenu?.id === collection.id ||
                      (shareOpen &&
                        rowShare?.length === 1 &&
                        rowShare[0].collectionId === collection.id)
                    }
                    swipeOpen={openSwipeId === collection.id}
                    onSwipeOpen={() => setOpenSwipeId(collection.id)}
                    onSwipeClose={() =>
                      setOpenSwipeId((id) => (id === collection.id ? null : id))
                    }
                    onToggle={() => toggleSelected(collection.id)}
                    onLongSelect={() => startSelect(collection.id)}
                    onMore={() => setRowMenu(collection)}
                    onShare={() => shareCollection(collection)}
                  />
                ))
              ) : (
                <EmptyState
                  title={
                    listSearchActive
                      ? 'No collections match'
                      : emptyCollectionCopy(
                          draftCollections ? 'draft' : archivedCollections ? 'archived' : 'published',
                        ).title
                  }
                  message={
                    listSearchActive
                      ? 'Try another name or shop.'
                      : emptyCollectionCopy(
                          draftCollections ? 'draft' : archivedCollections ? 'archived' : 'published',
                        ).message
                  }
                />
              )}
            </div>
          )}
        </>
      )}

      {selecting ? (
        <BottomTradeDock testId="you-library-select-dock" aboveAppNav={false}>
          <div className="flex w-full items-stretch gap-2">
            {showPublishedTradeDock ? (
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <DockIconButton
                  testId="catalog-share"
                  label="Share"
                  disabled={busy}
                  onClick={() => setShareOpen(true)}
                >
                  <PaperPlaneIcon width={22} height={22} />
                </DockIconButton>
                <DockIconButton
                  testId="catalog-order"
                  label="Order"
                  primary
                  disabled={busy}
                  onClick={() => sendToSelection('order')}
                >
                  <OrdersIcon width={22} height={22} />
                </DockIconButton>
              </div>
            ) : publishableIds.length > 0 ? (
              <Button
                className="min-w-0 flex-1"
                disabled={busy}
                data-testid="catalog-publish"
                onClick={() => setBulkPublishOpen(true)}
              >
                Publish {publishableIds.length}
              </Button>
            ) : restorableIds.length > 0 ? (
              <Button
                className="min-w-0 flex-1"
                disabled={busy}
                data-testid="catalog-restore"
                onClick={() => bulkRestore.mutate(restorableIds)}
              >
                {bulkRestore.isPending ? 'Restoring…' : `Restore ${restorableIds.length}`}
              </Button>
            ) : (
              <span className="min-w-0 flex-1" />
            )}
            {tab === 'products' && showLifecycleMore ? (
              <button
                type="button"
                data-testid="you-library-select-more"
                aria-label="More"
                aria-expanded={lifecycleMoreOpen}
                disabled={busy}
                onClick={() => setLifecycleMoreOpen(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink"
              >
                <MoreHorizontalIcon width={22} height={22} />
              </button>
            ) : null}
          </div>
        </BottomTradeDock>
      ) : null}
      <MoreActionsSheet
        open={lifecycleMoreOpen}
        onClose={() => setLifecycleMoreOpen(false)}
        title={tab === 'collections' ? 'Collections' : 'Designs'}
        testId="you-library-lifecycle-more"
        items={[
          ...(hideableIds.length > 0
            ? [
                {
                  id: 'hide',
                  label: 'Hide · draft',
                  icon: <LockIcon width={20} height={20} />,
                  disabled: busy,
                  onClick: () => {
                    setLifecycleMoreOpen(false);
                    bulkHide.mutate(hideableIds);
                  },
                  testId: 'catalog-hide-draft',
                },
              ]
            : []),
          ...(archivableIds.length > 0
            ? [
                {
                  id: 'archive',
                  label: 'Archive',
                  icon: <ReturnIcon width={20} height={20} />,
                  disabled: busy,
                  onClick: () => {
                    setLifecycleMoreOpen(false);
                    bulkArchive.mutate(archivableIds);
                  },
                  testId: 'catalog-archive',
                },
              ]
            : []),
          ...(tab === 'products' && canCurateOwn && hideableIds.length > 0
            ? [
                {
                  id: 'repost',
                  label: 'Repost',
                  icon: <RepostIcon width={20} height={20} />,
                  disabled: busy,
                  onClick: () => {
                    setLifecycleMoreOpen(false);
                    sendToSelection('curate');
                  },
                  testId: 'catalog-curate',
                },
              ]
            : []),
        ]}
      />
      <MoreActionsSheet
        open={rowMenu != null}
        onClose={() => setRowMenu(null)}
        title={rowMenu?.name ?? 'Collection'}
        testId="you-collection-row-more"
        items={
          rowMenu
            ? youCollectionRowMore(rowMenu).map((action) => {
                if (action === 'hide') {
                  return {
                    id: 'hide',
                    label: 'Hide Draft',
                    icon: <LockIcon width={20} height={20} />,
                    testId: 'you-collection-hide-draft',
                    onClick: () => {
                      const id = rowMenu.id;
                      setRowMenu(null);
                      bulkHide.mutate([id]);
                    },
                  };
                }
                if (action === 'unhide') {
                  return {
                    id: 'unhide',
                    label: 'Unhide Draft',
                    icon: <LockIcon width={20} height={20} />,
                    testId: 'you-collection-unhide-draft',
                    disabled: !isCollectionPublishable(rowMenu),
                    onClick: () => {
                      setSoloPublishIds([rowMenu.id]);
                      setBulkPublishOpen(true);
                      setRowMenu(null);
                    },
                  };
                }
                if (action === 'archive') {
                  return {
                    id: 'archive',
                    label: 'Archive',
                    icon: <ReturnIcon width={20} height={20} />,
                    testId: 'you-collection-archive',
                    onClick: () => {
                      const id = rowMenu.id;
                      setRowMenu(null);
                      bulkArchive.mutate([id]);
                    },
                  };
                }
                return {
                  id: 'order',
                  label: 'Order',
                  icon: <OrdersIcon width={20} height={20} />,
                  testId: 'you-collection-order',
                  onClick: () => {
                    const collection = rowMenu;
                    setRowMenu(null);
                    orderCollection(collection);
                  },
                };
              })
            : []
        }
      />
        </>
      )}

      {sheetProduct ? (
        <DesignSheet
          product={sheetProduct}
          index={sheetIndex}
          onIndex={setSheetIndex}
          onClose={() => setSheetProduct(null)}
          canEdit
          canDelete
          onEdit={() => {
            const designId = sheetProduct.id;
            setSheetProduct(null);
            navigate(`/catalog/products/${designId}`);
          }}
          onDelete={() => {
            if (
              typeof window !== 'undefined' &&
              !window.confirm(`Delete ${sheetProduct.name}? This cannot be undone.`)
            ) {
              return;
            }
            void api
              .del(`/products/${sheetProduct.id}`)
              .then(() => {
                setSheetProduct(null);
                void queryClient.invalidateQueries({ queryKey: ['catalog'] });
                showToast('Design deleted', 'success');
              })
              .catch((error) =>
                showToast(
                  error instanceof ApiError ? error.message : 'Could not delete.',
                  'danger',
                ),
              );
          }}
          testIdPrefix="you-design-sheet"
        />
      ) : null}

      <CatalogShareSheet
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          setRowShare(null);
        }}
        collections={rowShare ?? shareCollections}
        products={shareProducts}
        onShared={() => {
          setShareOpen(false);
          setRowShare(null);
          exitSelect();
        }}
      />

      <OrderCollectionResolveSheet
        intent="order"
        open={orderResolveOpen}
        onClose={() => setOrderResolveOpen(false)}
        albums={albumPick.entries}
        designCount={shortlist.count}
        existingShortlist={shortlist.entries}
        onResolved={({ shortlist: nextShortlist, remainingAlbums, navigateToCollectionId }) => {
          writeBrowseShortlist(nextShortlist);
          writeBrowseAlbumPick(remainingAlbums);
          setOrderResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('order');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          setQtyEntries(nextShortlist);
          orderFlow.setQtyOpen(true);
        }}
      />
      <OrderCollectionResolveSheet
        intent="curate"
        open={curateResolveOpen}
        onClose={() => setCurateResolveOpen(false)}
        albums={partitionRelistableAlbums(albumPick.entries).allowed}
        designCount={shortlist.count}
        existingShortlist={shortlist.entries}
        onResolved={({
          shortlist: nextShortlist,
          remainingAlbums,
          navigateToCollectionId,
          expandedAlbumNames,
        }) => {
          writeBrowseShortlist(nextShortlist);
          writeBrowseAlbumPick(remainingAlbums);
          setCurateResolveOpen(false);
          if (navigateToCollectionId) {
            writeResumeAfterAlbumPick('curate');
            navigate(`/collections/${navigateToCollectionId}`, {
              state: { enterSelect: true },
            });
            return;
          }
          clearResumeAfterAlbumPick();
          openCurateWithDesigns(nextShortlist, expandedAlbumNames);
        }}
      />
      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => {
          orderFlow.setQtyOpen(false);
          setQtyEntries(null);
        }}
        sellerId={sellerIdForEntries(qtyEntries ?? shortlist.entries)}
        products={entriesAsProducts(qtyEntries ?? shortlist.entries)}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        orderGoesToName={packHandlerName(qtyEntries ?? shortlist.entries)}
        sheetJob="order"
        onSendOrder={(lines, place) => {
          const linesForPath = qtyEntries ?? shortlist.entries;
          orderFlow.sendOrder(lines, {
            ...place,
            collectionId: collectionIdForPackOrder(linesForPath),
          });
        }}
        onAskRates={() => undefined}
      />
      <CurateFromSelectionSheet
        open={curateOpen}
        onClose={() => {
          setCurateOpen(false);
          setCurateProductIds(undefined);
          setCurateDefaultName('');
        }}
        productIds={curateProductIds}
        defaultName={curateDefaultName}
      />

      {tab === 'collections' ? (
        <BulkCollectionPublishSheet
          open={bulkPublishOpen}
          onClose={() => {
            setBulkPublishOpen(false);
            setSoloPublishIds(null);
          }}
          collectionIds={soloPublishIds ?? publishableIds}
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
            <p className="text-sm font-emphasis text-ink">Single design</p>
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
            <p className="text-sm font-emphasis text-ink">Collection</p>
            <p className="mt-0.5 text-xs text-muted">Album of designs as one post</p>
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function SellerProductTile({
  product,
  variant,
  selecting,
  selected,
  onToggle,
  onLongSelect,
  onOpenPublished,
}: {
  product: ProductView;
  variant: DesignBrowseLayout;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onLongSelect: () => void;
  onOpenPublished: () => void;
}) {
  const navigate = useNavigate();
  const longPress = useLongPress(selecting ? undefined : onLongSelect);
  const feed = variant === 'feed';
  const open = () => {
    if (selecting) {
      onToggle();
      return;
    }
    if (product.status === ProductStatus.Published) {
      onOpenPublished();
      return;
    }
    navigate(`/catalog/products/${product.id}`);
  };
  if (feed) {
    const live = product.status === ProductStatus.Published;
    return (
      <CatalogFeedPost
        name={product.name}
        href={live ? undefined : `/catalog/products/${product.id}`}
        onOpen={live ? () => open() : undefined}
        images={product.images}
        imageCount={1}
        selected={selected}
        selectMode={selecting}
        onMediaClick={() => open()}
        onLongSelect={selecting ? undefined : onLongSelect}
        mediaTestId="catalog-product-tile"
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-line bg-surface text-left"
      data-testid="catalog-product-tile"
    >
      <DesignPhotoCarousel
        urls={product.images}
        name={product.name}
        photoClassName={designBrowsePhotoClass(variant)}
        placeholderClassName={designBrowsePhotoClass(variant, 'placeholder')}
        selectMode={selecting}
        selected={selected}
        onActivate={() => open()}
        onLongSelect={selecting ? undefined : onLongSelect}
        testId="catalog-product-photos"
      />
      <button
        type="button"
        onClick={open}
        className={cx(
          'flex w-full min-w-0 flex-col gap-1 overflow-hidden text-left',
          feed ? 'p-3' : 'p-2.5',
          LONG_PRESS_SURFACE_CLASS,
        )}
        {...longPress}
      >
        <p className="truncate text-sm font-emphasis text-ink">{product.name}</p>
      </button>
    </div>
  );
}

