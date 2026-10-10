import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  OrderIntent,
  OrderKind,
  ProductStatus,
  Unit,
  type CollectionPreviewView,
  type CollectionViewGrantView,
  type CollectionViewRequestView,
  type CreateOrdersBatchResult,
  type CreateOrdersFromPackResult,
  type CreateProductDto,
  type OrderView,
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
import { addCartDesignsMany } from '@/features/browse/browseCart';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { BrowseLotChrome } from '@/features/browse/BrowseLotChrome';
import { selectAllState } from '@/features/browse/selectAllState';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { shouldFallbackPackOrderToBatch } from '@/features/browse/packOrderSource';
import {
  continueAfterAlbumPickLabel,
  nextStepAfterAlbumPick,
  readResumeAfterAlbumPick,
} from '@/features/browse/resumeAfterAlbumPick';
import {
  isPublishedForSelection,
  selectionSkipToast,
  travelingSelectionToggleGate,
} from '@/features/browse/selectionEligibility';
import { PhotoViewer } from '@/ui/PhotoViewer';
import {
  rememberCatalogHandlerName,
  rememberForwardFacilitator,
  rememberOrderPath,
} from '@/features/browse/forwardAttribution';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { navigateToOrderChat } from '@/features/orders/navigateToOrderChat';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { PageHeader } from '@/ui/PageHeader';
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
  collectionPackDetailSections,
  collectionPackQtySheet,
  collectionPackTradeDock,
  collectionShowHandleCopy,
  collectionThisPackSelectedIds,
  collectionViewerListedProducts,
  designSheetRateBand,
  designTileMetaLine,
  designTileRateOverlay,
} from '@/features/collections/collectionViewerChrome';
import { CollectionPackDetails } from '@/features/collections/CollectionPackDetails';
import { PackDetailBlocks } from '@/features/collections/PackDetailBlocks';
import { collectionPageIsSelecting } from '@/features/collections/collectionPageSelect';
import { OwnerPackManageDock } from '@/features/collections/OwnerPackManageDock';
import { OwnerCollectionMoreSheet } from '@/features/collections/OwnerCollectionMoreSheet';
import { OwnerPackDeleteSheet } from '@/features/collections/OwnerPackDeleteSheet';
import { OwnerPackReplaceSheet } from '@/features/collections/OwnerPackReplaceSheet';
import {
  canDeleteSelected,
  deleteNeedsMultiPackConfirm,
  membershipAfterRemove,
  membershipForReplaceOrAppend,
  membershipWithNewFirst,
  ownedSelectedIds,
} from '@/features/collections/ownerPackManage';
import {
  COLLECTION_QUICK_PHOTO_CAP,
  collectionCameraMaxShots,
} from '@/features/catalog/collectionCreateHelpers';
import { collectionGalleryInputProps } from '@/features/catalog/collectionGalleryInput';
import { createProductIdentity, uniqueDraftSku } from '@/features/catalog/designBatchHelpers';
import { productFieldsFromMember } from '@/features/catalog/collectionSameForAll';
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
import { ContinuousCamera, continuousCameraConstraints } from '@/ui/ContinuousCamera';
import { CappedMediaGrid } from '@/ui/CappedMediaGrid';
import { BookmarkIcon, ChatIcon, LockIcon, MoreHorizontalIcon, ShareIcon } from '@/ui/icons';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { designMatchesFind } from '@/features/catalog/catalogSearch';
import { useToast } from '@/ui/Toast';
import { SelectableMediaFrame } from '@/ui/selectMediaChrome';
import { LONG_PRESS_SURFACE_CLASS, useLongPress } from '@/ui/useLongPress';

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
    moq: product.moq ?? null,
    rate: product.rate ?? null,
    rateMax: product.rateMax ?? null,
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
  const [layout, setLayout] = useState<Layout>(() => readDesignBrowseLayout(myCompanyId));
  const [viewerProduct, setViewerProduct] = useState<ProductView | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  /** Album ⋯ vs Selecting dock — CatalogShareSheet payload. */
  const [shareScope, setShareScope] = useState<'album' | 'designs'>('album');
  const [moreOpen, setMoreOpen] = useState(false);
  const [pageSelecting, setPageSelecting] = useState(false);
  const [manageSelected, setManageSelected] = useState<Set<string>>(() => new Set());
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const deferredListSearch = useDeferredValue(listSearch);

  const enterSelect = Boolean(
    (location.state as { enterSelect?: boolean } | null)?.enterSelect,
  );

  useEffect(() => {
    setLayout(readDesignBrowseLayout(myCompanyId));
  }, [myCompanyId]);

  useEffect(() => {
    if (!enterSelect) return;
    setPageSelecting(true);
    shortlist.setSelectMode(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [enterSelect, shortlist, navigate, location.pathname, location.search]);

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
    navigate('/selection', {
      state: step.resume === 'curate' ? { openCurate: true } : { openOrder: true },
    });
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
  const save = useSaveToggle({ collectionId: id });
  const outgoingAsks = useQuery({
    queryKey: ['collection-view-requests', 'outgoing'],
    queryFn: () =>
      api.get<CollectionViewRequestView[]>('/collection-view-requests/outgoing'),
  });

  const products = collectionViewerListedProducts(collection.data?.products ?? []);
  const visibleProducts = useMemo(
    () => products.filter((product) => designMatchesFind(deferredListSearch, product)),
    [products, deferredListSearch],
  );
  const listSearchActive = Boolean(deferredListSearch.trim());
  const selectMode = collectionPageIsSelecting({ enterSelect, pageSelecting });
  const resumeAfterPick = readResumeAfterAlbumPick();
  const showResumeContinue = Boolean(resumeAfterPick && selectMode);
  const companyId = collection.data?.company.id ?? '';
  const isOwner = Boolean(me.data?.id && companyId && me.data.id === companyId);
  const thisPackSelectedIds = useMemo(
    () =>
      collectionThisPackSelectedIds(
        products.map((product) => product.id),
        shortlist.productIds,
      ),
    [products, shortlist.productIds],
  );
  const thisPackSelectedCount = thisPackSelectedIds.length;
  const packTradeDock = collectionPackTradeDock({
    visitor: !isOwner,
    live: collection.data?.status === CollectionStatus.Published,
    hasProducts: products.length > 0,
    selecting: selectMode,
    resumeContinue: showResumeContinue,
    thisPackSelectedCount,
  });
  const ownerManageDock = collectionOwnerManageDock(isOwner);
  usePageOwnsBottomBand(ownerManageDock || packTradeDock);
  usePageSelecting(selectMode);

  useEffect(() => {
    if (!selectMode) setManageSelected(new Set());
  }, [selectMode]);
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
  const thisAlbumCount = isOwner
    ? visibleDesignIds.filter((id) => manageSelected.has(id)).length
    : visibleDesignIds.filter((id) => shortlist.productIds.has(id)).length;
  const selectAll = selectAllState(
    visibleDesignIds,
    isOwner ? manageSelected : shortlist.productIds,
  );
  const manageSelectedIds = useMemo(() => [...manageSelected], [manageSelected]);
  const ownerCanDelete = canDeleteSelected(manageSelectedIds);
  const ownerCanRemove = manageSelectedIds.length > 0;
  const ownerCanShare = manageSelectedIds.length > 0;
  const ownerCanAddToCart = manageSelectedIds.length > 0;
  const shareDesignItems = useMemo(() => {
    if (shareScope !== 'designs') return [];
    const selected = new Set(manageSelectedIds);
    return visibleProducts
      .filter((product) => selected.has(product.id))
      .map((product) => ({
        productId: product.id,
        name: product.name,
        image: product.images?.[0] ?? null,
      }));
  }, [shareScope, manageSelectedIds, visibleProducts]);
  /** Visitor float = this album only (not Explore’s global pile). */
  const floatSelectedCount = isOwner ? manageSelected.size : thisAlbumCount;

  const onSelectAllVisible = () => {
    if (isOwner) {
      setPageSelecting(true);
      setManageSelected(new Set(visibleDesignIds));
      return;
    }
    const published = visibleProducts.filter((product) => isPublishedForSelection(product.status));
    const skipped = visibleProducts.length - published.length;
    const notice = selectionSkipToast(skipped, published.length);
    if (notice) showToast(notice);
    if (published.length < 1) return;
    setPageSelecting(true);
    shortlist.addMany(
      published.map((product) =>
        toShortlistEntry(product, product.companyName ?? companyName, packStamp),
      ),
    );
  };
  const onClearVisible = () => {
    if (isOwner) {
      setManageSelected(new Set());
      setPageSelecting(false);
      return;
    }
    shortlist.removeIds(visibleDesignIds);
    setPageSelecting(false);
    shortlist.setSelectMode(false);
  };

  const onEnterSelect = () => {
    setPageSelecting(true);
    if (!isOwner) shortlist.setSelectMode(true);
  };

  const invalidateOwnerPack = () => {
    void queryClient.invalidateQueries({ queryKey: ['collection-preview', id] });
    void queryClient.invalidateQueries({ queryKey: ['collection', id] });
    void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
    void queryClient.invalidateQueries({ queryKey: ['explore'] });
  };

  const persistOwnerMembers = async (productIds: string[]) => {
    await api.put(`/collections/${id}/products`, { productIds });
    invalidateOwnerPack();
  };

  const clearOwnerManageSelect = () => {
    setManageSelected(new Set());
    setPageSelecting(false);
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
  const designQuery = designSearch.trim().toLowerCase();
  const filteredDesigns = designQuery
    ? selectableDesigns.filter((product) => product.name.toLowerCase().includes(designQuery))
    : selectableDesigns;

  const clickCollectionGallery = () => {
    designFileRef.current?.click();
  };

  const openCollectionGalleryDeferred = () => {
    voidMicrotask(() => clickCollectionGallery());
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

  const onOwnerReplaceConfirm = () => {
    setReplaceSheetOpen(false);
    setReplacePendingFlag(true);
    setReplaceDraft(null);
    showToast('Pick the new set — collection updates when you save');
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
          piecesPerPack: seed?.piecesPerPack != null ? String(seed.piecesPerPack) : '',
          moq: seed?.moq != null ? String(seed.moq) : '',
          notes: '',
          categories: [],
        });
        const dto: CreateProductDto = {
          name: identity.name,
          sku: identity.sku,
          images: [imageUrl],
          categories: [],
          description: parsed.description,
          rate: parsed.rate ?? undefined,
          rateMax: parsed.rateMax ?? undefined,
          unit: parsed.unit as CreateProductDto['unit'],
          dispatchUnit: parsed.dispatchUnit as CreateProductDto['dispatchUnit'],
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

  const onOwnerRemove = async () => {
    if (!ownerCanRemove || !id) return;
    setManageBusy(true);
    try {
      const next = membershipAfterRemove(
        products.map((product) => product.id),
        manageSelectedIds,
      );
      await persistOwnerMembers(next);
      clearOwnerManageSelect();
      showToast('Removed from collection');
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

  const finishOwnerDelete = async (mode: 'everywhere' | 'only-here') => {
    const myId = me.data?.id ?? '';
    const owned = ownedSelectedIds(manageSelectedIds, productCompanyById, myId);
    setManageBusy(true);
    try {
      if (mode === 'everywhere' && owned.length > 0) {
        await deleteOwnedProducts(owned);
      }
      const next = membershipAfterRemove(
        products.map((product) => product.id),
        manageSelectedIds,
      );
      await persistOwnerMembers(next);
      setDeleteSheetOpen(false);
      clearOwnerManageSelect();
      showToast(
        mode === 'everywhere' && owned.length > 0
          ? 'Deleted'
          : mode === 'everywhere'
            ? 'Deleted from this collection'
            : 'Removed from collection',
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not delete.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const onOwnerDelete = async () => {
    if (!ownerCanDelete || !id) return;
    const myId = me.data?.id ?? '';
    const owned = ownedSelectedIds(manageSelectedIds, productCompanyById, myId);
    if (owned.length === 0) {
      await finishOwnerDelete('everywhere');
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
    await finishOwnerDelete('everywhere');
  };

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
      showToast('Removed access to this collection.');
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

  const packOrder = useMutation({
    mutationFn: async (input: {
      intent: typeof OrderIntent.Order | typeof OrderIntent.Inquiry;
      lines: Array<{ productId: string; quantity: number; note?: string }>;
      transporter?: string;
    }) => {
      const items = input.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        images: [] as string[],
        ...(line.note?.trim() ? { note: line.note.trim() } : {}),
      }));
      const transporter = input.transporter?.trim() || undefined;
      const batchBody = {
        kind: OrderKind.Standard,
        intent: input.intent,
        ...(transporter ? { transporter } : {}),
        items,
      };
      try {
        return await api.post<CreateOrdersFromPackResult>('/orders/from-pack', {
          collectionId: id,
          kind: OrderKind.Standard,
          intent: input.intent,
          ...(transporter ? { transporter } : {}),
          items,
        });
      } catch (err) {
        if (err instanceof ApiError && shouldFallbackPackOrderToBatch(err.code)) {
          const batch = await api.post<CreateOrdersBatchResult>('/orders/batch', batchBody);
          const downstream = batch.orders[0] as OrderView | undefined;
          if (!downstream) {
            throw new ApiError({
              statusCode: 400,
              code: 'ORDER_FAILED',
              message: 'Could not place the order.',
            });
          }
          return {
            downstream,
            upstreams: [],
            failures: batch.failures ?? [],
          } satisfies CreateOrdersFromPackResult;
        }
        throw err;
      }
    },
    onSuccess: (payload, variables) => {
      setQtyOpen(false);
      setOrderError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (variables.intent === OrderIntent.Inquiry) {
        showToast('Rate request sent');
      }
      void navigateToOrderChat(navigate, queryClient, payload.downstream);
    },
    onError: (error, variables) => {
      const inquiry = variables.intent === OrderIntent.Inquiry;
      setOrderError(
        error instanceof ApiError
          ? error.message
          : inquiry
            ? 'Could not ask for rates.'
            : 'Could not place the order.',
      );
    },
  });

  const toggleProduct = (product: ProductView) => {
    if (isOwner) {
      setManageSelected((prev) => {
        const next = new Set(prev);
        if (next.has(product.id)) next.delete(product.id);
        else next.add(product.id);
        return next;
      });
      return;
    }
    const gate = travelingSelectionToggleGate({
      status: product.status,
      alreadySelected: shortlist.productIds.has(product.id),
    });
    if (!gate.allow) {
      if (gate.toast) showToast(gate.toast);
      return;
    }
    shortlist.toggle(toShortlistEntry(product, product.companyName ?? companyName, packStamp));
  };

  const openViewer = (product: ProductView, index = 0) => {
    setViewerProduct(product);
    setViewerIndex(index);
  };

  const onDesignActivate = (product: ProductView) => {
    if (selectMode) {
      toggleProduct(product);
      return;
    }
    openViewer(product, 0);
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

  const openSelectedDesignsShare = () => {
    if (manageSelectedIds.length < 1) return;
    setShareScope('designs');
    setShareOpen(true);
  };

  const addSelectedDesignsToCart = () => {
    if (manageSelectedIds.length < 1) return;
    const selected = new Set(manageSelectedIds);
    const picked = visibleProducts.filter((product) => selected.has(product.id));
    const published = picked.filter((product) => isPublishedForSelection(product.status));
    const notice = selectionSkipToast(picked.length - published.length, published.length);
    if (notice) showToast(notice);
    if (published.length < 1) return;
    addCartDesignsMany(
      published.map((product) =>
        toShortlistEntry(product, product.companyName ?? companyName, packStamp),
      ),
    );
    setManageSelected(new Set());
    setPageSelecting(false);
    showToast(
      published.length === 1 ? 'Added to cart' : `${published.length} added to cart`,
      'success',
    );
  };

  const openOwnerWhoHasAccess = () => {
    if (!id) return;
    navigate(`/catalog/collections/${id}`, { state: { openPublish: true } });
  };

  const openOwnerEditDetails = () => {
    if (!id) return;
    navigate(`/catalog/collections/${id}`);
  };

  const data = collection.data;
  const floaterClearance =
    (!isOwner && selectMode && thisAlbumCount + albumPick.count > 0) || showResumeContinue;
  // API: pack rate or design min–max; null for non-owners when on request.
  const rateBand = albumFactsRateBand({
    rateMin: data?.rateMin,
    rateMax: data?.rateMax,
    rateUnit: data?.rateUnit,
  });
  const packDetails = collectionPackDetailSections({
    categories: data?.categories,
    description: data?.description,
    rateBand,
  });
  const moreMenuNote = collectionMoreMenuNote({
    visitor: !isOwner,
    // Grant / follow look-through without Connect — not gated Ask (no products).
    lookOnly: Boolean(data?.products && !data.connected),
    allowForward: data?.allowForward !== false,
  });
  const headerSubtitle = data
    ? isOwner
      ? packHeaderSubtitleWithShop(products.length, products, null)
      : packHeaderSubtitleWithShop(products.length, products, data.company.name)
    : undefined;

  return (
    <div
      className={cx(
        'flex flex-col gap-4',
        // Nav is hidden whenever a dock/floater owns the band — do not add a phantom nav pad.
        floaterClearance &&
          (showResumeContinue
            ? 'pb-[calc(10rem+env(safe-area-inset-bottom))]'
            : SELECTION_DOCK_CLEARANCE_CLASS),
        packTradeDock && BOTTOM_DOCK_CLEARANCE_CLASS,
        ownerManageDock &&
          (selectMode ? SELECTION_DOCK_CLEARANCE_CLASS : BOTTOM_DOCK_CLEARANCE_CLASS),
      )}
    >
      {/*
        PageHeader must be a direct sticky child of this full-height column. Nesting it
        with facts/tools made sticky end when that short block scrolled away — then
        SelectAllFloat stuck at top-[3.25rem] with feed cards peeking above (BM-07).
      */}
      <PageHeader
        className="mb-0"
        title={data.name}
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
        {packDetails.length > 0 ||
        ownerSourceLine ||
        (data.products && showHandleCopy) ? (
          <div className="flex flex-col gap-1">
            {packDetails.length > 0 ? (
              <CollectionPackDetails
                categories={data.categories}
                description={data.description}
                rateBand={rateBand}
              />
            ) : null}
            {ownerSourceLine ? (
              <p
                className="px-0.5 text-sm font-semibold tracking-tight text-ink"
                data-testid="collection-owner-source"
              >
                {ownerSourceLine}
              </p>
            ) : null}
            {data.products && showHandleCopy ? (
              <div className="px-0.5" data-testid="collection-order-goes-to">
                <p className="text-sm font-semibold text-ink">Order goes to {data.company.name}</p>
                <p className="text-xs text-muted">You chat with them. They send the mill lots on.</p>
              </div>
            ) : null}
          </div>
        ) : null}

      </div>

      {isOwner ? (
        <OwnerCollectionMoreSheet
          open={moreOpen}
          title={data.name}
          onClose={() => setMoreOpen(false)}
          onShare={openAlbumShare}
          onWhoHasAccess={openOwnerWhoHasAccess}
          onAddPhotos={onOwnerAddPhotos}
          onEditDetails={openOwnerEditDetails}
        />
      ) : (
        <MoreActionsSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          title={data.name}
          testId="visitor-collection-more-sheet"
          note={moreMenuNote}
          noteTestId="collection-menu-note"
          items={[
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
            {
              id: 'share',
              label: 'Share',
              icon: <ShareIcon width={20} height={20} />,
              disabled: !id,
              onClick: () => {
                setMoreOpen(false);
                openAlbumShare();
              },
            },
            {
              id: 'bookmark',
              label: save.isSaved ? 'Remove bookmark' : 'Bookmark',
              icon: <BookmarkIcon width={20} height={20} />,
              testId: 'collection-menu-bookmark',
              disabled: !id || save.isPending,
              onClick: () => {
                setMoreOpen(false);
                save.toggle();
              },
            },
          ]}
        />
      )}

      {showResumeContinue && resumeAfterPick && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md"
              data-testid="album-pick-continue"
            >
              <div className="mx-auto max-w-md">
                <Button fullWidth onClick={onContinueAfterAlbumPick}>
                  {continueAfterAlbumPickLabel(resumeAfterPick, albumPick.count)}
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {data.products ? (
        <div data-testid="collection-lot-tools">
        <BrowseLotChrome
          findOpen={searchOpen}
          findLabel="Find in this collection"
          findTestId="collection-find-toggle"
          findInputTestId="collection-find"
          findPlaceholder="Find in this collection"
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
          <p className="px-0.5 text-sm text-muted">No live designs in this collection.</p>
        ) : layout === 'feed' ? (
          <div className="flex flex-col gap-4">
            {visibleProducts.map((product) => (
                <DesignTile
                  key={product.id}
                  variant="feed"
                  product={product}
                  selected={
                    isOwner
                      ? manageSelected.has(product.id)
                      : shortlist.productIds.has(product.id)
                  }
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleProducts.map((product) => (
                <DesignTile
                  key={product.id}
                  variant="grid"
                  product={product}
                  selected={
                    isOwner
                      ? manageSelected.has(product.id)
                      : shortlist.productIds.has(product.id)
                  }
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
          onOpenChat={() => startChat.mutate()}
          opening={startChat.isPending}
        />
      ) : (
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
            <LockIcon />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Ask to see this collection</p>
            <p className="text-xs text-muted">
              Ask {data.company.name} to open these {data.productCount} designs so you can look
              through them. Not connect, and not putting designs in your collection.
            </p>
          </div>
          <Button onClick={() => askToSee.mutate()} disabled={askToSee.isPending}>
            {askToSee.isPending ? 'Asking…' : 'Ask to see this collection'}
          </Button>
          <Link to={`/company/${data.company.id}`} className="text-xs font-medium text-accent">
            Request catalog access on their shop
          </Link>
        </Card>
      )}

      {data.products && isCuratedPack && !isOwner && !handlePack ? (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">Message to order these designs</p>
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
          <p className="text-sm font-semibold text-ink">Granted on request</p>
          <p className="text-xs text-muted">
            Businesses you Allowed for this collection only — not Connections.
          </p>
          <ul className="flex flex-col gap-2">
            {viewGrants.data!.map((grant) => (
              <li
                key={grant.companyId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-ink">
                  {grant.company.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-danger"
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
          selecting={selectMode}
          busy={manageBusy || quickUploading}
          canAddToCart={ownerCanAddToCart}
          canShare={ownerCanShare}
          canDelete={ownerCanDelete}
          canRemove={ownerCanRemove}
          onAddDesigns={onOwnerAddDesigns}
          onAddPhotos={onOwnerAddPhotos}
          onReplace={() => setReplaceSheetOpen(true)}
          onAddToCart={addSelectedDesignsToCart}
          onShare={openSelectedDesignsShare}
          onDelete={() => void onOwnerDelete()}
          onRemove={() => void onOwnerRemove()}
        />
      ) : null}

      {packTradeDock ? (
        <BottomTradeDock testId="collection-pack-trade-dock" aboveAppNav={false}>
          <Button
            fullWidth
            onClick={() => {
              setOrderError(null);
              setQtyOpen(true);
            }}
          >
            Order
          </Button>
        </BottomTradeDock>
      ) : null}

      <OwnerPackReplaceSheet
        open={replaceSheetOpen}
        onClose={() => setReplaceSheetOpen(false)}
        onConfirm={onOwnerReplaceConfirm}
      />
      <OwnerPackDeleteSheet
        open={deleteSheetOpen}
        onClose={() => setDeleteSheetOpen(false)}
        busy={manageBusy}
        onDeleteEverywhere={() => void finishOwnerDelete('everywhere')}
        onOnlyThisCollection={() => void finishOwnerDelete('only-here')}
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
          <p className="text-sm text-muted">
            {replaceDraft !== null || replacePending
              ? 'Tap to pick the new set. Done with nothing selected keeps the collection as it is.'
              : 'Tap to add. Added designs show in your album — Done when finished.'}
          </p>
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
                  navigate('/catalog/products/new');
                }}
              >
                Add a design
              </Button>
            </div>
          ) : (
            <>
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
                      : libraryPicks.has(product.id) || memberIdSet.has(product.id);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleOwnerLibraryPick(product.id)}
                      className={cx(
                        'relative aspect-square w-full min-w-0 overflow-hidden rounded-xl border-2 bg-foam text-left',
                        on ? 'border-accent' : 'border-transparent',
                      )}
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-muted">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      {on ? (
                        <span className="absolute right-1 top-1 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                          ✓
                        </span>
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 z-[1] truncate bg-surface/95 px-1.5 py-1 text-sm text-ink">
                        {product.name}
                      </span>
                    </button>
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
          setManageSelected(new Set());
          setPageSelecting(false);
        }}
      />

      {collectionPackQtySheet({ visitor: !isOwner, hasProducts: products.length > 0 }) ? (
        <HowManyEachSheet
          open={qtyOpen}
          onClose={() => setQtyOpen(false)}
          sellerId={data.company.id}
          products={products
            .filter(
              (product) =>
                isPublishedForSelection(product.status) &&
                shortlist.productIds.has(product.id),
            )
            .map((product) => ({
              ...product,
              images: product.images ?? [],
            }))}
          submitting={packOrder.isPending && packOrder.variables?.intent !== OrderIntent.Inquiry}
          asking={false}
          error={orderError}
          orderGoesToName={showHandleCopy ? data.company.name : null}
          sheetJob="order"
          onSendOrder={(lines, place) => {
            setOrderError(null);
            packOrder.mutate({
              intent: OrderIntent.Order,
              lines,
              transporter: place?.transporter,
            });
          }}
          onAskRates={() => {
            /* Album Order path — rates already on pack; Ask rates hidden. */
          }}
        />
      ) : null}

      <ProductPhotosSheet
        product={viewerProduct}
        shopLine={
          viewerProduct
            ? albumTileShopLine({
                mixedSources: isCuratedPack,
                creditMills: creditTileMills,
                shopName: viewerProduct.companyName,
                curatedFrom: viewerProduct.companyId !== data.company.id,
              })
            : null
        }
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerProduct(null)}
        canEdit={
          viewerProduct
            ? collectionOwnerCanEditDesign({
                isOwner,
                myCompanyId: me.data?.id,
                productCompanyId: viewerProduct.companyId,
              })
            : false
        }
        onEdit={() => {
          if (!viewerProduct) return;
          const id = viewerProduct.id;
          setViewerProduct(null);
          navigate(`/catalog/products/${id}`);
        }}
        selectable={canSelectDesigns}
        selected={viewerProduct ? shortlist.productIds.has(viewerProduct.id) : false}
        onToggleSelect={() => {
          if (viewerProduct) {
            if (!shortlist.productIds.has(viewerProduct.id)) setPageSelecting(true);
            toggleProduct(viewerProduct);
          }
        }}
      />
    </div>
  );
}

function AccessPendingCard({
  companyId,
  companyName,
  onOpenChat,
  opening,
}: {
  companyId: string;
  companyName: string;
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
          <p className="text-sm font-semibold text-ink">Waiting for them</p>
          <StatusPill status="pending" />
        </div>
        <p className="text-xs text-muted">
          Asked {companyName} to open this collection. Designs unlock after they Allow in
          chat.
        </p>
      </div>
      <Button onClick={onOpenChat} disabled={opening}>
        {opening ? 'Opening…' : 'Open chat'}
      </Button>
      <Link to={`/company/${companyId}`} className="text-xs font-medium text-accent">
        Request catalog access on their shop
      </Link>
    </Card>
  );
}

function DesignTile({
  product,
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
  selected: boolean;
  selectMode: boolean;
  variant: 'feed' | 'grid';
  shopLine?: string | null;
  unavailableReason?: string;
  onActivate: () => void;
  onOpen?: () => void;
  onLongSelect?: () => void;
}) {
  const image = product.images[0] ?? null;
  const extraPhotos = Math.max(0, product.images.length - 1);
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
  const longPress = useLongPress(onLongSelect);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface text-left">
      <button
        type="button"
        onClick={onActivate}
        className={cx('relative block w-full', LONG_PRESS_SURFACE_CLASS)}
        {...longPress}
      >
        <SelectableMediaFrame
          selectMode={selectMode && !unavailableReason}
          selected={selected}
          checkClassName="right-2 top-2"
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              className={cx(
                designBrowsePhotoClass(variant),
                unavailableReason && 'opacity-45',
              )}
              loading="lazy"
            />
          ) : (
            <div
              className={cx(
                designBrowsePhotoClass(variant, 'placeholder'),
                unavailableReason && 'opacity-45',
              )}
            >
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}
          {rateOverlay ? (
            <span
              className="absolute bottom-2 left-2 z-[1] rounded-md bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white"
              data-testid="collection-tile-rate"
            >
              {rateOverlay}
            </span>
          ) : null}
          {extraPhotos > 0 && !rateOverlay ? (
            <span
              className="absolute bottom-2 left-2 z-[1] rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white"
              data-testid="collection-tile-extra-photos"
            >
              +{extraPhotos}
            </span>
          ) : null}
          {unavailableReason ? (
            <span
              className="absolute left-2 top-2 z-[1] rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white"
              data-testid="collection-member-unavailable"
            >
              {unavailableReason}
            </span>
          ) : null}
        </SelectableMediaFrame>
      </button>
      <button
        type="button"
        onClick={onOpen ?? onActivate}
        data-testid={`collection-design-open-${product.id}`}
        className={cx(
          'block w-full text-left',
          variant === 'feed' ? 'p-3' : 'p-2.5',
        )}
      >
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        {shopLine ? (
          <p
            className={cx(
              'truncate text-xs',
              curatedFrom ? 'font-semibold text-ink' : 'text-muted',
            )}
            data-testid={curatedFrom ? 'collection-design-from' : undefined}
          >
            {shopLine}
          </p>
        ) : null}
        {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
      </button>
    </div>
  );
}

function ProductPhotosSheet({
  product,
  shopLine = null,
  index,
  onIndex,
  onClose,
  canEdit = false,
  onEdit,
  selectable,
  selected,
  onToggleSelect,
}: {
  product: ProductView | null;
  shopLine?: string | null;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  useEffect(() => {
    if (!product) setPhotoOpen(false);
  }, [product]);

  if (!product) return null;
  const urls = product.images;
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const current = urls[safeIndex] ?? null;
  const curatedFrom = Boolean(shopLine?.startsWith('From '));

  return (
    <>
      <Sheet
        open={Boolean(product)}
        onClose={onClose}
        title={product.name}
        footer={
          <div className="flex flex-col gap-2">
            {canEdit && onEdit ? (
              <Button
                variant="primary"
                fullWidth
                data-testid="collection-design-edit"
                onClick={onEdit}
              >
                Edit design
              </Button>
            ) : null}
            <ProductSaveButton productId={product.id} />
            {selectable ? (
              <Button
                variant={selected || canEdit ? 'secondary' : 'primary'}
                fullWidth
                onClick={onToggleSelect}
              >
                {selected ? 'Selected' : 'Select design'}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {shopLine ? (
            <p
              className={cx('text-sm', curatedFrom ? 'font-semibold text-ink' : 'font-medium text-ink')}
              data-testid={curatedFrom ? 'collection-design-from' : undefined}
            >
              {shopLine}
            </p>
          ) : null}
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
          <PackDetailBlocks
            testIdPrefix="collection-design-sheet"
            sections={collectionPackDetailSections({
              categories: product.categories,
              description: product.description,
              rateBand: designSheetRateBand(
                formatCatalogRate({
                  rate: product.rate,
                  rateMax: product.rateMax,
                  unit: product.unit,
                  dispatchUnit: product.dispatchUnit,
                }),
              ),
            })}
          />
          {product.moq != null && product.moq > 0 ? (
            <p className="text-sm font-medium text-ink">Minimum order · {product.moq} pcs</p>
          ) : null}
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

function ProductSaveButton({ productId }: { productId: string }) {
  const save = useSaveToggle(
    { productId },
    {
      toastSaved: 'Bookmarked this design',
      toastRemoved: 'Removed design bookmark',
    },
  );
  return (
    <Button
      variant="secondary"
      fullWidth
      disabled={save.isPending}
      onClick={() => save.toggle()}
    >
      {save.isPending
        ? 'Updating…'
        : save.isSaved
          ? 'Design bookmarked'
          : 'Bookmark this design'}
    </Button>
  );
}
