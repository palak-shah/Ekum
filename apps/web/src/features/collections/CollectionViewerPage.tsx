import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  ProductStatus,
  Unit,
  type CollectionDetailView,
  type CollectionPreviewView,
  type CollectionViewGrantView,
  type CollectionViewRequestView,
  type CreateProductDto,
  type OtherPackCountsView,
  type ProductView,
  type ThreadSummary,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatCatalogRate } from '@/lib/catalogRate';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { acquireMediaStream } from '@/lib/mediaSession';
import {
  designBrowsePhotoClass,
  readDesignBrowseLayout,
  writeDesignBrowseLayout,
  type DesignBrowseLayout,
} from '@/lib/designBrowseLayout';
import { useMyCompany } from '@/lib/queries';
import {
  BOTTOM_DOCK_CLEARANCE_CLASS,
  BottomTradeDock,
  SELECTION_DOCK_CLEARANCE_CLASS,
} from '@/features/browse/BottomTradeDock';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { BrowseLotChrome } from '@/features/browse/BrowseLotChrome';
import { selectAllState } from '@/features/browse/selectAllState';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { addStagingToCart } from '@/features/browse/addStagingToCart';
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
import {
  clearResumeAfterAlbumPick,
  continueAfterAlbumPickLabel,
  nextStepAfterAlbumPick,
  readResumeAfterAlbumPick,
  writeResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import { writeBrowseAlbumPick } from '@/features/browse/browseAlbumPick';
import { writeBrowseShortlist } from '@/features/browse/browseShortlist';
import {
  entriesAsProducts,
  sellerIdForEntries,
  useShortlistOrderFlow,
} from '@/features/browse/useShortlistOrderFlow';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import {
  isPublishedForSelection,
  selectionSkipToast,
  tradeableShortlistEntries,
  travelingSelectionToggleGate,
} from '@/features/browse/selectionEligibility';
import {
  rememberCatalogHandlerName,
  rememberForwardFacilitator,
  rememberOrderPath,
} from '@/features/browse/forwardAttribution';
import {
  SAVED_QUERY_KEY,
  toggleSavedDesigns,
  useSavedList,
  useSaveToggle,
} from '@/features/saved/useSaveToggle';
import { youSavedHref } from '@/features/saved/youSavedHref';
import { PageHeader } from '@/ui/PageHeader';
import {
  ownerAlbumDraftableProductIds,
  ownerAlbumPublishableProductIds,
  ownerCollectionSelectMoreIds,
  stampOwnerAddToPackDesigns,
} from '@/features/collections/ownerCollectionSelectMore';
import { OwnerPackLifecycleSheet } from '@/features/catalog/OwnerPackLifecycleSheet';
import {
  packDraftCopy,
  sharedDesignDraftCopy,
} from '@/features/catalog/ownerPackLifecycle';
import {
  addToPackActionLabel,
  addToPackCanOffer,
} from '@/features/catalog/libraryPickerSource';
import {
  savedProductIdSet,
  selectDesignBookmarkLabel,
  selectDesignsAllSaved,
} from '@/features/collections/selectDesignBookmark';
import {
  albumTileShopLine,
  packHeaderSubtitleWithShop,
  albumFactsRateBand,
} from './packHeaderSubtitle';
import { collectionOwnerSourceLine } from '@/features/catalog/collectionOwnerSourceLine';
import { exploreFeedSourceLine } from '@/features/explore/exploreFeedCaptionLines';
import { usePageOwnsBottomBand, usePageSelecting } from '@/features/browse/selectionBottomBand';
import {
  collectionMoreMenuNote,
  collectionOwnerManageDock,
  collectionOwnerCanEditDesign,
  collectionFactsLine,
  collectionShowHandleCopy,
  collectionThisPackSelectedIds,
  collectionViewerListedProducts,
  designTileMetaLine,
  designTileRateOverlay,
} from '@/features/collections/collectionViewerChrome';
import { CollectionPackDetails } from '@/features/collections/CollectionPackDetails';
import { howManySetsBanner } from '@/features/orders/howManyLineMeta';
import { FeedDesignPhotoCarousel } from '@/features/collections/FeedDesignPhotoCarousel';
import { DesignPhotoCarousel } from '@/ui/DesignPhotoCarousel';
import { collectionPageIsSelecting } from '@/features/collections/collectionPageSelect';
import { DesignSheet } from '@/features/browse/DesignSheet';
import { visitorCollectionMoreIds } from '@/features/collections/visitorCollectionMore';
import { OwnerPackManageDock } from '@/features/collections/OwnerPackManageDock';
import type { MoreActionItem } from '@/ui/MoreActionsSheet';
import { OwnerCollectionMoreSheet } from '@/features/collections/OwnerCollectionMoreSheet';
import { OwnerPackDeleteSheet } from '@/features/collections/OwnerPackDeleteSheet';
import { OwnerPackReplaceSheet } from '@/features/collections/OwnerPackReplaceSheet';
import {
  canDeleteSelected,
  deleteNeedsMultiPackConfirm,
  libraryDesignsForPicker,
  membershipAfterRemove,
  membershipForReplaceOrAppend,
  membershipWithNewFirst,
  ownedSelectedIds,
} from '@/features/collections/ownerPackManage';
import {
  libraryDesignsEligibleForPack,
  libraryPickerEmptyCopy,
  libraryPickerHint,
} from '@/features/catalog/libraryPickerSource';
import {
  isCatalogCollection,
  collectionShowsPackOrderChrome,
  deletedFromThisPackToast,
  removeFromThisPackLabel,
  removedFromPackToast,
} from '@/features/catalog/youLibraryKind';
import {
  allowedForThisPackOnly,
  askedToOpenThisPack,
  askToSeeThisPack,
  askToSeeThisPackBody,
  bookmarkThisPackLabel,
  findInThisPack,
  noDesignsInThisPack,
  removedAccessToThisPack,
  shareThisPackLabel,
} from '@/features/catalog/packKindCopy';
import {
  COLLECTION_QUICK_PHOTO_CAP,
  collectionCameraMaxShots,
  displayCollectionName,
} from '@/features/catalog/collectionCreateHelpers';
import { collectionGalleryInputProps } from '@/features/catalog/collectionGalleryInput';
import { createProductIdentity, uniqueDraftSku } from '@/features/catalog/designBatchHelpers';
import {
  packTagPatchesForOwnDesigns,
  packTagsForMember,
  productFieldsFromMember,
  storedCatalogRateUnit,
} from '@/features/catalog/collectionSameForAll';
import { LibraryPickTile } from '@/features/catalog/LibraryPickTile';
import { AddToPackSheet } from '@/features/catalog/AddToPackSheet';
import { invalidateAfterPackMembership } from '@/features/catalog/packMembershipInvalidate';
import {
  Button,
  Card,
  ErrorState,
  LoadingBlock,
  Sheet,
  StatusPill,
  TextInput,
  cx,
} from '@/ui/kit';
import { highlightSearchText } from '@/ui/highlightMatch';
import { DraftChip } from '@/ui/DraftChip';
import { ContinuousCamera, continuousCameraConstraints } from '@/ui/ContinuousCamera';
import { CappedMediaGrid } from '@/ui/CappedMediaGrid';
import {
  BookmarkIcon,
  ChatIcon,
  CollectionIcon,
  LockIcon,
  MegaphoneIcon,
  MoreHorizontalIcon,
  PaperPlaneIcon,
  TrashIcon,
} from '@/ui/icons';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { designMatchesFind } from '@/features/catalog/catalogSearch';
import { useToast } from '@/ui/Toast';

type Layout = DesignBrowseLayout;

function toShortlistEntry(
  product: ProductView,
  companyName: string,
  pack?: {
    collectionId: string;
    handlerName: string;
    path: string | null;
    allowForward: boolean;
  },
): BrowseShortlistEntry {
  const path = pack?.path === 'handle' || pack?.path === 'direct' ? pack.path : undefined;
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.companyId,
    companyName: product.companyName ?? companyName,
    allowForward: product.allowForward,
    categories: product.categories ?? [],
    unit: product.unit ?? null,
    dispatchUnit: product.dispatchUnit ?? null,
    piecesPerPack: product.piecesPerPack ?? null,
    moq: product.moq ?? null,
    rate: product.rate ?? null,
    rateMax: product.rateMax ?? null,
    status: product.status,
    ...(pack
      ? {
          sourceCollectionId: pack.collectionId,
          sourceHandlerName: pack.handlerName,
          sourcePath: path,
          sourcePackAllowForward: pack.allowForward !== false,
        }
      : {}),
  };
}

