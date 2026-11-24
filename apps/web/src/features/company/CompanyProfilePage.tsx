import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  ProductStatus,
  type CollectionCard,
  type CollectionView,
  type CompanyContactPoint,
  type ConnectionView,
  type CursorPage,
  type ExploreProductCard,
  type CreateOrdersBatchResult,
  type MuteFor,
  type OwnCompanyProfile,
  type PublicCompanyProfile,
  type PublicCompanySummary,
  type TeamMemberView,
  type ThreadSummary,
  categoryDisplayLabel,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { navigateBackOr } from '@/lib/navigateBackOr';
import {
  seePacksShopLabel,
  shopWriteLabel,
  UNBLOCK_ACCESS_CLEARED_TOAST,
  YOUR_BLOCK_REMOVED_TOAST,
} from './seePacksCopy';
import { shopShelfLoading } from './shopShelfLoading';
import { profileGalleryUrls } from './profileGalleryUrls';
import { showcaseOnlyUrls } from './showcaseUrls';
import { ShowcaseBrowseSheet } from './ShowcaseBrowseSheet';
import {
  profileCompletenessChips,
  profileCompletenessFingerprint,
  profileCompletenessGaps,
} from './profileCompleteness';
import {
  isProfileCompletenessDismissed,
  writeProfileCompletenessDismissed,
} from './profileCompletenessDismiss';
import { ProfileCompletenessNudge } from './ProfileCompletenessNudge';
import { BusinessInfoSection } from './BusinessInfoSection';
import {
  HOME_CATALOGUE_COLLECTION_PREVIEW,
  HOME_CATALOGUE_DESIGN_PREVIEW,
  cataloguePreviewSlice,
  seeAllCatalogueLabel,
} from './homeCataloguePreview';
import {
  BookmarkIcon,
  ChatIcon,
  CollectionIcon,
  GroupIcon,
  LockIcon,
  MoreHorizontalIcon,
  OrdersIcon,
  PencilIcon,
  ProductIcon,
  PaperPlaneIcon,
  UnlockIcon,
} from '@/ui/icons';
import { PhotoViewer } from '@/ui/PhotoViewer';
import { BrowseLayoutToggle } from '@/ui/BrowseLayoutToggle';
import { useCompanyId } from '@/lib/auth';
import { useTeamCaps } from '@/lib/teamCaps';
import {
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
  type DesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import type { BrowseAlbumEntry } from '@/features/browse/browseAlbumPick';
import { writeBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { writeBrowseShortlist } from '@/features/browse/browseShortlist';
import {
  BottomTradeDock,
  DockIconButton,
  SELECTION_DOCK_CLEARANCE_CLASS,
} from '@/features/browse/BottomTradeDock';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { usePrepareCatalogOrder } from '@/features/browse/usePrepareCatalogOrder';
import {
  clearResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import { SelectionMessageSheet } from '@/features/browse/SelectionMessageSheet';
import { FirstMessageSheet } from '@/features/chats/FirstMessageSheet';
import { coldMessageAction } from '@/features/chats/firstMessageGate';
import { entriesAsProducts, orderGoesToSellerId } from '@/features/browse/useShortlistOrderFlow';
import { collectionIdForPackOrder, packHandlerName } from '@/features/browse/packOrderSource';
import { batchConfirmTitle, batchSuccessLeave } from '@/features/orders/BatchOrderConfirmSheet';
import { selectAllState } from '@/features/browse/selectAllState';
import { SelectModeControls } from '@/features/browse/SelectModeControls';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { placeNoteAttachFields } from '@/features/orders/placeNoteAttach';
import { useToast } from '@/ui/Toast';
import { PageHeader } from '@/ui/PageHeader';
import { GstTick, isGstVerified } from '@/ui/GstTick';
import { shopSellCategories } from '@/ui/shopIdentity';
import { Avatar, ErrorState, LoadingBlock, SearchInput, cx } from '@/ui/kit';
import { catalogSearchMatches, designFindParts } from '@/features/catalog/catalogSearch';
import { CatalogFindToggle } from '@/features/catalog/catalogFindToggle';
import { YouCollectionListRow } from '@/features/catalog/YouCollectionListRow';
import { YouLibraryCreateRow } from '@/features/catalog/YouLibraryCreateRow';
import {
  shopCollectionShelfMeta,
  toShopCollectionRow,
} from '@/features/company/shopCollectionShelfMeta';
import { SellerProductTile } from '@/features/catalog/SellerProductTile';
import {
  bookmarkThisPackLabel,
  shareThisPackLabel,
} from '@/features/catalog/packKindCopy';
import { useTradePresence } from '@/lib/tradePresence';
import { CREATE_FAB_EXPLAIN } from '@/app/createFabIntent';
import { DesignSheet, type DesignSheetProduct } from '@/features/browse/DesignSheet';
import { OwnerCollectionMoreSheet } from '@/features/collections/OwnerCollectionMoreSheet';
import { visitorCollectionMoreIds } from '@/features/collections/visitorCollectionMore';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';
import {
  invalidateAfterBlock,
  invalidateFollowCatalog,
} from '@/features/network/invalidateFollowCatalog';
import { CompanyOverflowMenu } from './CompanyOverflowMenu';
import { CompanyShareSheet } from './CompanyShareSheet';
import { BusinessProfileHeroMedia } from './BusinessProfileHeroMedia';
import { shopCollectionPhoto } from './shopPhoto';
import {
  findDirectThreadForCompany,
  shopOverflowItems,
} from './shopOverflowMenu';
import {
  firstShopTabWithContent,
  shouldShowShopTradeDock,
  shopAlbumEntries,
  shopShortlistEntries,
  shopTabSelectedCount,
} from './shopTradeDock';
import { underlineTabChrome } from '@/features/catalog/youLibraryKind';
import { UNDERLINE_TAB_BAR_BASE_CLASS } from '@/ui/underlineTabChrome';
import {
  homeCatalogueSearchParam,
  homeCatalogueTabFromSearch,
} from './homeCatalogueTab';

type ShopTab = 'designs' | 'collections';

export type BusinessProfileVariant = 'home' | 'shop' | 'catalogue';

/** Shop route — props-free for lazy `page()` loader. */
export function CompanyProfilePage() {
  return <BusinessProfileBody variant="shop" />;
}

/** Full visitor catalogue — Select / Find / dock; props-free for lazy `page()` loader. */
export function ShopCataloguePage() {
  return <BusinessProfileBody variant="catalogue" />;
}

function toShopShortlistEntry(
  product: ExploreProductCard,
  _shopCompanyId: string,
): BrowseShortlistEntry {
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.company.id,
    companyName: product.company.name,
    unit: product.unit ?? null,
    dispatchUnit: product.dispatchUnit ?? null,
    rate: product.rate ?? null,
    ...(product.catalogCollectionId
      ? { catalogCollectionId: product.catalogCollectionId }
      : {}),
    ...(product.catalogOrderMode
      ? { catalogOrderMode: product.catalogOrderMode }
      : {}),
  };
}

function toDesignSheetProduct(product: ExploreProductCard): DesignSheetProduct {
  return {
    id: product.id,
    name: product.name,
    images: product.images,
    companyId: product.company.id,
    companyName: product.company.name,
    allowForward: product.allowForward,
    categories: product.categories,
    description: null,
    unit: product.unit,
    dispatchUnit: product.dispatchUnit ?? null,
    moq: null,
    rate: product.rate,
    rateMax: product.rateMax,
    status: ProductStatus.Published,
    catalogCollectionId: product.catalogCollectionId,
    catalogOrderMode: product.catalogOrderMode,
  };
}

function toShopAlbumEntry(collection: CollectionCard, shopCompanyId: string): BrowseAlbumEntry {
  return {
    collectionId: collection.id,
    name: collection.name,
    coverImage: shopCollectionPhoto(collection),
    companyId: shopCompanyId,
    companyName: collection.company.name,
    productCount: collection.productCount,
    allowForward: collection.allowForward,
    orderPathPreference: collection.orderPathPreference,
    kind: collection.kind,
    orderMode: collection.orderMode,
  };
}

export function BusinessProfileBody({
  companyId: companyIdProp,
  variant = 'shop',
}: {
  companyId?: string;
  variant?: BusinessProfileVariant;
}) {
  const { id: paramId = '' } = useParams();
  const id = companyIdProp ?? paramId;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const myCompanyId = useCompanyId();
  const isHome = variant === 'home';
  const isCatalogue = variant === 'catalogue';
  const isShopFace = variant === 'shop';
  /** Profile-face preview (Home + visitor shop); full list on catalogue page. */
  const previewCatalogue = isHome || isShopFace;
  /** Select / Find / layout / trade dock — catalogue page only. */
  const shelfInteractive = isCatalogue;
  const { isOwner, can: canCap } = useTeamCaps();
  const { selling } = useTradePresence();
  const canInviteTeam = isOwner || canCap('team');
  const canUploads = canCap('uploads');
  /** Own Home create path — same gate as nav ＋. */
  const showOwnerCreate = isHome && selling && canUploads;
  const isOwn = Boolean(id) && id === myCompanyId;
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const { showToast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [catalogShareOpen, setCatalogShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [firstMessageOpen, setFirstMessageOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  /** `full` = cover-first profile gallery; `showcase` = Showcase URLs only. */
  const [galleryMode, setGalleryMode] = useState<'full' | 'showcase'>('full');
  const [showcaseBrowseOpen, setShowcaseBrowseOpen] = useState(false);
  const [nudgeDismissTick, setNudgeDismissTick] = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [qtyEntries, setQtyEntries] = useState<BrowseShortlistEntry[] | null>(null);
  const [lockedProductIds, setLockedProductIds] = useState<string[]>([]);
  const { prepare: prepareCatalogOrder } = usePrepareCatalogOrder();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [actionError] = useState<string | null>(null);
  const [successNote] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<ShopTab>('collections');
  const [listSearch, setListSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const deferredListSearch = useDeferredValue(listSearch);
  const [layout, setLayout] = useState<DesignBrowseLayout>(() =>
    readDesignBrowseLayout(myCompanyId),
  );
  const shopTabSeededFor = useRef<string | null>(null);
  const shopTabUserPicked = useRef(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<CollectionCard | null>(null);
  const [rowShare, setRowShare] = useState<CollectionCard | null>(null);
  const [sheetProduct, setSheetProduct] = useState<ExploreProductCard | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const rowSave = useSaveToggle({ collectionId: rowMenu?.id ?? '' });

  useEffect(() => {
    setLayout(readDesignBrowseLayout(myCompanyId));
  }, [myCompanyId]);

  const profile = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.get<PublicCompanyProfile>(`/companies/${id}`),
    enabled: Boolean(id),
  });
  /** Own DTO for sellCategories (public profile only exposes composite categories). */
  const ownProfile = useQuery({
    queryKey: ['company', 'me'],
    queryFn: () => api.get<OwnCompanyProfile>('/companies/me'),
    enabled: isHome,
  });
  /** Missing profileAccess (older fixtures) counts as open. */
  const profileAccess = profile.data?.profileAccess !== false;
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<PublicCompanySummary[]>('/follows/following'),
  });
  const threads = useQuery({
    queryKey: ['threads'],
    queryFn: () => api.get<CursorPage<ThreadSummary>>('/threads', { limit: 50 }),
    enabled: Boolean(id) && !isOwn,
  });
  /** Fetch shelf in parallel while profile loads; stop only once Private is known. */
  const shelfEnabled = Boolean(id) && (!profile.isSuccess || profileAccess);
  const shopCollections = useQuery({
    queryKey: ['company', id, 'collections'],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>(`/companies/${id}/collections`, { limit: 20 }),
    enabled: shelfEnabled,
  });
  /** Own library memberShops — owner From cue (not gated by Show supplier). */
  const ownLibraryCollections = useQuery({
    queryKey: ['collections', 'own-shelf-meta'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: shelfEnabled && isOwn,
  });
  const libraryMemberShopsById = useMemo(() => {
    const map = new Map<string, CollectionView['memberShops']>();
    for (const row of ownLibraryCollections.data ?? []) {
      map.set(row.id, row.memberShops ?? []);
    }
    return map;
  }, [ownLibraryCollections.data]);
  const shopDesigns = useQuery({
    queryKey: ['company', id, 'designs'],
    queryFn: () =>
      api.get<CursorPage<ExploreProductCard>>(`/companies/${id}/designs`, { limit: 20 }),
    enabled: shelfEnabled,
  });

  const connection = connections.data?.find((item) => item.company.id === id);
  const isConnected =
    profile.data?.connected === true || connection?.status === 'active';
  const alreadyTalks = isConnected || profile.data?.hasChat === true;
  const isFollowing =
    profile.data?.following === true ||
    (following.data?.some((item) => item.id === id) ?? false);
  const isFollowPending = profile.data?.followPending === true;
  const directThread = findDirectThreadForCompany(threads.data?.results, id);
  const canUnblock = connection?.canUnblock === true;
  const overflowItems = shopOverflowItems({
    isOwn,
    hasDirectThread: Boolean(directThread),
    followPending: isFollowPending,
    following: isFollowing,
    canUnblock,
  });

  const contacts = useQuery({
    queryKey: ['company', id, 'contact'],
    queryFn: () => api.get<CompanyContactPoint[]>(`/companies/${id}/contact`),
    // Owner (catalog access) or Connected — matches contact API gate.
    enabled: Boolean(id) && (isConnected || isOwn || isHome),
  });
  const teamMembers = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<TeamMemberView[]>('/team/members'),
    enabled: isHome,
  });

  const designs = shopDesigns.data?.results ?? [];
  const collections = shopCollections.data?.results ?? [];
  const visibleDesigns = useMemo(
    () =>
      designs.filter((row) =>
        catalogSearchMatches(deferredListSearch, ...designFindParts(row)),
      ),
    [designs, deferredListSearch],
  );
  const visibleCollections = useMemo(
    () =>
      collections.filter((row) =>
        catalogSearchMatches(
          deferredListSearch,
          row.name,
          row.categories,
          row.memberFind,
        ),
      ),
    [collections, deferredListSearch],
  );
  const listSearchActive = Boolean(deferredListSearch.trim());
  const displayCollections = cataloguePreviewSlice(
    visibleCollections,
    HOME_CATALOGUE_COLLECTION_PREVIEW,
    previewCatalogue,
  );
  const displayDesigns = cataloguePreviewSlice(
    visibleDesigns,
    HOME_CATALOGUE_DESIGN_PREVIEW,
    previewCatalogue,
  );
  const designLayout: DesignBrowseLayout = previewCatalogue ? 'grid' : layout;
  const shopLoading = shopShelfLoading(
    shopTab,
    shopCollections.isLoading,
    shopDesigns.isLoading,
  );
  const visibleShopIds = designs.map((product) => product.id);
  const visibleAlbumIds = collections.map((collection) => collection.id);
  const gridDesignIds = visibleDesigns.map((product) => product.id);
  const gridAlbumIds = visibleCollections.map((collection) => collection.id);
  const shopEntries = shopShortlistEntries(shortlist.entries, id, visibleShopIds);
  const shopAlbums = shopAlbumEntries(albumPick.entries, id, visibleAlbumIds);
  const thisShopCount = shopEntries.length + shopAlbums.length;
  const tabSelectedCount = shopTabSelectedCount(
    shopTab,
    shopEntries.length,
    shopAlbums.length,
  );
  const shopDockUp =
    shelfInteractive &&
    shouldShowShopTradeDock({
      isOwn,
      shopSelectedCount: thisShopCount,
    });
  /**
   * Traveling shortlist/album selectMode stays on while any pile exists — including the
   * other shop tab. Chrome must not key off that, or Clear leaves a dead “0 selected”.
   * Armed empty = tapped Select with nothing on this tab yet.
   */
  const [shopArmedEmpty, setShopArmedEmpty] = useState(false);
  useEffect(() => {
    setShopArmedEmpty(false);
  }, [id]);
  useEffect(() => {
    if (tabSelectedCount > 0) setShopArmedEmpty(false);
  }, [tabSelectedCount]);
  const showSelectChrome = tabSelectedCount > 0 || shopArmedEmpty;
  const selecting = shortlist.selectMode || albumPick.selectMode || shopDockUp;
  const selectAllDesigns = selectAllState(gridDesignIds, shortlist.productIds);
  const selectAllAlbums = selectAllState(gridAlbumIds, albumPick.collectionIds);
  const selectAll = shopTab === 'designs' ? selectAllDesigns : selectAllAlbums;
  const canSelect =
    shelfInteractive &&
    ((shopTab === 'designs' && designs.length > 0) ||
      (shopTab === 'collections' && collections.length > 0));
  const tabHasItems = canSelect;
  const toggleLayout = () => {
    setLayout((prev) => {
      const next = prev === 'feed' ? 'grid' : 'feed';
      writeDesignBrowseLayout(myCompanyId, next);
      return next;
    });
  };
  const floaterClearance =
    !shopDockUp && shortlist.count + albumPick.count > 0;
  const showMessage = !isOwn;

  const clearThisShop = () => {
    shortlist.removeIds(shopEntries.map((entry) => entry.productId));
    albumPick.removeIds(shopAlbums.map((entry) => entry.collectionId));
  };

  /** Clear only the active tab — selected designs must not look like selected collections. */
  const clearActiveTab = () => {
    if (shopTab === 'designs') {
      shortlist.removeIds(shopEntries.map((entry) => entry.productId));
      return;
    }
    albumPick.removeIds(shopAlbums.map((entry) => entry.collectionId));
  };

  const enterSelectMode = () => {
    setShopArmedEmpty(true);
    shortlist.setSelectMode(true);
    albumPick.setSelectMode(true);
  };

  const selectAllOnActiveTab = () => {
    if (shopTab === 'designs') {
      shortlist.addMany(visibleDesigns.map((product) => toShopShortlistEntry(product, id)));
      return;
    }
    albumPick.addMany(visibleCollections.map((collection) => toShopAlbumEntry(collection, id)));
  };

  /** Clear this tab’s picks and leave Selecting chrome (dock may stay if the other tab has picks). */
  const clearActiveTabAndExitSelect = () => {
    clearActiveTab();
    setShopArmedEmpty(false);
    shortlist.setSelectMode(false);
    albumPick.setSelectMode(false);
  };

  const toggleDesign = (product: ExploreProductCard) => {
    shortlist.toggle(toShopShortlistEntry(product, id));
  };

  const toggleCollection = (collection: CollectionCard) => {
    albumPick.toggle(toShopAlbumEntry(collection, id));
  };

  const shelfReadyForSeed = shopCollections.isSuccess && shopDesigns.isSuccess;
  const tabQuery = searchParams.get('tab');
  const tabIntent = homeCatalogueTabFromSearch(tabQuery);
  useEffect(() => {
    shopTabUserPicked.current = false;
    shopTabSeededFor.current = null;
    setShopTab('collections');
  }, [id]);
  useEffect(() => {
    if (!shelfReadyForSeed) return;
    // Home + visitor catalogue: URL tab wins so See all → Back keeps Designs.
    if ((isHome || isCatalogue) && tabIntent) {
      setShopTab(tabIntent);
      shopTabUserPicked.current = true;
      shopTabSeededFor.current = id;
      return;
    }
    if (shopTabUserPicked.current) {
      shopTabSeededFor.current = id;
      return;
    }
    if (shopTabSeededFor.current === id) return;
    shopTabSeededFor.current = id;
    setShopTab(firstShopTabWithContent(collections.length, designs.length));
  }, [
    shelfReadyForSeed,
    id,
    collections.length,
    designs.length,
    isHome,
    isCatalogue,
    tabIntent,
  ]);

  const toggleFollow = useMutation({
    mutationFn: () =>
      isFollowing || isFollowPending
        ? api.del(`/follows/${id}`)
        : api.post('/follows', { companyId: id }),
    onSuccess: () => {
      invalidateFollowCatalog(queryClient);
    },
  });

  const openColdMessage = () => {
    if (!id) return;
    if (coldMessageAction({ existingThreadId: directThread?.id }) === 'open-existing') {
      navigate(`/chats/${directThread!.id}`);
      return;
    }
    setFirstMessageOpen(true);
  };

  const setThreadAlert = useMutation({
    mutationFn: (payload: { alertLevel: 'all' | 'muted'; muteFor?: MuteFor }) =>
      api.patch(`/threads/${directThread!.id}/alert`, {
        alertLevel: payload.alertLevel,
        ...(payload.muteFor ? { muteFor: payload.muteFor } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      setMoreOpen(false);
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not update mute.', 'danger'),
  });

  const blockShop = useMutation({
    mutationFn: async () => {
      await api.post(`/connections/company/${id}/block`, {});
    },
    onSuccess: () => {
      invalidateAfterBlock(queryClient);
      showToast('Blocked');
      navigate(-1);
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not block this shop.', 'danger'),
  });

  const unblockShop = useMutation({
    mutationFn: async () => {
      if (!connection?.id) throw new Error('No connection');
      return api.post<ConnectionView>(`/connections/${connection.id}/unblock`, {});
    },
    onSuccess: (data) => {
      invalidateAfterBlock(queryClient);
      showToast(data.canBlock ? UNBLOCK_ACCESS_CLEARED_TOAST : YOUR_BLOCK_REMOVED_TOAST);
      setMoreOpen(false);
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not unblock this shop.', 'danger'),
  });

  const placeShopOrder = useMutation({
    mutationFn: (input: {
      lines: Array<{ productId: string; quantity: number; note?: string }>;
      transporter?: string;
      note?: string;
      noteVoiceMediaId?: string;
      noteVoiceDurationMs?: number;
      noteImageUrls?: string[];
    }) =>
      api.post<CreateOrdersBatchResult>('/orders/batch', {
        kind: OrderKind.Standard,
        intent: OrderIntent.Order,
        ...(input.transporter?.trim() ? { transporter: input.transporter.trim() } : {}),
        ...placeNoteAttachFields(input),
        items: input.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
          ...(line.note?.trim() ? { note: line.note.trim() } : {}),
        })),
      }),
    onSuccess: (payload, input) => {
      setQtyOpen(false);
      setQtyEntries(null);
      setOrderError(null);
      const failedIds = new Set(payload.failures.flatMap((failure) => failure.productIds));
      shortlist.removeIds(input.lines.map((line) => line.productId).filter((pid) => !failedIds.has(pid)));
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      const title = batchConfirmTitle(payload);
      showToast(title, payload.orders.length === 0 ? 'danger' : 'success');
      const leave = batchSuccessLeave(payload);
      if (leave?.kind === 'order') {
        void navigateToOrderChat(navigate, queryClient, leave.order, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not place the order.'),
  });

  if (isCatalogue && myCompanyId && id === myCompanyId) {
    const moreTab =
      tabQuery === 'products'
        ? '/more?tab=products'
        : tabQuery === 'collections'
          ? '/more?tab=collections'
          : '/more';
    return <Navigate to={moreTab} replace />;
  }
  if (isShopFace && myCompanyId && id === myCompanyId) {
    return <Navigate to="/" replace />;
  }

  if (profile.isLoading) {
    return <LoadingBlock label="Loading business…" />;
  }
  if (profile.isError || !profile.data) {
    return (
      <>
        {!isHome ? <PageHeader title="Business" /> : null}
        <ErrorState message="This business isn't available." />
      </>
    );
  }

  const company = profile.data;
  const hasShop = designs.length > 0 || collections.length > 0;
  const shelfReady = shopCollections.isSuccess && shopDesigns.isSuccess;
  const showCatalogue =
    profileAccess && shelfReady && (hasShop || showOwnerCreate);

  if (isCatalogue && !profileAccess) {
    return (
      <>
        <PageHeader
          title={company.name}
          onBack={() => navigateBackOr(navigate, location.key, `/company/${id}`)}
        />
        <p className="px-1 py-8 text-center text-sm text-muted">This business is private.</p>
      </>
    );
  }
  const contact = pickPrimaryContact(contacts.data ?? []);
  const sellCats = shopSellCategories(company);
  const contactLabel =
    isConnected && !isOwn && contact
      ? `${contact.name}${contact.role ? ` ${contact.role}` : ''}`.trim()
      : null;
  const cityLabel = company.city?.trim() || null;
  const coverUrl = company.coverUrl ?? null;
  const showcaseUrls = company.showcaseUrls ?? [];
  const fullGalleryUrls = profileGalleryUrls(coverUrl, showcaseUrls);
  const showcaseGalleryUrls = showcaseOnlyUrls(showcaseUrls);
  const viewerUrls = galleryMode === 'showcase' ? showcaseGalleryUrls : fullGalleryUrls;
  const openFullGallery = (index: number) => {
    if (fullGalleryUrls.length < 1) return;
    setGalleryMode('full');
    setGalleryIndex(index);
    setGalleryOpen(true);
  };
  const openShowcaseBrowse = () => {
    // Owner may open empty browse to Add; visitors need ≥1 photo.
    if (!isHome && showcaseGalleryUrls.length < 1) return;
    setShowcaseBrowseOpen(true);
  };
  const openShowcasePhoto = (index: number) => {
    if (showcaseGalleryUrls.length < 1) return;
    // Close browse so PhotoViewer is not fighting the sheet under it.
    setShowcaseBrowseOpen(false);
    setGalleryMode('showcase');
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const completenessInput = {
    logoUrl: company.logoUrl,
    coverUrl: company.coverUrl,
    about: company.about,
    sellCategories: ownProfile.isSuccess
      ? (ownProfile.data.sellCategories ?? [])
      : undefined,
  };
  const completenessGaps = isHome ? profileCompletenessGaps(completenessInput) : [];
  const completenessFingerprint = profileCompletenessFingerprint(completenessGaps);
  const completenessDismissed =
    nudgeDismissTick >= 0 &&
    isProfileCompletenessDismissed(id, completenessFingerprint);
  const completenessChips =
    isHome && completenessGaps.length > 0 && !completenessDismissed
      ? profileCompletenessChips(completenessInput, 3)
      : [];

  const onCompletenessChip = (
    gap: 'logo' | 'cover' | 'about' | 'sellCategories',
  ) => {
    if (gap === 'logo') {
      document.querySelector<HTMLButtonElement>('[data-testid="business-profile-avatar-camera"]')?.click();
      return;
    }
    if (gap === 'cover') {
      const add = document.querySelector<HTMLButtonElement>(
        '[data-testid="business-profile-add-cover"]',
      );
      if (add) {
        add.click();
        return;
      }
      document
        .querySelector<HTMLButtonElement>('[data-testid="business-profile-cover-camera"]')
        ?.click();
      return;
    }
    if (gap === 'about') {
      navigate('/settings/profile?edit=1');
      return;
    }
    navigate('/settings/profile?edit=1&focus=sell');
  };

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        isHome && SELECTION_DOCK_CLEARANCE_CLASS,
        isCatalogue && (shopDockUp || floaterClearance) && SELECTION_DOCK_CLEARANCE_CLASS,
      )}
      data-testid={
        isHome
          ? 'business-profile-home'
          : isCatalogue
            ? 'business-profile-catalogue-page'
            : 'business-profile-shop'
      }
    >
      {isCatalogue ? (
        <PageHeader
          title={company.name}
          titleEnd={isGstVerified(company.verification) ? <GstTick /> : null}
          onBack={() => navigateBackOr(navigate, location.key, `/company/${id}`)}
          action={
            showCatalogue || hasShop || !shelfReady ? (
              <CatalogFindToggle
                testId="company-shop-search-toggle"
                open={searchOpen}
                label={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
                onToggle={() => {
                  if (searchOpen) {
                    setSearchOpen(false);
                    setListSearch('');
                    return;
                  }
                  setSearchOpen(true);
                }}
              />
            ) : null
          }
          below={
            searchOpen ? (
              <SearchInput
                data-testid="company-shop-search"
                aria-label={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
                placeholder={shopTab === 'collections' ? 'Find collections' : 'Find designs'}
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
                autoFocus
              />
            ) : null
          }
        />
      ) : null}

      {isShopFace ? (
        <PageHeader
          title={company.name}
          titleEnd={isGstVerified(company.verification) ? <GstTick /> : null}
          action={
            <div className="relative">
              <button
                type="button"
                data-testid="company-more"
                aria-label="More"
                aria-expanded={moreOpen}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-foam hover:text-ink"
                onClick={() => setMoreOpen((open) => !open)}
              >
                <MoreHorizontalIcon width={18} height={18} />
              </button>
              <CompanyOverflowMenu
                open={moreOpen}
                title={company.name}
                items={overflowItems}
                muted={directThread?.alertLevel === 'muted'}
                mutePending={setThreadAlert.isPending}
                onClose={() => setMoreOpen(false)}
                onShare={() => setShareOpen(true)}
                onMute={() => setThreadAlert.mutate({ alertLevel: 'all' })}
                onPickMute={(muteFor) =>
                  setThreadAlert.mutate({ alertLevel: 'muted', muteFor })
                }
                onBlock={() => {
                  if (
                    typeof window !== 'undefined' &&
                    !window.confirm(`Block ${company.name}? They won’t know.`)
                  ) {
                    return;
                  }
                  blockShop.mutate();
                }}
                onUnblock={() => unblockShop.mutate()}
                onRemove={() => toggleFollow.mutate()}
              />
            </div>
          }
        />
      ) : null}

      {!isCatalogue ? (
        profileAccess || isHome ? (
          <BusinessProfileHeroMedia
            companyId={id}
            name={company.name}
            logoUrl={company.logoUrl}
            coverUrl={profileAccess ? coverUrl : null}
            canEdit={isHome}
            onOpenCoverGallery={() => openFullGallery(0)}
            showcaseCount={showcaseGalleryUrls.length}
            onOpenShowcase={
              profileAccess || isHome ? openShowcaseBrowse : undefined
            }
            identity={
              <>
                {isHome ? (
                  <div
                    className="flex items-center justify-center gap-1.5"
                    data-testid="business-profile-name"
                  >
                    <p className="truncate text-name font-emphasis text-ink">{company.name}</p>
                    {isGstVerified(company.verification) ? <GstTick /> : null}
                  </div>
                ) : null}
                {!profileAccess ? (
                  <p className="mt-1 text-meta text-muted" data-testid="business-profile-private">
                    This business is private.
                  </p>
                ) : (
                  <>
                    {contactLabel || cityLabel ? (
                      <p className="mt-0.5 truncate text-meta text-muted" data-testid="shop-identity">
                        {contactLabel ? (
                          <span data-testid="company-contact">{contactLabel}</span>
                        ) : null}
                        {contactLabel && cityLabel ? ' · ' : null}
                        {cityLabel}
                      </p>
                    ) : null}
                    {sellCats.length > 0 ? (
                      <p
                        className="mx-auto mt-1 line-clamp-2 max-w-prose text-meta text-muted"
                        data-testid="shop-category-line"
                      >
                        {sellCats.map((category) => categoryDisplayLabel(category)).join(' · ')}
                      </p>
                    ) : null}
                    {company.about ? (
                      <div
                        className="mx-auto mt-1.5 max-w-prose"
                        data-testid="business-profile-about-block"
                      >
                        <p
                          className={cx(
                            'text-sm text-muted',
                            !aboutExpanded && company.about.length > 90 && 'line-clamp-2',
                          )}
                          data-testid="business-profile-about"
                        >
                          {company.about}
                        </p>
                        {company.about.length > 90 ? (
                          <button
                            type="button"
                            data-testid="business-profile-about-more"
                            className="mt-1 text-meta font-emphasis text-accent"
                            onClick={() => setAboutExpanded((open) => !open)}
                          >
                            {aboutExpanded ? 'View less' : 'View more'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </>
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar name={company.name} imageUrl={company.logoUrl} size={88} />
            <p className="text-meta text-muted" data-testid="business-profile-private">
              This business is private.
            </p>
          </div>
        )
      ) : null}

      {!isCatalogue ? (
      <div className="flex gap-1.5">
        {isHome ? (
          <>
            <button
              type="button"
              data-testid="company-edit"
              onClick={() => navigate('/settings/profile?edit=1')}
              className={cx(homeActionClass)}
            >
              <PencilIcon width={16} height={16} className="shrink-0 text-accent" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              data-testid="business-profile-share"
              onClick={() => setShareOpen(true)}
              className={cx(homeActionClass)}
            >
              <PaperPlaneIcon width={16} height={16} className="shrink-0 text-accent" aria-hidden />
              Share
            </button>
            <Link to="/network" data-testid="business-profile-network" className={cx(homeActionClass)}>
              <GroupIcon width={16} height={16} className="shrink-0 text-accent" aria-hidden />
              Network
            </Link>
            <Link to="/saved" data-testid="business-profile-saved" className={cx(homeActionClass)}>
              <BookmarkIcon width={16} height={16} className="shrink-0 text-accent" aria-hidden />
              Saved
            </Link>
          </>
        ) : (
          <>
            {!isOwn ? (
              <>
                <button
                  type="button"
                  data-testid="company-follow"
                  onClick={() => toggleFollow.mutate()}
                  disabled={toggleFollow.isPending}
                  className={cx(
                    // Separate base from filled state so bg-surface cannot beat bg-accent
                    // (Tailwind same-specificity order is stylesheet order, not className order).
                    isFollowing && !isFollowPending
                      ? homeActionOnClass
                      : homeActionClass,
                    'disabled:opacity-45',
                    isFollowPending && !(isFollowing && !isFollowPending)
                      ? 'border-accent/40'
                      : null,
                  )}
                >
                  {!toggleFollow.isPending && isFollowing && !isFollowPending ? (
                    <UnlockIcon width={16} height={16} className="shrink-0" aria-hidden />
                  ) : null}
                  {!toggleFollow.isPending && !(isFollowing && !isFollowPending) ? (
                    <LockIcon
                      width={16}
                      height={16}
                      className="shrink-0 text-accent"
                      aria-hidden
                    />
                  ) : null}
                  {toggleFollow.isPending
                    ? 'Updating…'
                    : seePacksShopLabel({ pending: isFollowPending, allowed: isFollowing })}
                </button>
                {showMessage ? (
                  <button
                    type="button"
                    data-testid="company-message"
                    onClick={openColdMessage}
                    className={cx(homeActionClass, 'disabled:opacity-45')}
                  >
                    <ChatIcon
                      width={16}
                      height={16}
                      className="shrink-0 text-accent"
                      aria-hidden
                    />
                    {shopWriteLabel(alreadyTalks)}
                  </button>
                ) : null}
                <button
                  type="button"
                  data-testid="business-profile-share"
                  onClick={() => setShareOpen(true)}
                  className={cx(homeActionClass)}
                >
                  <PaperPlaneIcon
                    width={16}
                    height={16}
                    className="shrink-0 text-accent"
                    aria-hidden
                  />
                  Share
                </button>
              </>
            ) : (
              <button
                type="button"
                data-testid="company-edit"
                onClick={() => navigate('/settings/profile?edit=1')}
                className={cx(shopActionClass, 'flex-none bg-foam text-ink')}
              >
                Edit profile
              </button>
            )}
          </>
        )}
      </div>
      ) : null}

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      {isHome && completenessChips.length > 0 ? (
        <ProfileCompletenessNudge
          chips={completenessChips}
          onChip={onCompletenessChip}
          onDismiss={() => {
            writeProfileCompletenessDismissed(id, completenessFingerprint);
            setNudgeDismissTick((n) => n + 1);
          }}
        />
      ) : null}

      {profileAccess && shelfEnabled && shopLoading ? (
        <LoadingBlock label="Loading shop…" />
      ) : null}

      {showCatalogue ? (
        <div
          className={cx(
            (shopDockUp || floaterClearance) && SELECTION_DOCK_CLEARANCE_CLASS,
          )}
        >
        <section
          className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface"
          data-testid="business-profile-catalogue"
        >
          <div className="flex flex-col gap-1.5 border-b border-line px-1">
            <div className="flex items-center justify-between gap-2">
              <div
                className="relative z-10 flex min-w-0 w-fit shrink-0 gap-4"
                role="tablist"
                aria-label="Catalogue"
              >
                {(
                  [
                    ['collections', 'Collections', CollectionIcon],
                    ['designs', 'Designs', ProductIcon],
                  ] as const
                ).map(([value, label, TabIcon]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={shopTab === value}
                    data-testid={`company-shop-tab-${value}`}
                    onClick={() => {
                      shopTabUserPicked.current = true;
                      setShopTab(value);
                      if (isHome) {
                        setSearchParams(
                          (prev) => {
                            const next = new URLSearchParams(prev);
                            next.set('tab', homeCatalogueSearchParam(value));
                            return next;
                          },
                          { replace: true },
                        );
                      }
                    }}
                    className={cx(
                      'relative isolate inline-flex h-12 shrink-0 items-center gap-1.5 px-0.5 text-name tracking-tight touch-manipulation',
                      underlineTabChrome(shopTab === value).buttonClass,
                    )}
                  >
                    <TabIcon width={16} height={16} className="shrink-0" aria-hidden />
                    {label}
                    <span
                      aria-hidden
                      className={cx(
                        UNDERLINE_TAB_BAR_BASE_CLASS,
                        underlineTabChrome(shopTab === value).barClass,
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {shopTab === 'designs' && tabHasItems && shelfInteractive ? (
                  <BrowseLayoutToggle
                    layout={layout}
                    onToggle={toggleLayout}
                    testId="company-shop-layout-toggle"
                  />
                ) : null}
                {canSelect && !showSelectChrome ? (
                  <SelectModeControls
                    selectTestId="company-shop-select"
                    selecting={false}
                    count={tabSelectedCount}
                    allSelected={selectAll.allSelected}
                    onEnterSelect={enterSelectMode}
                    onSelectAll={selectAllOnActiveTab}
                    onClear={clearActiveTabAndExitSelect}
                  />
                ) : null}
              </div>
            </div>
            {canSelect && showSelectChrome ? (
              <div
                className="flex min-w-0 justify-end overflow-x-auto scrollbar-gutter-stable"
                data-testid="company-shop-select-pill-row"
              >
                <SelectModeControls
                  selectTestId="company-shop-select"
                  activeLayout="pill"
                  selecting
                  count={tabSelectedCount}
                  allSelected={selectAll.allSelected}
                  onEnterSelect={enterSelectMode}
                  onSelectAll={selectAllOnActiveTab}
                  onClear={clearActiveTabAndExitSelect}
                />
              </div>
            ) : null}
          </div>
          {/* Preview faces hug content — no empty min-height reserve. */}
          <div>
          {shopTab === 'designs' ? (
            <>
              {showOwnerCreate ? (
                <div className="px-1" data-testid="business-profile-home-create">
                  <YouLibraryCreateRow
                    testId="home-new-design"
                    label="New design"
                    onClick={() => {
                      if (!canUploads) {
                        showToast(CREATE_FAB_EXPLAIN, 'danger');
                        return;
                      }
                      navigate('/catalog/products/new');
                    }}
                  />
                </div>
              ) : null}
              {displayDesigns.length > 0 ? (
              <div
                className={cx(
                  'px-3 py-3',
                  designLayout === 'feed' ? 'flex flex-col' : 'grid grid-cols-2 gap-3',
                )}
                data-testid="company-shop-grid"
                data-layout={designLayout}
              >
                {displayDesigns.map((product) => (
                  <SellerProductTile
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      images: product.images,
                      status: ProductStatus.Published,
                    }}
                    highlightQuery={deferredListSearch}
                    variant={designLayout}
                    selecting={selecting && shelfInteractive}
                    selected={shortlist.productIds.has(product.id)}
                    onToggle={() => {
                      if (shelfInteractive) toggleDesign(product);
                    }}
                    onLongSelect={() => {
                      if (shelfInteractive) toggleDesign(product);
                    }}
                    onOpenPublished={() => {
                      setSheetIndex(0);
                      setSheetProduct(product);
                    }}
                    testId={`company-shop-design-${product.id}`}
                  />
                ))}
              </div>
            ) : (
              <p
                className="px-3 py-2.5 text-sm text-muted"
                data-testid={showOwnerCreate && !listSearchActive ? 'business-profile-home-empty' : undefined}
              >
                {listSearchActive
                  ? 'No designs match.'
                  : showOwnerCreate
                    ? 'Nothing published yet'
                    : 'No published designs yet.'}
              </p>
            )}
            </>
          ) : (
            <>
              {showOwnerCreate ? (
                <div className="px-1" data-testid="business-profile-home-create">
                  <YouLibraryCreateRow
                    testId="home-new-collection"
                    label="New collection"
                    onClick={() => {
                      if (!canUploads) {
                        showToast(CREATE_FAB_EXPLAIN, 'danger');
                        return;
                      }
                      navigate('/catalog/collections/new');
                    }}
                  />
                </div>
              ) : null}
              {displayCollections.length > 0 ? (
            <div className="flex flex-col px-2 py-1" data-testid="company-shop-collections">
              {displayCollections.map((collection) => {
                const shelfMeta = shopCollectionShelfMeta({
                  isOwn,
                  collection,
                  libraryMemberShops: libraryMemberShopsById.get(collection.id),
                });
                return (
                <YouCollectionListRow
                  key={collection.id}
                  collection={toShopCollectionRow(collection, shelfMeta.memberShops)}
                  hideLibraryMeta={shelfMeta.hideLibraryMeta}
                  surface="shelf"
                  packManage={isOwn}
                  selecting={selecting && shelfInteractive}
                  selected={albumPick.collectionIds.has(collection.id)}
                  actionFocus={
                    rowMenu?.id === collection.id ||
                    (catalogShareOpen && rowShare?.id === collection.id)
                  }
                  swipeOpen={openSwipeId === collection.id}
                  onSwipeOpen={() => setOpenSwipeId(collection.id)}
                  onSwipeClose={() =>
                    setOpenSwipeId((current) => (current === collection.id ? null : current))
                  }
                  onToggle={() => {
                    if (shelfInteractive) toggleCollection(collection);
                  }}
                  onLongSelect={() => {
                    if (shelfInteractive) toggleCollection(collection);
                  }}
                  onMore={() => setRowMenu(collection)}
                  onShare={() => {
                    setRowShare(collection);
                    setCatalogShareOpen(true);
                  }}
                  highlightQuery={deferredListSearch}
                />
                );
              })}
            </div>
          ) : (
            <p
              className="px-3 py-2.5 text-sm text-muted"
              data-testid={showOwnerCreate && !listSearchActive ? 'business-profile-home-empty' : undefined}
            >
              {listSearchActive
                ? 'No collections match.'
                : showOwnerCreate
                  ? 'Nothing published yet'
                  : 'No published collections yet.'}
            </p>
          )}
            </>
          )}
          </div>
          {hasShop && isHome ? (
            <Link
              to={shopTab === 'designs' ? '/more?tab=products' : '/more?tab=collections'}
              data-testid="business-profile-view-more"
              className="border-t border-line px-3 py-2.5 text-center text-meta font-emphasis text-accent"
            >
              {seeAllCatalogueLabel(shopTab)}
            </Link>
          ) : null}
          {hasShop && isShopFace ? (
            <Link
              to={`/company/${id}/catalogue?tab=${
                shopTab === 'designs' ? 'products' : 'collections'
              }`}
              data-testid="business-profile-view-all"
              className="border-t border-line px-3 py-2.5 text-center text-meta font-emphasis text-accent"
            >
              {seeAllCatalogueLabel(shopTab)}
            </Link>
          ) : null}
        </section>
        </div>
      ) : null}

      {!isCatalogue && (profileAccess || isHome) ? (
        <BusinessInfoSection
          city={company.city}
          categories={
            company.masterCategories && company.masterCategories.length > 0
              ? company.masterCategories
              : (company.categories ?? [])
          }
          sellCategories={ownProfile.data?.sellCategories}
          buyCategories={ownProfile.data?.buyCategories}
          verification={company.verification}
          gstNumber={ownProfile.data?.gstNumber ?? null}
          isOwn={isHome || isOwn}
          contacts={contacts.data ?? []}
          showContacts={isConnected || isHome || isOwn}
          createdAt={company.createdAt ?? ownProfile.data?.createdAt}
          showTeamLink={isHome}
          teamMembers={teamMembers.data ?? null}
          canInviteTeam={canInviteTeam}
          workingHours={company.workingHours}
          shopAddress={company.shopAddress}
          websiteUrl={company.websiteUrl}
          heroCity={cityLabel}
          heroSellCategories={sellCats}
        />
      ) : null}

      {isCatalogue && shelfReady && !hasShop ? (
        <p className="px-1 py-8 text-center text-sm text-muted">No published collections or designs.</p>
      ) : null}

      {shopDockUp ? (
        <BottomTradeDock testId="company-shop-dock" aboveAppNav={false}>
          <div className="grid w-full grid-cols-3 gap-2" data-testid="company-shop-dock-actions">
            <DockIconButton
              testId="company-shop-message"
              label="Message"
              disabled={isOwn}
              onClick={() => setMessageOpen(true)}
            >
              <ChatIcon width={22} height={22} />
            </DockIconButton>
            <DockIconButton
              testId="company-shop-share"
              label="Share"
              onClick={() => setCatalogShareOpen(true)}
            >
              <PaperPlaneIcon width={22} height={22} />
            </DockIconButton>
            <DockIconButton
              testId="company-shop-order"
              label="Order"
              primary
              onClick={() => {
                setOrderError(null);
                void (async () => {
                  const prepared = await prepareCatalogOrder({
                    albums: shopAlbums,
                    shortlist: shopEntries,
                  });
                  if (prepared.kind === 'error') return;
                  const otherDesigns = shortlist.entries.filter((entry) => entry.companyId !== id);
                  const otherAlbums = albumPick.entries.filter((entry) => entry.companyId !== id);
                  writeBrowseShortlist([...otherDesigns, ...prepared.shortlist]);
                  writeBrowseAlbumPick([...otherAlbums, ...prepared.remainingAlbums]);
                  setLockedProductIds(prepared.lockedProductIds);
                  if (prepared.kind === 'navigate' && prepared.navigateToCollectionId) {
                    writeResumeAfterAlbumPick('order');
                    navigate(`/collections/${prepared.navigateToCollectionId}`, {
                      state: { enterSelect: true },
                    });
                    return;
                  }
                  if (prepared.shortlist.length < 1) return;
                  setQtyEntries(prepared.shortlist);
                  setQtyOpen(true);
                })();
              }}
            >
              <OrdersIcon width={22} height={22} />
            </DockIconButton>
          </div>
        </BottomTradeDock>
      ) : null}

      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => {
          setQtyOpen(false);
          setQtyEntries(null);
          setLockedProductIds([]);
        }}
        sellerId={orderGoesToSellerId(qtyEntries ?? shopEntries)}
        products={entriesAsProducts(qtyEntries ?? shopEntries)}
        lockedProductIds={lockedProductIds}
        submitting={placeShopOrder.isPending}
        error={orderError}
        orderGoesToName={packHandlerName(qtyEntries ?? shopEntries) ?? company.name}
        collectionId={collectionIdForPackOrder(qtyEntries ?? shopEntries)}
        sheetJob="order"
        onRemoveProduct={(productId) => {
          shortlist.removeIds([productId]);
          setQtyEntries((prev) =>
            prev ? prev.filter((entry) => entry.productId !== productId) : prev,
          );
        }}
        onSendOrder={(lines, place) => {
          setOrderError(null);
          placeShopOrder.mutate({
            lines,
            ...place,
          });
        }}
        onAskRates={() => undefined}
      />

      <SelectionMessageSheet
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        shopId={id}
        shopName={company.name}
        collections={shopAlbums.map((entry) => ({
          collectionId: entry.collectionId,
          name: entry.name,
          image: entry.coverImage,
        }))}
        products={shopEntries.map((entry) => ({
          productId: entry.productId,
          name: entry.name,
          image: entry.thumbUrl,
        }))}
      />

      <FirstMessageSheet
        open={firstMessageOpen}
        onClose={() => setFirstMessageOpen(false)}
        companyId={id}
        companyName={company.name}
      />

      {sheetProduct ? (
        <DesignSheet
          product={toDesignSheetProduct(sheetProduct)}
          index={sheetIndex}
          onIndex={setSheetIndex}
          onClose={() => setSheetProduct(null)}
          canEdit={isOwn}
          canDelete={false}
          onEdit={
            isOwn
              ? () => {
                  const designId = sheetProduct.id;
                  setSheetProduct(null);
                  navigate(`/catalog/products/${designId}`);
                }
              : undefined
          }
          testIdPrefix="company-shop-design-sheet"
        />
      ) : null}

      {isOwn && rowMenu ? (
        <OwnerCollectionMoreSheet
          open
          title={rowMenu.name}
          onClose={() => setRowMenu(null)}
          onShare={() => {
            setRowShare(rowMenu);
            setCatalogShareOpen(true);
          }}
          onBookmark={() => {
            if (rowMenu.id) rowSave.toggle();
          }}
          bookmarkSaved={rowSave.isSaved}
          bookmarkBusy={rowSave.isPending}
          onWhoHasAccess={() => {
            navigate(`/catalog/collections/${rowMenu.id}`, {
              state: {
                openPublish: true,
                returnTo: `/collections/${rowMenu.id}`,
                returnState: { packManage: true },
              },
            });
          }}
          onAddDesigns={() =>
            navigate(`/collections/${rowMenu.id}`, { state: { packManage: true } })
          }
          onAddPhotos={() =>
            navigate(`/collections/${rowMenu.id}`, { state: { packManage: true } })
          }
          onReplace={() =>
            navigate(`/collections/${rowMenu.id}`, { state: { packManage: true } })
          }
          onEditDetails={() => navigate(`/catalog/collections/${rowMenu.id}`)}
          canDraft={false}
          kind={rowMenu.kind}
        />
      ) : null}

      {!isOwn && rowMenu ? (
        <MoreActionsSheet
          open
          onClose={() => setRowMenu(null)}
          title={rowMenu.name}
          testId="visitor-collection-more-sheet"
          items={visitorCollectionMoreIds({
            tradeDockUp: shopDockUp,
          }).flatMap((action): MoreActionItem[] => {
            if (action === 'message') {
              return [
                {
                  id: 'message',
                  label: `Message ${company.name}`,
                  icon: <ChatIcon width={20} height={20} />,
                  testId: 'collection-menu-message',
                  onClick: () => {
                    setRowMenu(null);
                    openColdMessage();
                  },
                },
              ];
            }
            if (action === 'share') {
              return [
                {
                  id: 'share',
                  label: shareThisPackLabel(rowMenu.kind),
                  icon: <PaperPlaneIcon width={20} height={20} />,
                  testId: 'collection-menu-share',
                  onClick: () => {
                    setRowMenu(null);
                    setRowShare(rowMenu);
                    setCatalogShareOpen(true);
                  },
                },
              ];
            }
            return [
              {
                id: 'bookmark',
                label: rowSave.isSaved
                  ? 'Remove bookmark'
                  : bookmarkThisPackLabel(rowMenu.kind),
                icon: <BookmarkIcon width={20} height={20} />,
                testId: 'collection-menu-bookmark',
                disabled: rowSave.isPending,
                onClick: () => {
                  setRowMenu(null);
                  rowSave.toggle();
                },
              },
            ];
          })}
        />
      ) : null}

      <CatalogShareSheet
        open={catalogShareOpen}
        onClose={() => {
          setCatalogShareOpen(false);
          setRowShare(null);
        }}
        collections={
          rowShare
            ? [
                {
                  collectionId: rowShare.id,
                  name: rowShare.name,
                  image: rowShare.coverImage,
                },
              ]
            : shopAlbums.map((entry) => ({
                collectionId: entry.collectionId,
                name: entry.name,
                image: entry.coverImage,
              }))
        }
        products={
          rowShare
            ? []
            : shopEntries.map((entry) => ({
                productId: entry.productId,
                name: entry.name,
                image: entry.thumbUrl,
              }))
        }
        onShared={() => {
          if (!rowShare) clearThisShop();
          setRowShare(null);
          setCatalogShareOpen(false);
        }}
      />

      <CompanyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        companyId={id}
        companyName={company.name}
      />

      <ShowcaseBrowseSheet
        open={showcaseBrowseOpen}
        onClose={() => setShowcaseBrowseOpen(false)}
        urls={showcaseGalleryUrls}
        onOpenPhoto={openShowcasePhoto}
        companyId={id}
        canEdit={isHome}
      />

      <PhotoViewer
        open={galleryOpen}
        urls={viewerUrls}
        index={galleryIndex}
        onIndex={setGalleryIndex}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}

/** Compact shop actions — Instagram / WhatsApp density, not kit min-h-12. */
const shopActionClass =
  'inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg px-2.5 text-meta font-emphasis tracking-tight';

/** Home / visitor profile actions — equal white pills; charcoal icons. No foam wash (reads heavy). */
const homeActionClass =
  'inline-flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-surface px-1.5 py-1.5 text-meta font-emphasis tracking-tight text-ink';

/** Filled Follow (Following) — charcoal go; no bg-surface, avoids Tailwind bg-* collision. */
const homeActionOnClass =
  'inline-flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border border-accent bg-accent px-1.5 py-1.5 text-meta font-emphasis tracking-tight text-on-accent';

function pickPrimaryContact(contacts: CompanyContactPoint[]): CompanyContactPoint | null {
  if (contacts.length === 0) return null;
  const owner = contacts.find((point) => /owner/i.test(point.role ?? ''));
  return owner ?? contacts[0] ?? null;
}