export function CollectionViewerPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useMyCompany();
  const myCompanyId = me.data?.id;
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const orderFlow = useShortlistOrderFlow();
  const [layout, setLayout] = useState<Layout>(() => readDesignBrowseLayout(myCompanyId));
  const [viewerProduct, setViewerProduct] = useState<ProductView | null>(null);
  const [addToPackDesigns, setAddToPackDesigns] = useState<ProductView[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  /** Album ⋯ vs Selecting dock — CatalogShareSheet payload. */
  const [shareScope, setShareScope] = useState<'album' | 'designs'>('album');
  const [moreOpen, setMoreOpen] = useState(false);
  const [pageSelecting, setPageSelecting] = useState(false);
  const [orderResolveOpen, setOrderResolveOpen] = useState(false);
  const [curateResolveOpen, setCurateResolveOpen] = useState(false);
  const [curateOpen, setCurateOpen] = useState(false);
  const [curateProductIds, setCurateProductIds] = useState<string[] | undefined>(undefined);
  const [curateDefaultName, setCurateDefaultName] = useState('');
  const [qtyEntries, setQtyEntries] = useState<BrowseShortlistEntry[] | null>(null);
  const [manageBusy, setManageBusy] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [replaceSheetOpen, setReplaceSheetOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [designSearch, setDesignSearch] = useState('');
  const [replacePending, setReplacePending] = useState(false);
  const replacePendingRef = useRef(false);
  const [replaceDraft, setReplaceDraft] = useState<Set<string> | null>(null);
  const [libraryPicks, setLibraryPicks] = useState<Set<string>>(() => new Set());
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSession, setCameraSession] = useState(0);
  const [quickUploading, setQuickUploading] = useState(false);
  const designFileRef = useRef<HTMLInputElement>(null);
  const deleteTargetRef = useRef<string[] | null>(null);
  const draftTargetRef = useRef<string[] | null>(null);
  const [packDraftOpen, setPackDraftOpen] = useState(false);
  const [alsoDraftDesigns, setAlsoDraftDesigns] = useState(false);
  const [designDraftConfirmOpen, setDesignDraftConfirmOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const deferredListSearch = useDeferredValue(listSearch);

  const locationState = location.state as {
    enterSelect?: boolean;
    packManage?: boolean;
  } | null;
  const enterSelect = Boolean(locationState?.enterSelect);
  /** You / ＋ / own shop — keep across enterSelect clear; Explore omits it. */
  const packManage = Boolean(locationState?.packManage);

  useEffect(() => {
    setLayout(readDesignBrowseLayout(myCompanyId));
  }, [myCompanyId]);

  useEffect(() => {
    if (!enterSelect) return;
    setPageSelecting(true);
    shortlist.setSelectMode(true);
    navigate(location.pathname + location.search, {
      replace: true,
      state: packManage ? { packManage: true } : {},
    });
  }, [enterSelect, packManage, shortlist, navigate, location.pathname, location.search]);

  const openCurateWithDesigns = (
    source: BrowseShortlistEntry[],
    expandedAlbumNames: string[] = [],
  ) => {
    if (source.length === 0) return;
    setCurateDefaultName(
      curateDefaultPackName({
        expandedAlbumNames,
        allowedDesignNames: source.map((row) => row.name),
      }),
    );
    setCurateProductIds(source.map((row) => row.productId));
    setCurateOpen(true);
  };

  const onContinueAfterAlbumPick = () => {
    const resume = readResumeAfterAlbumPick();
    const step = nextStepAfterAlbumPick({
      resume,
      remainingAlbumIds: albumPick.entries.map((entry) => entry.collectionId),
    });
    if (!step) return;
    if (step.kind === 'next-album') {
      albumPick.removeIds([step.collectionId]);
      navigate(`/collections/${step.collectionId}`, { state: { enterSelect: true } });
      return;
    }
    if (step.resume === 'cart-order' || step.resume === 'cart-curate') {
      addStagingToCart();
      clearResumeAfterAlbumPick();
      navigate('/selection', {
        state: step.resume === 'cart-curate' ? { openCurate: true } : { openOrder: true },
      });
      return;
    }
    clearResumeAfterAlbumPick();
    if (step.resume === 'curate') {
      const { allowed: packAlbums } = partitionRelistableAlbums(albumPick.entries);
      if (packAlbums.length > 0) setCurateResolveOpen(true);
      else if (shortlist.count > 0) openCurateWithDesigns(shortlist.entries, []);
      return;
    }
    orderFlow.setError(null);
    if (albumPick.count > 0) setOrderResolveOpen(true);
    else if (shortlist.count > 0) {
      const tradeable = tradeableShortlistEntries(shortlist.entries);
      const skipped = shortlist.entries.length - tradeable.length;
      const notice = selectionSkipToast(skipped, tradeable.length);
      if (notice) showToast(notice);
      if (tradeable.length < 1) return;
      setQtyEntries(tradeable);
      orderFlow.setQtyOpen(true);
    }
  };

  const collection = useQuery({
    queryKey: ['collection-preview', id],
    queryFn: () => api.get<CollectionPreviewView>(`/explore/collections/${id}`),
  });
  const myProducts = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: libraryOpen,
  });
  const saveCollection = useSaveToggle({ collectionId: id });
  const savedList = useSavedList();
  const bookmarkDesigns = useMutation({
    mutationFn: (productIds: string[]) => toggleSavedDesigns(productIds, savedList.data),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
      if (result === 'removed') {
        showToast('Removed bookmark');
        return;
      }
      showToast('Bookmarked', 'success', {
        action: { label: 'Open', to: youSavedHref() },
      });
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not update bookmark.', 'danger'),
  });
  const outgoingAsks = useQuery({
    queryKey: ['collection-view-requests', 'outgoing'],
    queryFn: () =>
      api.get<CollectionViewRequestView[]>('/collection-view-requests/outgoing'),
  });

  const companyId = collection.data?.company.id ?? '';
  const isOwner = Boolean(me.data?.id && companyId && me.data.id === companyId);
  const products = collectionViewerListedProducts(collection.data?.products ?? [], {
    kind: collection.data?.kind,
    isOwner,
  });
  const visibleProducts = useMemo(
    () => products.filter((product) => designMatchesFind(deferredListSearch, product)),
    [products, deferredListSearch],
  );
  const listSearchActive = Boolean(deferredListSearch.trim());
  const selectMode = collectionPageIsSelecting({ enterSelect, pageSelecting });
  const resumeAfterPick = readResumeAfterAlbumPick();
  const showResumeContinue = Boolean(resumeAfterPick && selectMode);
  const thisPackSelectedIds = useMemo(
    () =>
      collectionThisPackSelectedIds(
        products.map((product) => product.id),
        shortlist.productIds,
      ),
    [products, shortlist.productIds],
  );
  const thisPackSelectedCount = thisPackSelectedIds.length;
  const selectedDesignsAllSaved = selectDesignsAllSaved(
    thisPackSelectedIds,
    savedProductIdSet(savedList.data),
  );
  const selectedDesignBookmarkLabel = selectDesignBookmarkLabel({
    count: thisPackSelectedCount,
    allSaved: selectedDesignsAllSaved,
  });
  const onBookmarkSelectedDesigns = () => {
    if (thisPackSelectedIds.length < 1) return;
    bookmarkDesigns.mutate(thisPackSelectedIds);
  };
  /** Keep tools + workspace bar up whenever this album has picks (no stranded Order). */
  useEffect(() => {
    if (thisPackSelectedCount < 1) return;
    setPageSelecting(true);
    shortlist.setSelectMode(true);
  }, [thisPackSelectedCount, shortlist]);
  const ownerManageDock = collectionOwnerManageDock({
    isOwner,
    packManage,
    selecting: selectMode,
    thisPackSelectedCount,
    isGeneral: collection.data?.kind === 'general',
  });
  usePageOwnsBottomBand(ownerManageDock);
  usePageSelecting(selectMode || thisPackSelectedCount > 0);
  const viewGrants = useQuery({
    queryKey: ['collection-view-grants', id],
    queryFn: () => api.get<CollectionViewGrantView[]>(`/collections/${id}/view-grants`),
    enabled: Boolean(id) && isOwner,
  });
  const isCuratedPack = useMemo(() => {
    const ownerId = collection.data?.company.id;
    if (!ownerId || products.length === 0) return false;
    return products.some((product) => product.companyId !== ownerId);
  }, [collection.data?.company.id, products]);
  /** Tile shop line only when mills differ — single-shop packs already name the shop in the header. */
  const creditTileMills = isCuratedPack && (isOwner || Boolean(collection.data?.showSourceShops));
  /** Place still from-pack with the pack owner. Copy follows Your paths ticket. */
  const handlePack = isCuratedPack;
  const viewerTicket = collection.data?.viewerTicket ?? null;
  const showHandleCopy = collectionShowHandleCopy({
    curatedVisitor: isCuratedPack && !isOwner,
    viewerTicket,
  });
  const packPath = viewerTicket === 'mill' ? ('direct' as const) : handlePack ? ('handle' as const) : null;
  const packStamp =
    id && collection.data
      ? {
          collectionId: id,
          handlerName: collection.data.company.name,
          path: packPath,
          allowForward: collection.data.allowForward !== false,
        }
      : undefined;

  useEffect(() => {
    if (!id || !collection.data || !handlePack) return;
    rememberOrderPath('collection', id, packPath === 'direct' ? 'direct' : 'handle');
    rememberCatalogHandlerName('collection', id, collection.data.company.name);
    rememberForwardFacilitator('collection', id, collection.data.company.id);
  }, [id, collection.data, handlePack, packPath]);
  const canSelectDesigns = products.length > 0;
  const companyName = collection.data?.company.name ?? '';

  const ownerSourceLine = useMemo(() => {
    if (!collection.data) return null;
    if (isOwner) {
      const shops = products.map((product) => ({
        id: product.companyId,
        name: product.companyName?.trim() || 'a shop',
      }));
      return collectionOwnerSourceLine(collection.data.company.id, shops);
    }
    if (!collection.data.showSourceShops) return null;
    return exploreFeedSourceLine(collection.data.sourceShopNames);
  }, [isOwner, collection.data, products]);

  const visibleDesignIds = visibleProducts.map((product) => product.id);
  const productCompanyById = useMemo(
    () => new Map(products.map((product) => [product.id, product.companyId])),
    [products],
  );
  const thisAlbumCount = thisPackSelectedCount;
  const selectAll = selectAllState(visibleDesignIds, shortlist.productIds);
  const ownerCanDelete = canDeleteSelected(thisPackSelectedIds);
  const ownerCanRemove = thisPackSelectedIds.length > 0;
  const shareDesignItems = useMemo(() => {
    if (shareScope !== 'designs') return [];
    const selected = new Set(thisPackSelectedIds);
    return visibleProducts
      .filter((product) => selected.has(product.id))
      .map((product) => ({
        productId: product.id,
        name: product.name,
        image: product.images?.[0] ?? null,
      }));
  }, [shareScope, thisPackSelectedIds, visibleProducts]);
  const floatSelectedCount = thisAlbumCount;

  const onSelectAllVisible = () => {
    const eligible = isOwner
      ? visibleProducts.filter((product) => product.status !== ProductStatus.Archived)
      : visibleProducts.filter((product) => isPublishedForSelection(product.status));
    const skipped = visibleProducts.length - eligible.length;
    const notice = isOwner ? null : selectionSkipToast(skipped, eligible.length);
    if (notice) showToast(notice);
    if (eligible.length < 1) return;
    setPageSelecting(true);
    shortlist.addMany(
      eligible.map((product) =>
        toShortlistEntry(product, product.companyName ?? companyName, packStamp),
      ),
    );
  };
  const onClearVisible = () => {
    shortlist.removeIds(visibleDesignIds);
    setPageSelecting(false);
    shortlist.setSelectMode(false);
  };

  const onEnterSelect = () => {
    setPageSelecting(true);
    shortlist.setSelectMode(true);
  };

  const persistOwnerMembers = async (productIds: string[]) => {
    await api.put(`/collections/${id}/products`, { productIds });
    try {
      const byId = new Map<string, ProductView>();
      for (const product of collection.data?.products ?? []) byId.set(product.id, product);
      for (const product of myProducts.data ?? []) byId.set(product.id, product);
      const listed = productIds
        .map((productId) => byId.get(productId))
        .filter((product): product is ProductView => Boolean(product));
      for (const row of packTagPatchesForOwnDesigns(
        listed,
        collection.data?.categories ?? [],
        myCompanyId,
      )) {
        await api.patch(`/products/${row.id}`, { categories: row.categories });
      }
    } finally {
      await invalidateAfterPackMembership(queryClient);
    }
  };

  const ownerMemberIds = async () => {
    if (!id) return products.map((product) => product.id);
    const detail = await api.get<CollectionDetailView>(`/collections/${id}`);
    return detail.products.map((product) => product.id);
  };

  const clearOwnerManageSelect = () => {
    shortlist.removeIds(thisPackSelectedIds);
    setPageSelecting(false);
    shortlist.setSelectMode(false);
  };

  const setReplacePendingFlag = (next: boolean) => {
    replacePendingRef.current = next;
    setReplacePending(next);
  };

  const abandonReplaceIfPending = () => {
    setReplacePendingFlag(false);
    setReplaceDraft(null);
  };

  const memberIds = useMemo(() => products.map((product) => product.id), [products]);
  const memberIdSet = useMemo(() => new Set(memberIds), [memberIds]);

  const selectableDesigns = useMemo(
    () => (myProducts.data ?? []).filter((product) => product.status !== ProductStatus.Archived),
    [myProducts.data],
  );
  const libraryPickerMode = replaceDraft !== null ? 'replace' : 'add';
  const packKind = isCatalogCollection(collection.data?.kind) ? 'catalog' : 'regular';
  const pickerDesigns = useMemo(
    () =>
      libraryDesignsForPicker(
        libraryDesignsEligibleForPack(selectableDesigns, packKind),
        memberIdSet,
        libraryPickerMode,
      ),
    [selectableDesigns, memberIdSet, libraryPickerMode, packKind],
  );
  const designQuery = designSearch.trim().toLowerCase();
  const filteredDesigns = designQuery
    ? pickerDesigns.filter((product) => product.name.toLowerCase().includes(designQuery))
    : pickerDesigns;

  const clickCollectionGallery = () => {
    designFileRef.current?.click();
  };

  const openCollectionGalleryDeferred = () => {
    queueMicrotask(() => clickCollectionGallery());
  };

  const openOwnerLibrary = () => {
    if (replacePendingRef.current) {
      setReplaceDraft(new Set());
    } else {
      setLibraryPicks(new Set());
      setReplaceDraft(null);
    }
    setDesignSearch('');
    setLibraryOpen(true);
  };

  const openOwnerPhotos = () => {
    if (isPhoneLike()) {
      void (async () => {
        const acquired = await acquireMediaStream('camera', continuousCameraConstraints);
        if (!acquired.ok) {
          showToast(acquired.message, 'danger');
          openCollectionGalleryDeferred();
          return;
        }
        setCameraSession((n) => n + 1);
        setCameraOpen(true);
      })();
      return;
    }
    clickCollectionGallery();
  };

  const onOwnerAddDesigns = () => {
    openOwnerLibrary();
  };

  const onOwnerAddPhotos = () => {
    openOwnerPhotos();
  };

  const beginOwnerReplaceFromDesigns = () => {
    setReplaceSheetOpen(false);
    setReplacePendingFlag(true);
    openOwnerLibrary();
  };

  const beginOwnerReplaceFromPhotos = () => {
    setReplaceSheetOpen(false);
    setReplacePendingFlag(true);
    setReplaceDraft(null);
    openOwnerPhotos();
  };

  const commitOwnerMembership = async (pickedIds: string[], replacing: boolean) => {
    if (!id) return;
    const nextIds = membershipForReplaceOrAppend(memberIds, pickedIds, replacing);
    if (nextIds === null) {
      abandonReplaceIfPending();
      return;
    }
    setManageBusy(true);
    try {
      await persistOwnerMembers(nextIds);
      if (replacing) setReplacePendingFlag(false);
      if (collection.data?.status === CollectionStatus.Published) {
        showToast(replacing ? 'Replaced' : 'Published');
      } else {
        showToast(replacing ? 'Replaced' : 'Added');
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not update designs.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const finishOwnerLibrary = async () => {
    setLibraryOpen(false);
    setDesignSearch('');
    if (replaceDraft !== null) {
      const ids = [...replaceDraft];
      setReplaceDraft(null);
      if (ids.length === 0) {
        abandonReplaceIfPending();
        return;
      }
      await commitOwnerMembership(ids, true);
      return;
    }
    const added = [...libraryPicks].filter((productId) => !memberIdSet.has(productId));
    setLibraryPicks(new Set());
    if (added.length === 0) return;
    const next = membershipWithNewFirst(memberIds, added);
    setManageBusy(true);
    try {
      await persistOwnerMembers(next);
      showToast(
        collection.data?.status === CollectionStatus.Published ? 'Published' : 'Added',
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not update designs.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const toggleOwnerLibraryPick = (productId: string) => {
    if (replaceDraft !== null) {
      setReplaceDraft((prev) => {
        const next = new Set(prev ?? []);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      return;
    }
    if (memberIdSet.has(productId)) return;
    setLibraryPicks((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const onOwnerPhotoFiles = async (files: File[]) => {
    if (!id || !files.length) return;
    const replacing = replacePendingRef.current;
    const picked = files.slice(0, COLLECTION_QUICK_PHOTO_CAP);
    setQuickUploading(true);
    setManageBusy(true);
    try {
      const createdIds: string[] = [];
      const seed = products[0];
      const takenSkus: string[] = [];
      for (const file of picked) {
        const imageUrl = await uploadImage(file);
        const identity = createProductIdentity(uniqueDraftSku(takenSkus));
        takenSkus.push(identity.sku);
        const categories = packTagsForMember([], collection.data?.categories);
        const parsed = productFieldsFromMember({
          name: identity.name,
          rate:
            seed?.rate != null
              ? seed.rateMax != null && seed.rateMax !== seed.rate
                ? `${seed.rate}-${seed.rateMax}`
                : String(seed.rate)
              : '',
          unit: seed?.unit || Unit.Set,
          dispatchUnit: seed?.dispatchUnit || Unit.Piece,
          catalogRateUnit: storedCatalogRateUnit({
            unit: seed?.unit ?? collection.data?.unit,
            dispatchUnit: seed?.dispatchUnit ?? collection.data?.dispatchUnit,
            catalogRateUnit:
              collection.data?.catalogRateUnit ?? seed?.catalogRateUnit,
          }),
          piecesPerPack: seed?.piecesPerPack != null ? String(seed.piecesPerPack) : '',
          moq: seed?.moq != null ? String(seed.moq) : '',
          notes: '',
          categories,
        });
        const dto: CreateProductDto = {
          name: identity.name,
          sku: identity.sku,
          images: [imageUrl],
          categories,
          description: parsed.description,
          rate: parsed.rate ?? undefined,
          rateMax: parsed.rateMax ?? undefined,
          unit: parsed.unit as CreateProductDto['unit'],
          dispatchUnit: parsed.dispatchUnit as CreateProductDto['dispatchUnit'],
          catalogRateUnit: parsed.catalogRateUnit as CreateProductDto['catalogRateUnit'],
          piecesPerPack: parsed.piecesPerPack,
          moq: parsed.moq ?? undefined,
        };
        const product = await api.post<ProductView>('/products', dto);
        createdIds.push(product.id);
      }
      await commitOwnerMembership(createdIds, replacing);
    } catch (err) {
      if (replacing) abandonReplaceIfPending();
      showToast(err instanceof ApiError ? err.message : 'Could not add photos.', 'danger');
    } finally {
      setQuickUploading(false);
      setManageBusy(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  const onOwnerRemove = async (productIds: string[] = thisPackSelectedIds) => {
    if (productIds.length < 1 || !id) return;
    setManageBusy(true);
    try {
      const next = membershipAfterRemove(await ownerMemberIds(), productIds);
      await persistOwnerMembers(next);
      clearOwnerManageSelect();
      setViewerProduct(null);
      showToast(removedFromPackToast(collection.data?.kind));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not remove.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const deleteOwnedProducts = async (ownedIds: string[]) => {
    for (const productId of ownedIds) {
      await api.del(`/products/${productId}`);
    }
  };

  const finishOwnerDelete = async (
    mode: 'everywhere' | 'only-here',
    productIds?: string[],
  ) => {
    const ids = productIds ?? deleteTargetRef.current ?? thisPackSelectedIds;
    const myId = me.data?.id ?? '';
    const owned = ownedSelectedIds(ids, productCompanyById, myId);
    setManageBusy(true);
    try {
      if (mode === 'everywhere' && owned.length > 0) {
        await deleteOwnedProducts(owned);
      }
      const next = membershipAfterRemove(await ownerMemberIds(), ids);
      await persistOwnerMembers(next);
      setDeleteSheetOpen(false);
      deleteTargetRef.current = null;
      clearOwnerManageSelect();
      setViewerProduct(null);
      showToast(
        mode === 'everywhere' && owned.length > 0
          ? 'Deleted'
          : mode === 'everywhere'
            ? deletedFromThisPackToast(collection.data?.kind)
            : removedFromPackToast(collection.data?.kind),
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not delete.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const onOwnerDelete = async (productIds: string[] = thisPackSelectedIds) => {
    if (productIds.length < 1 || !id) return;
    deleteTargetRef.current = productIds;
    const myId = me.data?.id ?? '';
    const owned = ownedSelectedIds(productIds, productCompanyById, myId);
    if (owned.length === 0) {
      await finishOwnerDelete('everywhere', productIds);
      return;
    }
    setManageBusy(true);
    try {
      const result = await api.post<OtherPackCountsView>(`/collections/${id}/other-pack-counts`, {
        productIds: owned,
      });
      if (deleteNeedsMultiPackConfirm(owned, result.counts, new Set(owned))) {
        setDeleteSheetOpen(true);
        setManageBusy(false);
        return;
      }
    } catch (err) {
      setManageBusy(false);
      showToast(err instanceof ApiError ? err.message : 'Could not delete.', 'danger');
      return;
    }
    await finishOwnerDelete('everywhere', productIds);
  };

  const finishOwnerDraftDesigns = async (productIds: string[]) => {
    setManageBusy(true);
    try {
      const results = await Promise.allSettled(
        productIds.map((productId) => api.post(`/products/${productId}/unpublish`)),
      );
      const ok = results.filter((row) => row.status === 'fulfilled').length;
      const failed = results.filter((row) => row.status === 'rejected').length;
      await invalidateAfterPackMembership(queryClient);
      showToast(
        failed === 0 ? `Draft ${ok}` : `Draft ${ok}, ${failed} failed`,
        failed === 0 ? undefined : 'danger',
      );
      clearOwnerManageSelect();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not draft.', 'danger');
    } finally {
      setManageBusy(false);
      setDesignDraftConfirmOpen(false);
      draftTargetRef.current = null;
    }
  };

  const onOwnerPublishDesigns = async () => {
    const ids = ownerAlbumPublishableProductIds(
      products,
      thisPackSelectedIds,
      me.data?.id ?? '',
    );
    if (ids.length < 1) {
      showToast('Pick a draft design of yours.');
      return;
    }
    setManageBusy(true);
    try {
      const result = await api.post<{ published: number }>(
        `/collections/${id}/publish-members`,
        { productIds: ids },
      );
      await invalidateAfterPackMembership(queryClient);
      showToast(`Published ${result.published}`);
      clearOwnerManageSelect();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not publish.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const onOwnerDraftDesigns = async () => {
    const ids = ownerAlbumDraftableProductIds(
      products,
      thisPackSelectedIds,
      me.data?.id ?? '',
    );
    if (ids.length < 1) {
      showToast('Pick a published design of yours.');
      return;
    }
    draftTargetRef.current = ids;
    if (!id) {
      await finishOwnerDraftDesigns(ids);
      return;
    }
    setManageBusy(true);
    try {
      const result = await api.post<OtherPackCountsView>(`/collections/${id}/other-pack-counts`, {
        productIds: ids,
      });
      if (deleteNeedsMultiPackConfirm(ids, result.counts, new Set(ids))) {
        setDesignDraftConfirmOpen(true);
        setManageBusy(false);
        return;
      }
    } catch {
      /* sole-pack still drafts */
    }
    setManageBusy(false);
    await finishOwnerDraftDesigns(ids);
  };

  const draftPack = useMutation({
    mutationFn: (alsoDraft: boolean) =>
      api.post(`/collections/${id}/unpublish`, { alsoDraftDesigns: alsoDraft }),
    onSuccess: async () => {
      setPackDraftOpen(false);
      setAlsoDraftDesigns(false);
      await invalidateAfterPackMembership(queryClient);
      showToast('Draft');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not draft.', 'danger');
    },
  });

  const accessPending =
    Boolean(id) &&
    (outgoingAsks.data?.some(
      (item) => item.collectionId === id && item.status === 'pending',
    ) ??
      false);

  const askToSee = useMutation({
    mutationFn: () =>
      api.post<CollectionViewRequestView>('/collection-view-requests', {
        collectionId: id,
      }),
    onSuccess: (row) => {
      setActionError(null);
      setSuccessNote('Ask sent — they decide in chat.');
      void queryClient.invalidateQueries({ queryKey: ['collection-view-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (row.threadId) navigate(`/chats/${row.threadId}`);
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not send ask.'),
  });

  const revokeGrant = useMutation({
    mutationFn: (granteeId: string) =>
      api.del(`/collections/${id}/view-grants/${granteeId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collection-view-grants', id] });
      showToast(removedAccessToThisPack(collection.data?.kind));
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not remove.', 'danger'),
  });

  const startChat = useMutation({
    mutationFn: () => api.post<ThreadSummary>('/threads/direct', { companyId }),
    onSuccess: (thread) => navigate(`/chats/${thread.id}`),
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not open chat.'),
  });

  const toggleProduct = (product: ProductView) => {
    const gate = travelingSelectionToggleGate({
      status: product.status,
      alreadySelected: shortlist.productIds.has(product.id),
      ownerAlbum: isOwner,
    });
    if (!gate.allow) {
      if (gate.toast) showToast(gate.toast);
      return;
    }
    shortlist.toggle(toShortlistEntry(product, product.companyName ?? companyName, packStamp));
  };

  const designIsSelected = (productId: string) => shortlist.productIds.has(productId);

  const openViewer = (product: ProductView, index = 0) => {
    setViewerProduct(product);
    setViewerIndex(index);
  };

  const onDesignActivate = (product: ProductView, photoIndex = 0) => {
    if (selectMode) {
      toggleProduct(product);
      return;
    }
    openViewer(product, photoIndex);
  };

  const onDesignLongSelect = (product: ProductView) => {
    setPageSelecting(true);
    toggleProduct(product);
  };

  if (collection.isLoading) {
    return <LoadingBlock label="Loading collection…" />;
  }
  if (collection.isError || !collection.data) {
    return (
      <>
        <PageHeader title="Collection" />
        <ErrorState message="This collection isn't available." />
      </>
    );
  }

  const openAlbumShare = () => {
    setShareScope('album');
    setShareOpen(true);
  };

  const openOwnerWhoHasAccess = () => {
    if (!id) return;
    navigate(`/catalog/collections/${id}`, {
      state: {
        openPublish: true,
        /** Close Visibility sheet → back to this album (not stuck on Edit). */
        returnTo: `/collections/${id}`,
        returnState: packManage ? { packManage: true } : {},
      },
    });
  };

  const openOwnerEditDetails = () => {
    if (!id) return;
    navigate(`/catalog/collections/${id}`);
  };

  const data = collection.data;
  const isGeneralAlbum = data.kind === 'general';
  const isCatalogAlbum = isCatalogCollection(data.kind);
  const addToPackSurface = isGeneralAlbum ? 'library' : 'album';
  const selectedProducts = products.filter((product) => thisPackSelectedIds.includes(product.id));
  const openAddToPack = (designs: ProductView[]) => {
    setAddToPackDesigns(stampOwnerAddToPackDesigns(designs, id, isGeneralAlbum));
  };
  const floaterClearance = selectMode || showResumeContinue;
  // API: collection details rate when set, else design min–max; null for non-owners when on request.
  const rateBand = albumFactsRateBand({
    rateMin: data?.rateMin,
    rateMax: data?.rateMax,
    rateUnit: data?.rateUnit,
  });
  const packFacts = collectionFactsLine(data?.categories, rateBand);
  const journeyLine = collectionShowsPackOrderChrome(data.kind)
    ? howManySetsBanner(
        products.map((product) => ({
          unit: product.unit,
          dispatchUnit: product.dispatchUnit,
        })),
      )
    : null;
  const showPackDetails = Boolean(packFacts || journeyLine || data?.description?.trim());
  const moreMenuNote = collectionMoreMenuNote({
    visitor: !isOwner,
    // Grant / follow look-through without Connect — not gated Ask (no products).
    lookOnly: Boolean(data?.products && !data.connected),
    allowForward: data?.allowForward !== false,
    kind: data.kind,
  });
  const headerSubtitle = data
    ? isOwner
      ? packHeaderSubtitleWithShop(products.length, products, null)
      : packHeaderSubtitleWithShop(products.length, products, data.company.name, {
          showCount: false,
        }) || undefined
    : undefined;

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        // Nav is hidden whenever a dock/floater owns the band — do not add a phantom nav pad.
        floaterClearance &&
          (showResumeContinue
            ? BOTTOM_DOCK_CLEARANCE_CLASS
            : SELECTION_DOCK_CLEARANCE_CLASS),
        ownerManageDock && BOTTOM_DOCK_CLEARANCE_CLASS,
      )}
    >
      {/*
        PageHeader must be a direct sticky child of this full-height column. Nesting it
        with facts/tools made sticky end when that short block scrolled away — then
        SelectAllFloat stuck at top-[3.25rem] with feed cards peeking above (BM-07).
      */}
      <PageHeader
        className="mb-0"
        title={displayCollectionName(data.name)}
        subtitle={headerSubtitle}
        titleTo={isOwner ? undefined : `/company/${data.company.id}`}
        action={
          <button
            type="button"
            aria-label="More"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            data-testid="collection-more"
            onClick={() => setMoreOpen((open) => !open)}
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              moreOpen ? 'bg-foam text-ink' : 'text-muted hover:bg-foam hover:text-ink',
            )}
          >
            <MoreHorizontalIcon width={18} height={18} />
          </button>
        }
      />

      <div className="flex flex-col gap-1.5">
        {showPackDetails ||
        ownerSourceLine ||
        (data.products && showHandleCopy) ? (
          <div className="flex flex-col gap-1">
            {showPackDetails ? (
              <CollectionPackDetails
                categories={data.categories}
                description={data.description}
                rateBand={rateBand}
                journeyLine={journeyLine}
              />
            ) : null}
            {ownerSourceLine ? (
              <p
                className="px-0.5 text-sm font-emphasis tracking-tight text-ink"
                data-testid="collection-owner-source"
              >
                {ownerSourceLine}
              </p>
            ) : null}
            {data.products && showHandleCopy ? (
              <div className="px-0.5" data-testid="collection-order-goes-to">
                <p className="text-sm font-emphasis text-ink">Order goes to {data.company.name}</p>
                <p className="text-xs text-muted">You chat with them. They send the mill lots on.</p>
              </div>
            ) : null}
          </div>
        ) : null}

      </div>

      {isOwner && thisPackSelectedCount > 0 ? (
        <MoreActionsSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          title={data.name}
          testId="owner-collection-select-more-sheet"
          items={ownerCollectionSelectMoreIds(isGeneralAlbum, isCatalogAlbum).flatMap((action): MoreActionItem[] => {
            if (action === 'bookmark') {
              return [
                {
                  id: 'bookmark',
                  label: selectedDesignBookmarkLabel,
                  icon: <BookmarkIcon width={20} height={20} />,
                  disabled: bookmarkDesigns.isPending,
                  onClick: () => {
                    setMoreOpen(false);
                    onBookmarkSelectedDesigns();
                  },
                  testId: 'collection-select-bookmark',
                },
              ];
            }
            if (action === 'draft') {
              const draftable = ownerAlbumDraftableProductIds(
                products,
                thisPackSelectedIds,
                me.data?.id ?? '',
              );
              return [
                {
                  id: 'draft',
                  label: 'Draft',
                  icon: <LockIcon width={20} height={20} />,
                  disabled: manageBusy || draftable.length < 1,
                  onClick: () => {
                    setMoreOpen(false);
                    void onOwnerDraftDesigns();
                  },
                  testId: 'collection-select-draft',
                },
              ];
            }
            if (action === 'publish') {
              const publishable = ownerAlbumPublishableProductIds(
                products,
                thisPackSelectedIds,
                me.data?.id ?? '',
              );
              return [
                {
                  id: 'publish',
                  label: 'Publish',
                  icon: <MegaphoneIcon width={20} height={20} />,
                  disabled: manageBusy || publishable.length < 1,
                  onClick: () => {
                    setMoreOpen(false);
                    void onOwnerPublishDesigns();
                  },
                  testId: 'collection-select-publish',
                },
              ];
            }
            if (action === 'addToPack') {
              return [
                {
                  id: 'add-to-pack',
                  label: addToPackActionLabel(
                    stampOwnerAddToPackDesigns(selectedProducts, id, isGeneralAlbum),
                    addToPackSurface,
                  ),
                  icon: <CollectionIcon width={20} height={20} />,
                  onClick: () => {
                    setMoreOpen(false);
                    openAddToPack(selectedProducts);
                  },
                  testId: 'collection-select-add-to-pack',
                },
              ];
            }
            if (action === 'remove') {
              return [
                {
                  id: 'remove',
                  label: removeFromThisPackLabel(data.kind),
                  icon: <TrashIcon width={20} height={20} />,
                  disabled: manageBusy || !ownerCanRemove,
                  onClick: () => {
                    setMoreOpen(false);
                    void onOwnerRemove();
                  },
                  testId: 'collection-select-remove',
                },
              ];
            }
            return [
              {
                id: 'delete',
                label: 'Delete selected',
                icon: <TrashIcon width={20} height={20} />,
                danger: true,
                disabled: manageBusy || !ownerCanDelete,
                onClick: () => {
                  setMoreOpen(false);
                  void onOwnerDelete();
                },
                testId: 'collection-select-delete',
              },
            ];
          })}
        />
      ) : isOwner ? (
        <OwnerCollectionMoreSheet
          open={moreOpen}
          title={data.name}
          onClose={() => setMoreOpen(false)}
          onShare={openAlbumShare}
          onBookmark={() => saveCollection.toggle()}
          bookmarkSaved={saveCollection.isSaved}
          bookmarkBusy={saveCollection.isPending}
          onWhoHasAccess={openOwnerWhoHasAccess}
          onAddDesigns={onOwnerAddDesigns}
          onAddPhotos={onOwnerAddPhotos}
          onReplace={() => setReplaceSheetOpen(true)}
          onEditDetails={openOwnerEditDetails}
          onDraft={() => {
            setAlsoDraftDesigns(false);
            setPackDraftOpen(true);
          }}
          draftLabel={packDraftCopy(data.kind).menuLabel}
          canDraft={data.status === CollectionStatus.Published}
          isGeneral={data.kind === 'general'}
          kind={data.kind}
        />
      ) : (
        <MoreActionsSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          title={data.name}
          testId="visitor-collection-more-sheet"
          note={moreMenuNote}
          noteTestId="collection-menu-note"
          items={visitorCollectionMoreIds({
            tradeDockUp: thisPackSelectedCount > 0,
          }).flatMap((action): MoreActionItem[] => {
            if (action === 'message') {
              return [
                {
                  id: 'message',
                  label: startChat.isPending ? 'Opening…' : `Message ${data.company.name}`,
                  icon: <ChatIcon width={20} height={20} />,
                  testId: 'collection-menu-message',
                  disabled: startChat.isPending,
                  onClick: () => {
                    setMoreOpen(false);
                    startChat.mutate();
                  },
                },
              ];
            }
            if (action === 'share') {
              return [
                {
                  id: 'share',
                  label: shareThisPackLabel(data.kind),
                  icon: <PaperPlaneIcon width={20} height={20} />,
                  disabled: !id,
                  onClick: () => {
                    setMoreOpen(false);
                    openAlbumShare();
                  },
                },
              ];
            }
            if (thisPackSelectedCount > 0) {
              return [
                {
                  id: 'bookmark',
                  label: selectedDesignBookmarkLabel,
                  icon: <BookmarkIcon width={20} height={20} />,
                  testId: 'collection-select-bookmark',
                  disabled: bookmarkDesigns.isPending,
                  onClick: () => {
                    setMoreOpen(false);
                    onBookmarkSelectedDesigns();
                  },
                },
              ];
            }
            return [
              {
                id: 'bookmark',
                label: saveCollection.isSaved
                  ? 'Remove bookmark'
                  : bookmarkThisPackLabel(data.kind),
                icon: <BookmarkIcon width={20} height={20} />,
                testId: 'collection-menu-bookmark',
                disabled: !id || saveCollection.isPending,
                onClick: () => {
                  setMoreOpen(false);
                  saveCollection.toggle();
                },
              },
            ];
          })}
        />
      )}

      {showResumeContinue && resumeAfterPick ? (
            <BottomTradeDock testId="album-pick-continue" aboveAppNav={false}>
                <Button fullWidth onClick={onContinueAfterAlbumPick}>
                  {continueAfterAlbumPickLabel(resumeAfterPick, albumPick.count)}
                </Button>
            </BottomTradeDock>
          ) : null}

      {data.products ? (
        <div data-testid="collection-lot-tools">
        <BrowseLotChrome
          findOpen={searchOpen}
          findLabel={findInThisPack(data.kind)}
          findTestId="collection-find-toggle"
          findInputTestId="collection-find"
          findPlaceholder={findInThisPack(data.kind)}
          findValue={listSearch}
          onFindToggle={() => {
            if (searchOpen) {
              setSearchOpen(false);
              setListSearch('');
              return;
            }
            setSearchOpen(true);
          }}
          onFindChange={setListSearch}
          selecting={selectMode}
          selectedCount={floatSelectedCount}
          allSelected={selectAll.allSelected}
          onEnterSelect={onEnterSelect}
          onSelectAll={onSelectAllVisible}
          onClear={onClearVisible}
          selectTestId="collection-select"
          canSelect={canSelectDesigns}
          layout={layout}
          layoutTestId="collection-layout-toggle"
          onLayoutToggle={() => {
            setLayout((prev) => {
              const next = prev === 'feed' ? 'grid' : 'feed';
              writeDesignBrowseLayout(myCompanyId, next);
              return next;
            });
          }}
        >
        {visibleProducts.length === 0 && listSearchActive ? (
          <p className="px-0.5 text-sm text-muted">No designs match.</p>
        ) : visibleProducts.length === 0 ? (
          <p className="px-0.5 text-sm text-muted">
            {isOwner ? noDesignsInThisPack(data.kind) : noDesignsInThisPack(data.kind, true)}
          </p>
        ) : layout === 'feed' ? (
          <div className="flex flex-col gap-4">
            {visibleProducts.map((product) => (
                <DesignTile
                  key={product.id}
                  variant="feed"
                  product={product}
                  highlightQuery={deferredListSearch}
                  draft={isOwner && product.status === ProductStatus.Draft}
                  selected={designIsSelected(product.id)}
                  selectMode={selectMode}
                  shopLine={albumTileShopLine({
                    mixedSources: isCuratedPack,
                    creditMills: creditTileMills,
                    shopName: product.companyName,
                    curatedFrom: product.companyId !== data.company.id,
                  })}
                  onActivate={(photoIndex) => onDesignActivate(product, photoIndex)}
                  onOpen={() => openViewer(product, 0)}
                  onLongSelect={() => onDesignLongSelect(product)}
                />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleProducts.map((product) => (
                <DesignTile
                  key={product.id}
                  variant="grid"
                  product={product}
                  highlightQuery={deferredListSearch}
                  draft={isOwner && product.status === ProductStatus.Draft}
                  selected={designIsSelected(product.id)}
                  selectMode={selectMode}
                  shopLine={albumTileShopLine({
                    mixedSources: isCuratedPack,
                    creditMills: creditTileMills,
                    shopName: product.companyName,
                    curatedFrom: product.companyId !== data.company.id,
                  })}
                  onActivate={() => onDesignActivate(product)}
                  onOpen={() => openViewer(product, 0)}
                  onLongSelect={() => onDesignLongSelect(product)}
                />
            ))}
          </div>
        )}
        </BrowseLotChrome>
        </div>
      ) : accessPending ? (
        <AccessPendingCard
          companyId={data.company.id}
          companyName={data.company.name}
          kind={data.kind}
          onOpenChat={() => startChat.mutate()}
          opening={startChat.isPending}
        />
      ) : (
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
            <LockIcon />
          </span>
          <div>
            <p className="text-sm font-emphasis text-ink">{askToSeeThisPack(data.kind)}</p>
            <p className="text-xs text-muted">
              {askToSeeThisPackBody(data.company.name, data.kind)}
            </p>
          </div>
          <Button onClick={() => askToSee.mutate()} disabled={askToSee.isPending}>
            {askToSee.isPending ? 'Asking…' : askToSeeThisPack(data.kind)}
          </Button>
          <Link to={`/company/${data.company.id}`} className="text-xs font-emphasis text-accent">
            Request access on their shop
          </Link>
        </Card>
      )}

      {data.products && isCuratedPack && !isOwner && !handlePack ? (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-emphasis text-ink">Message to order these designs</p>
          <p className="text-xs text-muted">
            This collection mixes designs from more than one business. Chat to place an order.
          </p>
          <Button
            fullWidth
            onClick={() => startChat.mutate()}
            disabled={startChat.isPending}
          >
            {startChat.isPending ? 'Opening…' : 'Open chat'}
          </Button>
        </Card>
      ) : null}

      {isOwner && (viewGrants.data?.length ?? 0) > 0 ? (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-emphasis text-ink">Granted on request</p>
          <p className="text-xs text-muted">
            {allowedForThisPackOnly(data.kind)}
          </p>
          <ul className="flex flex-col gap-2">
            {viewGrants.data!.map((grant) => (
              <li
                key={grant.companyId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate font-emphasis text-ink">
                  {grant.company.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-emphasis text-danger"
                  disabled={revokeGrant.isPending}
                  onClick={() => revokeGrant.mutate(grant.companyId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {ownerManageDock ? (
        <OwnerPackManageDock
          selecting={false}
          busy={manageBusy || quickUploading}
          canDelete={false}
          canRemove={false}
          kind={data.kind}
          onAddDesigns={onOwnerAddDesigns}
          onAddPhotos={onOwnerAddPhotos}
          onReplace={() => setReplaceSheetOpen(true)}
          onDelete={() => undefined}
          onRemove={() => undefined}
        />
      ) : null}

      <OwnerPackReplaceSheet
        open={replaceSheetOpen}
        onClose={() => setReplaceSheetOpen(false)}
        busy={manageBusy}
        uploading={quickUploading}
        onDesigns={beginOwnerReplaceFromDesigns}
        onPhotos={beginOwnerReplaceFromPhotos}
      />
      <OwnerPackDeleteSheet
        open={deleteSheetOpen}
        onClose={() => setDeleteSheetOpen(false)}
        busy={manageBusy}
        kind={data.kind}
        onDeleteEverywhere={() => void finishOwnerDelete('everywhere')}
        onOnlyThisCollection={() => void finishOwnerDelete('only-here')}
      />
      <OwnerPackLifecycleSheet
        open={packDraftOpen}
        onClose={() => setPackDraftOpen(false)}
        busy={draftPack.isPending}
        title={packDraftCopy(data.kind).title}
        body={packDraftCopy(data.kind).body}
        alsoLabel={packDraftCopy(data.kind).alsoDraftLabel}
        alsoOn={alsoDraftDesigns}
        onAlso={setAlsoDraftDesigns}
        confirmLabel={packDraftCopy(data.kind).confirmLabel}
        onConfirm={() => draftPack.mutate(alsoDraftDesigns)}
      />
      <OwnerPackLifecycleSheet
        open={designDraftConfirmOpen}
        onClose={() => {
          setDesignDraftConfirmOpen(false);
          draftTargetRef.current = null;
        }}
        busy={manageBusy}
        title={sharedDesignDraftCopy().title}
        body={sharedDesignDraftCopy().body}
        confirmLabel={sharedDesignDraftCopy().confirmLabel}
        onConfirm={() => void finishOwnerDraftDesigns(draftTargetRef.current ?? [])}
      />

      <input
        ref={designFileRef}
        {...collectionGalleryInputProps}
        data-testid="owner-album-gallery-input"
        className="hidden"
        onChange={(e) => void onOwnerPhotoFiles([...(e.target.files ?? [])])}
      />

      <ContinuousCamera
        key={cameraSession}
        open={cameraOpen}
        maxShots={collectionCameraMaxShots(0)}
        onCancel={() => {
          setCameraOpen(false);
          abandonReplaceIfPending();
        }}
        batchAsDesigns
        onUnavailable={() => {
          setCameraOpen(false);
          openCollectionGalleryDeferred();
        }}
        onGallery={() => {
          setCameraOpen(false);
          clickCollectionGallery();
        }}
        onDone={(files) => {
          setCameraOpen(false);
          void onOwnerPhotoFiles(files);
        }}
      />

      <Sheet
        open={libraryOpen}
        onClose={() => {
          void finishOwnerLibrary();
        }}
        title={replaceDraft !== null || replacePending ? 'Replace designs' : 'Add designs'}
        footer={
          <Button fullWidth disabled={manageBusy || quickUploading} onClick={() => void finishOwnerLibrary()}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3" data-testid="owner-album-library-sheet">
          {myProducts.isLoading ? (
            <LoadingBlock label="Loading designs…" />
          ) : selectableDesigns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted">No designs in your library yet.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setLibraryOpen(false);
                  setReplaceDraft(null);
                  abandonReplaceIfPending();
                  openOwnerPhotos();
                }}
              >
                Add photos
              </Button>
            </div>
          ) : pickerDesigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {libraryPickerEmptyCopy(packKind)}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                {libraryPickerHint(packKind, replaceDraft !== null || replacePending)}
              </p>
              <TextInput
                value={designSearch}
                onChange={(e) => setDesignSearch(e.target.value)}
                placeholder="Search by name"
              />
              <CappedMediaGrid
                items={filteredDesigns}
                getKey={(product) => product.id}
                overflowPreviewUrl={(product) => product.images[0] ?? null}
                loadMoreTestId="owner-album-library-load-more"
                renderTile={(product) => {
                  const on =
                    replaceDraft !== null
                      ? replaceDraft.has(product.id)
                      : libraryPicks.has(product.id);
                  return (
                    <LibraryPickTile
                      name={product.name}
                      imageUrl={product.images[0]}
                      selected={on}
                      onClick={() => toggleOwnerLibraryPick(product.id)}
                    />
                  );
                }}
              />
            </>
          )}
        </div>
      </Sheet>

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={
          shareScope === 'album' && id && data
            ? [{ collectionId: id, name: data.name, image: data.coverImage }]
            : []
        }
        products={shareScope === 'designs' ? shareDesignItems : []}
        onShared={() => {
          if (shareScope !== 'designs') return;
          clearOwnerManageSelect();
        }}
      />

      {viewerProduct ? (
        <DesignSheet
          product={viewerProduct}
          shopLine={albumTileShopLine({
            mixedSources: isCuratedPack,
            creditMills: creditTileMills,
            shopName: viewerProduct.companyName,
            curatedFrom: viewerProduct.companyId !== data.company.id,
          })}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerProduct(null)}
          collectionId={id}
          canEdit={collectionOwnerCanEditDesign({
            isOwner,
            myCompanyId: me.data?.id,
            productCompanyId: viewerProduct.companyId,
          })}
          canRemove={isOwner}
          canAddToPack={isOwner && addToPackCanOffer([viewerProduct])}
          addToPackSurface={addToPackSurface}
          canDelete={collectionOwnerCanEditDesign({
            isOwner,
            myCompanyId: me.data?.id,
            productCompanyId: viewerProduct.companyId,
          })}
          onAddToPack={() => {
            openAddToPack([viewerProduct]);
            setViewerProduct(null);
          }}
          onEdit={() => {
            const designId = viewerProduct.id;
            setViewerProduct(null);
            navigate(`/catalog/products/${designId}`);
          }}
          onRemove={() => {
            void onOwnerRemove([viewerProduct.id]);
          }}
          onDelete={() => {
            void onOwnerDelete([viewerProduct.id]);
          }}
          removeLabel={removeFromThisPackLabel(data.kind)}
          removeBusy={manageBusy}
          packStamp={packStamp}
          testIdPrefix="collection-design-sheet"
        />
      ) : null}

      <AddToPackSheet
        open={addToPackDesigns != null}
        productIds={addToPackDesigns?.map((design) => design.id) ?? []}
        knownDesigns={addToPackDesigns ?? []}
        onClose={() => setAddToPackDesigns(null)}
        surface={addToPackSurface}
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
        sellerId={sellerIdForEntries(
          tradeableShortlistEntries(qtyEntries ?? shortlist.entries),
        )}
        products={entriesAsProducts(
          tradeableShortlistEntries(qtyEntries ?? shortlist.entries),
        )}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        orderGoesToName={packHandlerName(
          tradeableShortlistEntries(qtyEntries ?? shortlist.entries),
        )}
        sheetJob="order"
        onSendOrder={(lines, place) => {
          const linesForPath = tradeableShortlistEntries(
            qtyEntries ?? shortlist.entries,
          );
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
    </div>
  );
}

function AccessPendingCard({
  companyId,
  companyName,
  kind,
  onOpenChat,
  opening,
}: {
  companyId: string;
  companyName: string;
  kind?: string | null;
  onOpenChat: () => void;
  opening: boolean;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
        <LockIcon />
      </span>
      <div>
        <div className="mb-1 flex items-center justify-center gap-2">
          <p className="text-sm font-emphasis text-ink">Waiting for them</p>
          <StatusPill status="pending" />
        </div>
        <p className="text-xs text-muted">
          {askedToOpenThisPack(companyName, kind)}
        </p>
      </div>
      <Button onClick={onOpenChat} disabled={opening}>
        {opening ? 'Opening…' : 'Open chat'}
      </Button>
      <Link to={`/company/${companyId}`} className="text-xs font-emphasis text-accent">
        Request access on their shop
      </Link>
    </Card>
  );
}

function DesignTile({
  product,
  highlightQuery = '',
  draft = false,
  selected,
  selectMode,
  variant,
  shopLine = null,
  unavailableReason,
  onActivate,
  onOpen,
  onLongSelect,
}: {
  product: ProductView;
  highlightQuery?: string;
  draft?: boolean;
  selected: boolean;
  selectMode: boolean;
  variant: 'feed' | 'grid';
  shopLine?: string | null;
  unavailableReason?: string;
  onActivate: (photoIndex?: number) => void;
  onOpen?: () => void;
  onLongSelect?: () => void;
}) {
  // Album thumbs never show a rate chip (designTileRateOverlay always null).
  const rateOverlay = designTileRateOverlay(
    formatCatalogRate({
      rate: product.rate,
      rateMax: product.rateMax,
      unit: product.unit,
      dispatchUnit: product.dispatchUnit,
    }),
  );
  const meta = designTileMetaLine({
    sku: product.sku,
    rateLabel: rateOverlay,
    variant,
  });
  const curatedFrom = Boolean(shopLine?.startsWith('From '));

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface text-left">
      {variant === 'feed' ? (
        <FeedDesignPhotoCarousel
          urls={product.images}
          name={product.name}
          selectMode={selectMode}
          selected={selected}
          unavailableReason={unavailableReason}
          rateOverlay={rateOverlay}
          onActivate={(photoIndex) => onActivate(photoIndex)}
          onLongSelect={onLongSelect}
        />
      ) : (
        <DesignPhotoCarousel
          urls={product.images}
          name={product.name}
          photoClassName={designBrowsePhotoClass('grid')}
          placeholderClassName={designBrowsePhotoClass('grid', 'placeholder')}
          selectMode={selectMode}
          selected={selected}
          unavailableReason={unavailableReason}
          rateOverlay={rateOverlay}
          onActivate={(photoIndex) => onActivate(photoIndex)}
          onLongSelect={onLongSelect}
          testId="collection-grid-photo-carousel"
        />
      )}
      <button
        type="button"
        onClick={onOpen ?? (() => onActivate(0))}
        data-testid={`collection-design-open-${product.id}`}
        className={cx(
          'block w-full text-left',
          variant === 'feed' ? 'p-3' : 'p-2.5',
        )}
      >
        <p className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-emphasis text-ink">
            {highlightSearchText(product.name, highlightQuery)}
          </span>
          {draft ? <DraftChip testId="collection-design-draft-chip" /> : null}
        </p>
        {shopLine ? (
          <p
            className={cx(
              'truncate text-xs',
              curatedFrom ? 'font-emphasis text-ink' : 'text-muted',
            )}
            data-testid={curatedFrom ? 'collection-design-from' : undefined}
          >
            {highlightSearchText(shopLine, highlightQuery)}
          </p>
        ) : null}
        {meta ? (
          <p className="truncate text-xs text-muted">{highlightSearchText(meta, highlightQuery)}</p>
        ) : null}
      </button>
    </div>
  );
}
