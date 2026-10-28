import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  CollectionDetailView,
  CompanySettingsView,
  ConnectionView,
  CreateCollectionDto,
  CreateProductDto,
  MasterCategoryView,
  MasterTaxonomyView,
  OtherPackCountsView,
  ProductView,
  PublishCollectionDto,
} from '@ekum/domain-types';
import {
  CatalogOrderMode,
  CollectionKind,
  CollectionStatus,
  MEDIA_VARIANT,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  Unit,
  categoriesToTagSlots,
  createCatalogRateUnit,
  emptyTagSlots,
  pruneOfficialTagsOnCategoryChange,
  tagSlotsToCategories,
  type TagSlots,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { defaultProfileMasterCategoryId } from './companyMasterOptions';
import {
  readCollectionApplyToAll,
  writeCollectionApplyToAll,
} from '@/lib/collectionApplyToAll';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { acquireMediaStream } from '@/lib/mediaSession';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { ContinuousCamera, continuousCameraConstraints } from '@/ui/ContinuousCamera';
import { CappedMediaGrid } from '@/ui/CappedMediaGrid';
import { ManagedImage } from '@/ui/ManagedImage';
import { LibraryPickTile } from './LibraryPickTile';
import { PageHeader } from '@/ui/PageHeader';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import {
  Button,
  Field,
  InfoHint,
  LoadingBlock,
  Sheet,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';
import {
  CATALOG_EXCLUSIVE_NOTE,
  CATALOG_EXCLUSIVE_NOTE_CLASS,
  CATALOG_EXCLUSIVE_NOTE_TEXT_CLASS,
} from '@/features/catalog/catalogExclusiveCopy';
import { CollectionExpandableSection } from './CollectionExpandableSection';
import { ScrollWhenOpened } from '@/ui/scrollWhenOpened';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { OwnerPackManageDock } from '@/features/collections/OwnerPackManageDock';
import {
  BOTTOM_DOCK_CLEARANCE_CLASS,
  BottomTradeDock,
} from '@/features/browse/BottomTradeDock';
import { OwnerPackDeleteSheet } from '@/features/collections/OwnerPackDeleteSheet';
import { OwnerPackReplaceSheet } from '@/features/collections/OwnerPackReplaceSheet';
import {
  canDeleteSelected,
  deleteNeedsMultiPackConfirm,
  membershipAfterRemove,
  membershipForReplaceOrAppend,
  libraryDesignsForPicker,
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
  isGeneralCollection,
  youLibraryHrefAfterPackPublish,
  deletedFromThisPackToast,
  removeFromThisPackLabel,
  removedFromPackToast,
} from '@/features/catalog/youLibraryKind';
import {
  chooseWhoCanSeeThisPack,
  couldNotLoadThisPack,
  createKindFromFlag,
  editPackTitle,
  enterPackNameError,
  missingPackError,
  newPackTitle,
  packNameLabel,
  packNameTakenBody,
  packNameTakenTitle,
  pickWhoCanSeeThisPack,
  publishPackSheetTitle,
  publishThisPackConsent,
  publishingThisPackExplore,
  ratesOnRequestWhenForeign,
  untitledPackFallback,
} from '@/features/catalog/packKindCopy';
import { OwnerPackLifecycleSheet } from '@/features/catalog/OwnerPackLifecycleSheet';
import { invalidateAfterPackMembership } from '@/features/catalog/packMembershipInvalidate';
import {
  alsoDeleteDesignsDefault,
  packDeleteCopy,
  packDraftCopy,
} from '@/features/catalog/ownerPackLifecycle';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import {
  COLLECTION_QUICK_PHOTO_CAP,
  collectionCameraMaxShots,
  collectionNameClash,
  isCollectionCategoryError,
} from './collectionCreateHelpers';
import {
  createProductIdentity,
  nameForNewDesign,
  uniqueDraftSku,
} from './designBatchHelpers';
import {
  applyCollectionRateUnit,
  collectSameForAllDiffIds,
  emptySameForAll,
  preferredPackUnit,
  productFieldsFromMember,
  packMemberProductPatch,
  packStampShared,
  packSellAsFromCollection,
  hydratePackSellAsState,
  storedCatalogRateUnit,
  ownMembersForPackStamp,
  sameForAllSummary,
  sortDiffFirst,
  designFollowsPackRate,
  stampCreatePhotoMemberForm,
  unanimousMemberRate,
  packTagPatchesForOwnDesigns,
  packTagsForMember,
  packTagsPatch,
  type MemberDesignForm,
  type RateConflict,
  type SameForAllDetails,
} from './collectionSameForAll';
import { formatRateInput, parseRateInput } from './rateInput';
import { combineRateInput, splitRateInput } from './rateRange';
import { catalogRateDisplayUnit } from '@/lib/catalogRate';
import { applyDesignRateUnit } from './designEditorDefaults';
import { piecesPerPackFieldValue } from './orderDispatchPreview';
import { GrowingDescriptionField } from './GrowingDescriptionField';
import { RateRangeFields } from './RateRangeFields';
import { CascadeTagsFields } from './CascadeTagsFields';
import { MasterCategoryField } from './MasterCategoryField';
import { ProductDetailsSlots } from './ProductDetailsSlots';
import { OrderDispatchAccordion } from './OrderDispatchAccordion';
import {
  collectionEditShowsMemberGrid,
  collectionEditUpdateDisabled,
} from './collectionEditDetailsOnly';
import { collectionGalleryInputProps } from './collectionGalleryInput';
import { AddDesignsControl } from './AddDesignsControl';
import { CreateAlbumChangeStrip } from './CreateAlbumChangeStrip';
import {
  CAMERA_APPEND_SOFT_MAX,
  morePhotosEntry,
} from './designBatchHelpers';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';
import {
  CameraIcon,
  CheckIcon,
  CollectionIcon,
  LockIcon,
  MegaphoneIcon,
  MoreHorizontalIcon,
  PaperPlaneIcon,
} from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { collectionOwnerSourceLine } from './collectionOwnerSourceLine';
import {
  canSetMemberLiveInPack,
  curatedMemberUnavailableReason,
} from '@/features/collections/curatedMemberAvailability';
import {
  maxPublishAudienceForCuratedPack,
} from './curationAudienceCeiling';
import { audienceForPublishSheet } from './publishAudienceOptions';
import {
  normalizePackDispatchUnit,
  readCompanyPublishDefaults,
  readCompanySellAsUsual,
} from './publishDefaults';
import {
  emptyPublishAudienceState,
  publishAudienceCanSubmit,
  publishAudienceDtoFields,
  PublishAudienceFields,
  restorePublishAudienceState,
  selectCreatedGroup,
  type PublishAudienceState,
} from './PublishAudienceFields';

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const QUICK_PHOTO_CAP = COLLECTION_QUICK_PHOTO_CAP;

type PendingImage = {
  id: string;
  previewUrl: string;
  imageUrl: string | null;
  uploading: boolean;
};

type PendingPhoto = {
  localId: string;
  images: PendingImage[];
  /** Typed display name; blank until they edit — SKU is the fallback name. */
  name: string;
  sku: string;
  rate: string;
  unit: string;
  dispatchUnit: string;
  catalogRateUnit: string;
  piecesPerPack: string;
  moq: string;
  notes: string;
  categories: string[];
  tagsDirty: boolean;
};

type MemberSheetState =
  | { kind: 'pending'; localId: string }
  | { kind: 'product'; productId: string };

type CameraAppendTarget =
  | { kind: 'pending'; localId: string }
  | { kind: 'product'; productId: string };

type MemberPhotoThumb = { id: string; url: string };

function collectionEditorSnapshot(input: {
  name: string;
  description: string;
  coverImage: string;
  categories: string[];
  masterCategoryId: string | null;
  productIds: string[];
  rateFrom: string;
  rateTo: string;
  unit: string;
  dispatchUnit: string;
  catalogRateUnit: string;
  piecesPerPack: string;
  moq: string;
  orderMode: string;
}): string {
  return JSON.stringify(input);
}

export function CollectionEditorPage() {
  const { id: routeId } = useParams();
  /** `/catalog/collections/new` shares `:id` with edit — treat literal `new` as create. */
  const isCreate = !routeId || routeId === 'new';
  const id = isCreate ? undefined : routeId;
  const editing = !isCreate;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const { showToast } = useToast();
  const designFileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSession, setCameraSession] = useState(0);
  const [quickUploading, setQuickUploading] = useState(false);
  const [savingDesigns, setSavingDesigns] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nameClash, setNameClash] = useState<{
    collectionId: string;
    name: string;
    kind?: string;
    publish: boolean;
  } | null>(null);
  const [designSearch, setDesignSearch] = useState('');
  const [manageSelecting, setManageSelecting] = useState(false);
  const [manageSelected, setManageSelected] = useState<Set<string>>(() => new Set());
  const [manageBusy, setManageBusy] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [replaceSheetOpen, setReplaceSheetOpen] = useState(false);
  const [addDesignsOpen, setAddDesignsOpen] = useState(false);
  /** Replace confirmed — wait for a non-empty save before changing membership. */
  const [replacePending, setReplacePending] = useState(false);
  const replacePendingRef = useRef(false);
  /** Library picks while Replace is pending — not toggled against live members. */
  const [replaceDraft, setReplaceDraft] = useState<Set<string> | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverImage: '',
    categories: [] as string[],
    masterCategoryId: null as string | null,
  });
  const [tagSlots, setTagSlotsState] = useState<TagSlots>(() => emptyTagSlots());
  const [memberTagSlots, setMemberTagSlots] = useState<TagSlots>(() => emptyTagSlots());
  const leaveBypassRef = useRef(false);
  /** Repost → Publish: land on My Collections (or Explore when asked). */
  const afterPublishDestRef = useRef<'explore' | 'collections' | null>(null);
  /** Album ⋯ Who has access — leave Edit when Visibility sheet closes. */
  const returnAfterPublishRef = useRef<{ pathname: string; state?: object } | null>(null);
  const bootPickerRef = useRef(false);
  /** Chooser closed because user opened Designs/Photos (do not treat as abandon). */
  const replaceProceedPickRef = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    bootPickerRef.current = false;
  }, [id]);
  const [publishAudience, setPublishAudience] = useState<PublishAudienceState>(() =>
    emptyPublishAudienceState(),
  );
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [evergreen, setEvergreen] = useState(true);
  const [consent, setConsent] = useState(false);
  const [memberSheet, setMemberSheet] = useState<MemberSheetState | null>(null);
  const [memberForm, setMemberForm] = useState<MemberDesignForm>({
    name: '',
    rate: '',
    unit: Unit.Set,
    dispatchUnit: Unit.Set,
    catalogRateUnit: Unit.Piece,
    piecesPerPack: '',
    moq: '',
    notes: '',
    categories: [],
  });
  const [memberPhotos, setMemberPhotos] = useState<MemberPhotoThumb[]>([]);
  const [memberSaving, setMemberSaving] = useState(false);
  const [sameForAll, setSameForAll] = useState<SameForAllDetails>(() =>
    emptySameForAll(Unit.Set),
  );
  const [applyToAll, setApplyToAll] = useState(false);
  const [orderMode, setOrderMode] = useState<string>(CatalogOrderMode.Whole);
  const [packDeleteOpen, setPackDeleteOpen] = useState(false);
  const [packDraftOpen, setPackDraftOpen] = useState(false);
  const [alsoArchiveDesigns, setAlsoArchiveDesigns] = useState(false);
  const [alsoDraftDesigns, setAlsoDraftDesigns] = useState(false);
  const applyToAllHydrated = useRef(false);
  const [rateFrom, setRateFrom] = useState('');
  const [rateTo, setRateTo] = useState('');
  const rateFieldsHydrated = useRef(false);
  /** Create: Rate per stays on the trader’s pick until Category changes. */
  const ratePerTouchedRef = useRef(false);
  const [rateConflicts, setRateConflicts] = useState<RateConflict[] | null>(null);
  const [rateConflictKeepIds, setRateConflictKeepIds] = useState<Set<string>>(new Set());
  const [pendingPublish, setPendingPublish] = useState(false);
  const [whoExpanded, setWhoExpanded] = useState(false);
  const [orderDispatchExpanded, setOrderDispatchExpanded] = useState(false);
  const [memberOrderDispatchOpen, setMemberOrderDispatchOpen] = useState(false);
  const [defaultsPrefillDone, setDefaultsPrefillDone] = useState(false);
  const cameraAppendRef = useRef<CameraAppendTarget | null>(null);
  const [cameraAppend, setCameraAppend] = useState<CameraAppendTarget | null>(null);
  const resumeMemberSheetRef = useRef<MemberSheetState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSnapshotRef = useRef<string | null>(null);
  /** Identity from GET once per collection — refetch must not wipe a typed name. */
  const identityHydratedId = useRef<string | null>(null);

  useEffect(() => {
    identityHydratedId.current = null;
    rateFieldsHydrated.current = false;
    ratePerTouchedRef.current = false;
  }, [id]);
  /** Create mode: photos and/or library designs; Publish/Share after create. */
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [libraryPicks, setLibraryPicks] = useState<Set<string>>(new Set());
  const [createMembersExpanded, setCreateMembersExpanded] = useState(false);
  /** Members present when Add designs opened — hide them for the session (not Replace). */
  const [libraryExcludeIds, setLibraryExcludeIds] = useState<Set<string>>(() => new Set());

  const existing = useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.get<CollectionDetailView>(`/collections/${id}`),
    enabled: editing,
  });
  const myProducts = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
  });
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: publishOpen || whoExpanded || isCreate,
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled:
      editing ||
      isCreate ||
      (publishOpen && publishAudience.audience === PublishAudience.Selected),
  });
  const masterCategoriesQuery = useQuery({
    queryKey: ['catalog-master-categories'],
    queryFn: () => api.get<MasterCategoryView[]>('/catalog/master-categories'),
    staleTime: 60_000,
  });
  const catalogMasterOptions = masterCategoriesQuery.data ?? [];
  const profileMasterDefaultId = useMemo(
    () =>
      defaultProfileMasterCategoryId(
        masterCategoriesQuery.data,
        company.data?.masterCategories,
        company.data?.superCategories,
      ),
    [
      masterCategoriesQuery.data,
      company.data?.masterCategories,
      company.data?.superCategories,
    ],
  );

  useEffect(() => {
    if (form.masterCategoryId) return;
    if (profileMasterDefaultId) {
      setForm((prev) => ({ ...prev, masterCategoryId: profileMasterDefaultId }));
    }
  }, [profileMasterDefaultId, form.masterCategoryId]);

  const masterTaxonomy = useQuery({
    queryKey: ['catalog-master-taxonomy', form.masterCategoryId],
    queryFn: () =>
      api.get<MasterTaxonomyView>(
        `/catalog/master-taxonomy?categoryId=${encodeURIComponent(form.masterCategoryId!)}`,
      ),
    enabled: Boolean(form.masterCategoryId),
    staleTime: 60_000,
  });
  const permittedUnits = masterTaxonomy.data?.units ?? [];

  useEffect(() => {
    if (!isCreate) return;
    const next = createCatalogRateUnit({
      isCreate: true,
      permitted: permittedUnits,
      current: sameForAll.catalogRateUnit,
      userTouched: ratePerTouchedRef.current,
    });
    if (!next) return;
    setSameForAll((prev) => applyCollectionRateUnit(prev, next));
  }, [isCreate, permittedUnits, sameForAll.catalogRateUnit]);

  const packRateUnit =
    sameForAll.catalogRateUnit.trim() ||
    (catalogRateDisplayUnit({
      unit: sameForAll.unit || Unit.Set,
      dispatchUnit: sameForAll.dispatchUnit || Unit.Set,
      catalogRateUnit: sameForAll.catalogRateUnit,
      offeredRateUnits: permittedUnits.length > 0 ? permittedUnits : undefined,
    }) ??
      Unit.Piece);
  const packSharedDetails = (packRate: string): SameForAllDetails =>
    packStampShared(sameForAll, packRate);

  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: publishOpen || isCreate || editing,
  });

  const canPublishAlready = Boolean(company.data?.capabilities.publish);
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');
  const status = existing.data?.status;
  const isPublished = status === CollectionStatus.Published;
  const isDraft =
    status === CollectionStatus.Draft || status === CollectionStatus.Ready;
  const isArchived = status === CollectionStatus.Archived;
  const ownerSourceLine =
    existing.data && company.data?.id
      ? collectionOwnerSourceLine(
          company.data.id,
          existing.data.memberShops?.length
            ? existing.data.memberShops
            : (existing.data.products ?? []).map((product) => ({
                id: product.companyId,
                name: product.companyName ?? '',
              })),
        )
      : null;

  const selectableDesigns = (myProducts.data ?? []).filter(
    (product) => product.status !== ProductStatus.Archived,
  );
  const libraryPickerMode = replaceDraft !== null ? 'replace' : 'add';
  const isCatalog =
    (isCreate && searchParams.get('kind') === 'catalog') ||
    isCatalogCollection(existing.data?.kind);
  const packKind = isCatalog ? 'catalog' : 'regular';
  const copyKind = existing.data?.kind ?? createKindFromFlag(isCatalog);
  const pickerDesigns = libraryDesignsForPicker(
    libraryDesignsEligibleForPack(selectableDesigns, packKind),
    libraryExcludeIds,
    libraryPickerMode,
  );
  const isGeneral = isGeneralCollection(existing.data?.kind);
  const designQuery = designSearch.trim().toLowerCase();
  const filteredDesigns = designQuery
    ? pickerDesigns.filter((p) => p.name.toLowerCase().includes(designQuery))
    : pickerDesigns;
  /** Prefer collection-detail members (includes foreign curated designs) over own library. */
  const selectedProducts = useMemo(() => {
    const byId = new Map<string, ProductView>();
    for (const product of selectableDesigns) {
      byId.set(product.id, product);
    }
    for (const product of existing.data?.products ?? []) {
      byId.set(product.id, product);
    }
    return [...selected]
      .map((productId) => byId.get(productId))
      .filter((product): product is ProductView => Boolean(product));
  }, [selectableDesigns, existing.data?.products, selected]);
  const hasForeignMembers = useMemo(() => {
    const ownerId = company.data?.id;
    if (!ownerId) return false;
    return selectedProducts.some((product) => product.companyId !== ownerId);
  }, [selectedProducts, company.data?.id]);
  const memberSheetCanSetLive = useMemo(() => {
    if (memberSheet?.kind !== 'product') return false;
    const product =
      selectedProducts.find((p) => p.id === memberSheet.productId) ??
      selectableDesigns.find((p) => p.id === memberSheet.productId);
    if (!product) return false;
    return canSetMemberLiveInPack({
      packPublished: isPublished,
      productStatus: product.status,
      productCompanyId: product.companyId,
      ownerCompanyId: company.data?.id,
    });
  }, [
    memberSheet,
    selectedProducts,
    selectableDesigns,
    isPublished,
    company.data?.id,
  ]);
  const canPublishAlbum = selected.size >= 1;
  const readyCreatePhotos = useMemo(
    () =>
      pendingPhotos.filter(
        (p) =>
          p.images.length > 0 &&
          p.images.every((img) => img.imageUrl) &&
          !p.images.some((img) => img.uploading),
      ),
    [pendingPhotos],
  );
  const createLibraryDesigns = useMemo(
    () => selectableDesigns.filter((p) => libraryPicks.has(p.id)),
    [selectableDesigns, libraryPicks],
  );
  const memberDiffSources = editing ? selectedProducts : createLibraryDesigns;
  const diffIds = useMemo(() => {
    const members: Array<{ id: string; form: MemberDesignForm }> = [
      ...pendingPhotos.map((photo) => ({
        id: photo.localId,
        form: {
          name: nameForNewDesign(photo.name, photo.sku),
          rate: photo.rate,
          unit: photo.unit,
          dispatchUnit: photo.dispatchUnit,
          catalogRateUnit: photo.catalogRateUnit,
          piecesPerPack: photo.piecesPerPack,
          moq: photo.moq,
          notes: photo.notes,
          categories: photo.tagsDirty
            ? photo.categories
            : packTagsForMember(photo.categories, form.categories),
        },
      })),
      ...memberDiffSources.map((product) => ({
        id: product.id,
        form: {
          name: product.name,
          rate: formatRateInput(product.rate, product.rateMax ?? null),
          unit: product.unit || Unit.Set,
          dispatchUnit: normalizePackDispatchUnit(
            product.unit || Unit.Set,
            product.dispatchUnit || Unit.Set,
          ),
          catalogRateUnit: storedCatalogRateUnit(product),
          piecesPerPack: piecesPerPackFieldValue(product.piecesPerPack),
          moq: product.moq != null ? String(product.moq) : '',
          notes: product.description ?? '',
          categories: product.categories ?? [],
        },
      })),
    ];
    return collectSameForAllDiffIds(sameForAll, members);
  }, [
    pendingPhotos,
    memberDiffSources,
    sameForAll,
    form.categories,
  ]);
  const ceilingMembers = editing ? selectedProducts : createLibraryDesigns;
  const maxCuratedAudience = useMemo(
    () => maxPublishAudienceForCuratedPack(company.data?.id, ceilingMembers),
    [company.data?.id, ceilingMembers],
  );
  const createMemberCount = readyCreatePhotos.length + createLibraryDesigns.length;
  const hasCreateMembers =
    pendingPhotos.length > 0 ||
    createLibraryDesigns.length > 0 ||
    (editing && selectedProducts.length > 0);

  useEffect(() => {
    if (!hasCreateMembers) setCreateMembersExpanded(false);
  }, [hasCreateMembers]);
  const createCoverUrl =
    readyCreatePhotos[0]?.images[0]?.imageUrl ??
    createLibraryDesigns[0]?.images[0] ??
    undefined;

  useEffect(() => {
    if (existing.data) {
      const loadedCategories = existing.data.categories ?? [];
      const firstLoad = identityHydratedId.current !== existing.data.id;
      identityHydratedId.current = existing.data.id;
      setSelected(new Set(existing.data.products.map((product) => product.id)));
      if (!firstLoad) return;
      setForm({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
        categories: loadedCategories,
        masterCategoryId: existing.data.masterCategoryId ?? null,
      });
      setTagSlotsState(categoriesToTagSlots(loadedCategories));
      // Pack rate lives on the collection; fall back to unanimous members for older packs.
      const loadedRate =
        existing.data.rate != null
          ? formatRateInput(existing.data.rate, existing.data.rateMax ?? null)
          : unanimousMemberRate(existing.data.products);
      if (loadedRate || !rateFieldsHydrated.current) {
        const rateParts = splitRateInput(loadedRate);
        setRateFrom(rateParts.from);
        setRateTo(rateParts.to);
        rateFieldsHydrated.current = true;
      }
      const first = existing.data.products[0];
      const sellAs = packSellAsFromCollection(existing.data, first);
      const sellAsDispatch = normalizePackDispatchUnit(sellAs.unit, sellAs.dispatchUnit);
      // Pure updater — a ref gate inside setState dropped mtr/47 on Strict Mode’s second call.
      setSameForAll((prev) =>
        hydratePackSellAsState(
          prev,
          {
            unit: sellAs.unit,
            dispatchUnit: sellAsDispatch,
            catalogRateUnit: sellAs.catalogRateUnit,
            piecesPerPack: sellAs.piecesPerPack,
          },
          {
            rate: loadedRate,
            moq: first?.moq != null ? String(first.moq) : '',
          },
        ),
      );
      setPublishAudience(
        restorePublishAudienceState({
          audience: existing.data.audience || PublishAudience.Followers,
          audienceCompanyIds: existing.data.audienceCompanyIds ?? [],
          audienceGroupIds: existing.data.audienceGroupIds ?? [],
          rateVisibility: existing.data.rateVisibility,
          allowForward: existing.data.allowForward !== false,
          allowDownload: existing.data.allowDownload === true,
          showSourceShops: existing.data.showSourceShops === true,
        }),
      );
      setStartsAt(toDateInput(existing.data.startsAt));
      setEndsAt(toDateInput(existing.data.endsAt));
      setEvergreen(!existing.data.endsAt);
      if (
        existing.data.orderMode === CatalogOrderMode.Pick ||
        existing.data.orderMode === CatalogOrderMode.Whole
      ) {
        setOrderMode(existing.data.orderMode);
      }
      savedSnapshotRef.current = collectionEditorSnapshot({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
        categories: existing.data.categories ?? [],
        masterCategoryId: existing.data.masterCategoryId ?? null,
        productIds: existing.data.products.map((product) => product.id).sort(),
        rateFrom: splitRateInput(loadedRate).from,
        rateTo: splitRateInput(loadedRate).to,
        unit: sellAs.unit,
        dispatchUnit: sellAsDispatch,
        catalogRateUnit: sellAs.catalogRateUnit,
        piecesPerPack: sellAs.piecesPerPack,
        moq: first?.moq != null ? String(first.moq) : '',
        orderMode: existing.data.orderMode ?? CatalogOrderMode.Whole,
      });
    }
  }, [existing.data]);

  useEffect(() => {
    if (!company.data?.id || applyToAllHydrated.current) return;
    applyToAllHydrated.current = true;
    setApplyToAll(readCollectionApplyToAll(company.data.id));
  }, [company.data?.id]);

  const setApplyToAllRemembered = (next: boolean) => {
    setApplyToAll(next);
    writeCollectionApplyToAll(company.data?.id, next);
  };

  useEffect(() => {
    if (!isCreate || defaultsPrefillDone || !settings.data) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    const sell = readCompanySellAsUsual(settings.data.tradeDefaults);
    setPublishAudience(emptyPublishAudienceState(usual));
    // Merge habitual units only — never wipe a rate the trader already typed.
    // First hydrate: Catalog sell-as wins over platform seed (set + set; rate pc).
    setSameForAll((prev) => ({
      ...prev,
      unit: sell.unit || prev.unit || Unit.Set,
      dispatchUnit: sell.dispatchUnit || prev.dispatchUnit || Unit.Set,
      piecesPerPack: prev.piecesPerPack || sell.piecesPerPack,
      moq: prev.moq || sell.moq,
    }));
    setDefaultsPrefillDone(true);
  }, [isCreate, defaultsPrefillDone, settings.data]);

  useEffect(() => {
    if (!publishOpen || !settings.data) return;
    if (existing.data?.status === CollectionStatus.Published) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    setPublishAudience((prev) => ({
      ...prev,
      // Curated packs default rates to on request (source ceiling).
      rateVisibility: hasForeignMembers
        ? RateVisibility.OnRequest
        : usual.rateVisibility,
      allowForward: usual.allowForward,
      allowDownload: usual.allowDownload,
      policyHint: hasForeignMembers
        ? ratesOnRequestWhenForeign(copyKind)
        : null,
    }));
  }, [publishOpen, settings.data, existing.data?.status, hasForeignMembers]);

  useEffect(() => {
    if (!publishOpen || !maxCuratedAudience) return;
    setPublishAudience((prev) => {
      const nextAudience = audienceForPublishSheet(prev.audience, maxCuratedAudience);
      if (nextAudience === prev.audience) return prev;
      return {
        ...prev,
        audience: nextAudience,
        ...(nextAudience !== PublishAudience.Selected
          ? {
              selectedGroupIds: [],
              pickCompanies: false,
              audienceCompanies: new Set<string>(),
            }
          : {}),
      };
    });
  }, [publishOpen, maxCuratedAudience]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    const state = location.state as {
      notice?: string;
      openPublish?: boolean;
      afterPublish?: 'explore' | 'collections';
      returnTo?: string;
      returnState?: object;
    } | null;
    if (!state?.notice && !state?.openPublish) return;
    if (state.notice) showToast(state.notice);
    if (state.openPublish) {
      setPublishOpen(true);
      if (typeof state.returnTo === 'string' && state.returnTo.startsWith('/')) {
        returnAfterPublishRef.current = {
          pathname: state.returnTo,
          state: state.returnState ?? {},
        };
      }
    }
    if (state.afterPublish === 'explore' || state.afterPublish === 'collections') {
      afterPublishDestRef.current = state.afterPublish;
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, showToast]);

  const closePublishSheet = () => {
    if (creating) return;
    setPublishOpen(false);
    setSheetError(null);
    const back = returnAfterPublishRef.current;
    if (!back) return;
    returnAfterPublishRef.current = null;
    leaveBypassRef.current = true;
    navigate(back.pathname, { replace: true, state: back.state });
  };

  const invalidate = (_collectionId?: string) => {
    invalidateAfterPackMembership(queryClient);
    void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  };

  const persistDesigns = async (
    productIds: string[],
    collectionId = id,
    opts?: { skipInvalidate?: boolean },
  ) => {
    if (isGeneral) return true;
    if (!collectionId) return false;
    setSavingDesigns(true);
    try {
      await api.put(`/collections/${collectionId}/products`, { productIds });
      try {
        const byId = new Map<string, ProductView>();
        for (const product of selectableDesigns) byId.set(product.id, product);
        for (const product of existing.data?.products ?? []) byId.set(product.id, product);
        for (const product of selectedProducts) byId.set(product.id, product);
        const listed = productIds
          .map((productId) => byId.get(productId))
          .filter((product): product is ProductView => Boolean(product));
        for (const row of packTagPatchesForOwnDesigns(
          listed,
          form.categories,
          company.data?.id,
        )) {
          await api.patch(`/products/${row.id}`, { categories: row.categories });
        }
      } finally {
        if (!opts?.skipInvalidate) {
          await invalidateAfterPackMembership(queryClient);
          void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
        }
      }
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update designs.';
      showToast(message, 'danger');
      return false;
    } finally {
      setSavingDesigns(false);
    }
  };

  const setMemberLiveInPack = async () => {
    if (!id || !isPublished) return;
    const saved = await persistDesigns([...selected]);
    if (!saved) return;
    showToast('Published');
    setMemberSheet(null);
  };

  const scheduleDesignSave = (next: Set<string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDesigns([...next]);
    }, 350);
  };

  const schedulePayload = () => ({
    startsAt: startsAt || null,
    endsAt: evergreen ? null : endsAt || null,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (isGeneral) {
        await api.patch<CollectionDetailView>(`/collections/${id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        return { unpublishedOwn: 0, designsFailed: false as const };
      }
      const packRate = combineRateInput(rateFrom, rateTo).trim();
      const packParsed = parseRateInput(packRate);
      const packSharedForDto = packStampShared(sameForAll, packRate);
      const sellAs = productFieldsFromMember({
        name: form.name,
        rate: packSharedForDto.rate,
        unit: packSharedForDto.unit,
        dispatchUnit: packSharedForDto.dispatchUnit,
        catalogRateUnit: packSharedForDto.catalogRateUnit,
        piecesPerPack: packSharedForDto.piecesPerPack,
        moq: packSharedForDto.moq,
        notes: packSharedForDto.notes,
        categories: [],
      });
      const dto: CreateCollectionDto = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        categories: form.categories,
        masterCategoryId: form.masterCategoryId,
        rate: packParsed.rate,
        rateMax: packParsed.rateMax,
        unit: sellAs.unit ?? null,
        dispatchUnit: sellAs.dispatchUnit ?? null,
        catalogRateUnit: sellAs.catalogRateUnit ?? null,
        piecesPerPack: sellAs.piecesPerPack ?? null,
        ...(isCatalog ? { orderMode: orderMode as 'whole' | 'pick' } : {}),
      };
      await api.patch<CollectionDetailView>(`/collections/${id}`, dto);
      const ownerCompanyId = existing.data?.companyId ?? company.data?.id;
      const unpublishedOwn = selectedProducts.filter(
        (product) =>
          product.status === ProductStatus.Draft && product.companyId === ownerCompanyId,
      ).length;
      const previousPackRate = formatRateInput(
        existing.data?.rate ?? null,
        existing.data?.rateMax ?? null,
      );
      const packShared: SameForAllDetails = packSharedDetails(packRate);
      // Stamp Rate per + 1 set contains before membership PUT — that rewrite
      // used to abort this loop, so Update looked saved while units vanished.
      for (const product of ownMembersForPackStamp(selectedProducts, ownerCompanyId)) {
        const parsed = productFieldsFromMember({
          name: product.name,
          rate: packShared.rate,
          unit: packShared.unit,
          dispatchUnit: packShared.dispatchUnit,
          catalogRateUnit: packShared.catalogRateUnit,
          piecesPerPack: packShared.piecesPerPack,
          moq: packShared.moq,
          notes: packShared.notes,
          categories: [],
        });
        const patch = packMemberProductPatch({
          parsed,
          followsPackRate: designFollowsPackRate(
            { rate: product.rate, rateMax: product.rateMax },
            previousPackRate,
            packRate,
          ),
          packRate,
          applyToAll,
        });
        if (Object.keys(patch).length === 0) continue;
        await api.patch(`/products/${product.id}`, patch);
      }
      const saved = await persistDesigns([...selected], id, { skipInvalidate: true });
      if (!saved) {
        return { unpublishedOwn: 0, designsFailed: true as const };
      }
      return { unpublishedOwn, designsFailed: false as const };
    },
    onSuccess: ({ unpublishedOwn, designsFailed }) => {
      if (designsFailed) return;
      savedSnapshotRef.current = collectionEditorSnapshot({
        name: form.name,
        description: form.description,
        coverImage: form.coverImage,
        categories: form.categories,
        masterCategoryId: form.masterCategoryId,
        productIds: [...selected].sort(),
        rateFrom,
        rateTo,
        unit: sameForAll.unit,
        dispatchUnit: sameForAll.dispatchUnit,
        catalogRateUnit: sameForAll.catalogRateUnit,
        piecesPerPack: sameForAll.piecesPerPack,
        moq: sameForAll.moq,
        orderMode,
      });
      invalidate();
      showToast(unpublishedOwn > 0 ? 'Published' : 'Updated');
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not save.';
      setError(message);
      showToast(message, 'danger');
    },
  });

  const publish = useMutation({
    mutationFn: () => {
      if (!id) throw new Error(missingPackError(copyKind));
      const dto: PublishCollectionDto = {
        audience: publishAudience.audience as PublishCollectionDto['audience'],
        rateVisibility: publishAudience.rateVisibility as PublishCollectionDto['rateVisibility'],
        allowForward: publishAudience.allowForward,
        allowDownload: publishAudience.allowDownload,
        showSourceShops: hasForeignMembers ? publishAudience.showSourceShops : false,
        ...publishAudienceDtoFields(publishAudience),
        ...(canPublishAlready ? {} : { consentToSell: true }),
        ...schedulePayload(),
      };
      return api.post(`/collections/${id}/publish`, dto);
    },
    onSuccess: () => {
      setPublishOpen(false);
      setSheetError(null);
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      const scheduled = Boolean(startsAt && new Date(startsAt) > new Date());
      const afterDest = afterPublishDestRef.current;
      afterPublishDestRef.current = null;
      if (afterDest && !isPublished && !scheduled) {
        returnAfterPublishRef.current = null;
        leaveBypassRef.current = true;
        showToast(
          !publishAudience.allowForward ? 'Buyers can’t forward this.' : 'Published',
        );
        if (afterDest === 'collections') {
          navigate(youLibraryHrefAfterPackPublish(isCatalog ? 'catalog' : 'regular'), {
            replace: true,
            state: { collectionFilter: 'published', productFilter: 'published' },
          });
        } else {
          navigate('/explore', { replace: true });
        }
        return;
      }
      if (!publishAudience.allowForward) {
        showToast('Buyers can’t forward this.');
      } else {
        showToast(
          isPublished
            ? 'Visibility updated'
            : scheduled
              ? `Scheduled for ${startsAt}`
              : 'Published',
        );
      }
      const back = returnAfterPublishRef.current;
      if (back) {
        returnAfterPublishRef.current = null;
        leaveBypassRef.current = true;
        navigate(back.pathname, { replace: true, state: back.state });
      }
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not publish.';
      setSheetError(message);
      showToast(message, 'danger');
    },
  });

  const lifecycle = useMutation({
    mutationFn: (input: {
      action: 'unpublish' | 'archive';
      alsoArchiveDesigns?: boolean;
      alsoDraftDesigns?: boolean;
    }) =>
      api.post(`/collections/${id}/${input.action}`, {
        alsoArchiveDesigns: input.alsoArchiveDesigns,
        alsoDraftDesigns: input.alsoDraftDesigns,
      }),
    onSuccess: (_data, input) => {
      setMoreOpen(false);
      setPackDeleteOpen(false);
      setPackDraftOpen(false);
      invalidate();
      showToast(input.action === 'archive' ? 'Deleted' : 'Draft');
      closePublishSheet();
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not update status.';
      showToast(message, 'danger');
    },
  });

  /** Sync click — same user gesture (Photos row / Gallery handoff). */
  const clickCollectionGallery = () => {
    designFileRef.current?.click();
  };

  /** After async camera failure — gesture may already be gone. */
  const openCollectionGalleryDeferred = () => {
    setError(null);
    queueMicrotask(() => clickCollectionGallery());
  };

  /**
   * Camera UI only after getUserMedia succeeds — never paint the black shell
   * then bounce to gallery on permission/device failure.
   */
  const openCollectionCamera = (append: CameraAppendTarget | null = null) => {
    if (!append && pendingPhotos.length >= QUICK_PHOTO_CAP && !editing) {
      setError(`You can add up to ${QUICK_PHOTO_CAP} photos.`);
      return;
    }
    setError(null);
    cameraAppendRef.current = append;
    setCameraAppend(append);
    void (async () => {
      const acquired = await acquireMediaStream('camera', continuousCameraConstraints);
      if (!acquired.ok) {
        setError(acquired.message);
        openCollectionGalleryDeferred();
        return;
      }
      setCameraSession((n) => n + 1);
      setCameraOpen(true);
    })();
  };

  /** Existing designs only — never acquires the camera. */
  const openLibraryDesigns = () => {
    setError(null);
    if (replacePendingRef.current) {
      setReplaceDraft(new Set());
      setLibraryExcludeIds(new Set());
    } else {
      setLibraryExcludeIds(editing ? new Set(selected) : new Set());
    }
    setLibraryOpen(true);
  };

  /** Photos = OS gallery only (no ContinuousCamera flash). */
  const openPhotos = (_append: CameraAppendTarget | null = null) => {
    setError(null);
    if (_append) {
      cameraAppendRef.current = _append;
      setCameraAppend(_append);
    }
    clickCollectionGallery();
  };

  const openAddDesignsMenu = () => {
    setError(null);
    setAddDesignsOpen(true);
  };

  const setReplacePendingFlag = (next: boolean) => {
    replacePendingRef.current = next;
    setReplacePending(next);
  };

  const beginReplacePick = () => {
    setReplaceSheetOpen(true);
  };

  const beginReplaceFromDesigns = () => {
    setReplaceSheetOpen(false);
    setReplacePendingFlag(true);
    openLibraryDesigns();
  };

  const beginReplaceFromPhotos = () => {
    setReplaceSheetOpen(false);
    setReplacePendingFlag(true);
    setReplaceDraft(null);
    openPhotos();
  };

  const abandonReplaceIfPending = () => {
    setReplacePendingFlag(false);
    setReplaceDraft(null);
  };

  const pickSourceDesigns = () => {
    openLibraryDesigns();
  };

  const pickSourcePhotos = () => {
    openCollectionCamera();
  };

  useEffect(() => {
    if (!editing || !existing.data || !id || bootPickerRef.current) return;
    const boot = location.state as {
      openDesignPicker?: boolean;
      replaceThenPick?: boolean;
    } | null;
    if (!boot?.openDesignPicker && !boot?.replaceThenPick) return;
    bootPickerRef.current = true;
    navigate(location.pathname, { replace: true, state: {} });
    if (boot.replaceThenPick) {
      beginReplacePick();
      return;
    }
    setReplacePendingFlag(false);
    setReplaceDraft(null);
    openPhotos();
  }, [editing, existing.data, id, location.state, location.pathname, navigate]);

  const restoreMemberSheetAfterCamera = () => {
    const resume = resumeMemberSheetRef.current;
    resumeMemberSheetRef.current = null;
    if (resume) setMemberSheet(resume);
  };

  const openMorePhotosForMember = () => {
    if (!memberSheet) return;
    const phone = isPhoneLike();
    const entry = morePhotosEntry(phone);
    resumeMemberSheetRef.current = memberSheet;
    setMemberSheet(null);
    const append: CameraAppendTarget =
      memberSheet.kind === 'pending'
        ? { kind: 'pending', localId: memberSheet.localId }
        : { kind: 'product', productId: memberSheet.productId };
    if (entry === 'camera') {
      openCollectionCamera(append);
      return;
    }
    cameraAppendRef.current = append;
    setCameraAppend(append);
    clickCollectionGallery();
  };

  const appendFilesToPending = async (localId: string, files: File[]) => {
    if (!files.length) return;
    const stubs: PendingImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      imageUrl: null,
      uploading: true,
    }));
    setPendingPhotos((prev) =>
      prev.map((p) =>
        p.localId === localId ? { ...p, images: [...p.images, ...stubs] } : p,
      ),
    );
    setQuickUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const stub = stubs[i]!;
        try {
          const imageUrl = await uploadImage(file);
          setPendingPhotos((prev) =>
            prev.map((p) =>
              p.localId !== localId
                ? p
                : {
                    ...p,
                    images: p.images.map((img) =>
                      img.id === stub.id ? { ...img, imageUrl, uploading: false } : img,
                    ),
                  },
            ),
          );
        } catch {
          setPendingPhotos((prev) =>
            prev.map((p) =>
              p.localId !== localId
                ? p
                : { ...p, images: p.images.filter((img) => img.id !== stub.id) },
            ),
          );
          URL.revokeObjectURL(stub.previewUrl);
          setError('Could not upload one of the photos.');
        }
      }
    } finally {
      setQuickUploading(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  const appendFilesToProduct = async (productId: string, files: File[]) => {
    if (!files.length) return;
    setQuickUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadImage(file));
      }
      const product =
        selectedProducts.find((p) => p.id === productId) ??
        selectableDesigns.find((p) => p.id === productId);
      const nextImages = [...(product?.images ?? memberPhotos.map((m) => m.url)), ...urls];
      await api.patch(`/products/${productId}`, { images: nextImages });
      setMemberPhotos((prev) => [
        ...prev,
        ...urls.map((url) => ({ id: crypto.randomUUID(), url })),
      ]);
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      void queryClient.invalidateQueries({ queryKey: ['collection', id] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add photos.');
    } finally {
      setQuickUploading(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  const ingestPhotoFiles = async (files: File[]) => {
    if (!files.length) return;
    const append = cameraAppendRef.current ?? cameraAppend;
    cameraAppendRef.current = null;
    setCameraAppend(null);
    if (append?.kind === 'pending') {
      await appendFilesToPending(append.localId, files);
      restoreMemberSheetAfterCamera();
      return;
    }
    if (append?.kind === 'product') {
      await appendFilesToProduct(append.productId, files);
      restoreMemberSheetAfterCamera();
      return;
    }
    if (!editing) {
      await onCreatePhotoFiles(files);
      return;
    }
    await onEditQuickDesignFiles(files);
  };

  const onCreatePhotoFiles = async (files: File[]) => {
    const room = QUICK_PHOTO_CAP - pendingPhotos.length;
    if (room <= 0) {
      setError(`You can add up to ${QUICK_PHOTO_CAP} photos.`);
      return;
    }
    const selected = files.slice(0, room);
    setError(null);
    const shared = sameForAll;
    const takenSkus = pendingPhotos.map((p) => p.sku);
    const stubs: PendingPhoto[] = selected.map((file) => {
      const sku = uniqueDraftSku(takenSkus);
      takenSkus.push(sku);
      return {
        localId: crypto.randomUUID(),
        images: [
          {
            id: crypto.randomUUID(),
            previewUrl: URL.createObjectURL(file),
            imageUrl: null,
            uploading: true,
          },
        ],
        name: '',
        sku,
        rate: shared.rate,
        unit: shared.unit || Unit.Set,
        dispatchUnit: shared.dispatchUnit || Unit.Set,
        catalogRateUnit: shared.catalogRateUnit || Unit.Piece,
        piecesPerPack: shared.piecesPerPack,
        moq: shared.moq,
        notes: shared.notes,
        categories: [],
        tagsDirty: false,
      };
    });
    setPendingPhotos((prev) => [...prev, ...stubs]);
    setQuickUploading(true);
    try {
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i]!;
        const stub = stubs[i]!;
        const imgId = stub.images[0]!.id;
        try {
          const imageUrl = await uploadImage(file);
          setPendingPhotos((prev) =>
            prev.map((p) =>
              p.localId !== stub.localId
                ? p
                : {
                    ...p,
                    images: p.images.map((img) =>
                      img.id === imgId ? { ...img, imageUrl, uploading: false } : img,
                    ),
                  },
            ),
          );
        } catch {
          setPendingPhotos((prev) => prev.filter((p) => p.localId !== stub.localId));
          URL.revokeObjectURL(stub.images[0]!.previewUrl);
          setError('Could not upload one of the photos.');
        }
      }
    } finally {
      setQuickUploading(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  const onEditQuickDesignFiles = async (files: File[]) => {
    if (!id || !files.length) return;
    const picked = files.slice(0, QUICK_PHOTO_CAP);
    const replacing = replacePendingRef.current;
    setError(null);
    setQuickUploading(true);
    try {
      const createdIds: string[] = [];
      const shared = sameForAll;
      const takenSkus: string[] = [];
      for (const file of picked) {
        const imageUrl = await uploadImage(file);
        const identity = createProductIdentity(uniqueDraftSku(takenSkus));
        takenSkus.push(identity.sku);
        const categories = packTagsForMember([], form.categories);
        const parsed = productFieldsFromMember({
          name: identity.name,
          rate: shared.rate,
          unit: shared.unit || Unit.Set,
          dispatchUnit: shared.dispatchUnit || Unit.Set,
          catalogRateUnit: shared.catalogRateUnit || Unit.Piece,
          piecesPerPack: shared.piecesPerPack,
          moq: shared.moq,
          notes: shared.notes,
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
      const nextIds = membershipForReplaceOrAppend([...selected], createdIds, replacing);
      if (nextIds === null) {
        abandonReplaceIfPending();
        return;
      }
      if (replacing) {
        setReplacePendingFlag(false);
        setReplaceDraft(null);
      }
      const next = new Set(nextIds);
      setSelected(next);
      const saved = await persistDesigns([...next]);
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      if (saved && isPublished) {
        showToast('Published');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add photos.');
    } finally {
      setQuickUploading(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  const onQuickDesignFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    await ingestPhotoFiles([...fileList]);
  };

  const onCreate = async (opts?: { publish?: boolean; keepRateIds?: Set<string> }) => {
    if (pendingPhotos.some((p) => p.images.some((img) => img.uploading))) {
      setError('Wait for photos to finish uploading.');
      return;
    }
    if (opts?.publish) {
      if (createMemberCount < 1) {
        setError('Add photos or pick designs.');
        return;
      }
      if (!form.name.trim()) {
        setError(enterPackNameError(copyKind));
        return;
      }
      if (!form.masterCategoryId && catalogMasterOptions.length > 0) {
        setError('Pick a category.');
        return;
      }
      const canPublishCreate =
        (canPublishAlready || consent) && publishAudienceCanSubmit(publishAudience);
      if (!canPublishCreate) {
        setSheetError(chooseWhoCanSeeThisPack(copyKind));
        setCreating(false);
        return;
      }
    }
    const keepRateIds = opts?.keepRateIds ?? rateConflictKeepIds;
    const packRate = combineRateInput(rateFrom, rateTo);
    setCreating(true);
    setError(null);
    setSheetError(null);
    try {
      await completeCreate({
        collectionId: undefined,
        name: form.name.trim(),
        publish: Boolean(opts?.publish),
        keepRateIds,
        packRate,
      });
    } catch (err) {
      const clash = collectionNameClash(err instanceof ApiError ? err : {});
      if (clash) {
        setNameClash({ ...clash, publish: Boolean(opts?.publish) });
        return;
      }
      const message =
        err instanceof ApiError ? err.message : (err as Error).message || 'Could not create.';
      if (opts?.publish || publishOpen) {
        setSheetError(message);
      } else {
        setError(message);
      }
      showToast(message, 'danger');
    } finally {
      setCreating(false);
    }
  };

  const completeCreate = async (opts: {
    collectionId?: string;
    name: string;
    publish: boolean;
    keepRateIds: Set<string>;
    packRate?: string;
  }) => {
      const packRate = (opts.packRate ?? combineRateInput(rateFrom, rateTo)).trim();
      const packShared: SameForAllDetails = packSharedDetails(packRate);
      const coverRaw = createCoverUrl ? toAbsoluteMediaUrl(createCoverUrl) : '';
      const cover =
        coverRaw && /^https?:\/\//i.test(coverRaw) ? coverRaw : undefined;
      let collectionId = opts.collectionId;
      let existingIds: string[] = [];
      if (collectionId) {
        const pack = await api.get<CollectionDetailView>(`/collections/${collectionId}`);
        existingIds = pack.products.map((product) => product.id);
      } else {
        const packParsed = parseRateInput(packRate);
        const created = await api.post<CollectionDetailView>('/collections', {
          name: opts.name,
          description: form.description.trim() || undefined,
          categories: form.categories,
          masterCategoryId: form.masterCategoryId,
          rate: packParsed.rate,
          rateMax: packParsed.rateMax,
          unit: packShared.unit || null,
          dispatchUnit: packShared.dispatchUnit || null,
          catalogRateUnit: packShared.catalogRateUnit || null,
          piecesPerPack: productFieldsFromMember({
            name: opts.name,
            rate: packShared.rate,
            unit: packShared.unit,
            dispatchUnit: packShared.dispatchUnit,
            catalogRateUnit: packShared.catalogRateUnit,
            piecesPerPack: packShared.piecesPerPack,
            moq: packShared.moq,
            notes: packShared.notes,
            categories: [],
          }).piecesPerPack,
          ...(cover ? { coverImage: cover } : {}),
          ...(isCatalog
            ? { kind: CollectionKind.Catalog, orderMode: orderMode as 'whole' | 'pick' }
            : {}),
        } satisfies CreateCollectionDto);
        collectionId = created.id;
      }
      if (!collectionId) {
        throw new Error('Could not create.');
      }
      const createdIds: string[] = [];
      for (const photo of readyCreatePhotos) {
        const categories = packTagsForMember(photo.categories, form.categories);
        const displayName = nameForNewDesign(photo.name, photo.sku);
        const stamped = stampCreatePhotoMemberForm(
          {
            name: displayName,
            rate: photo.rate,
            unit: photo.unit,
            dispatchUnit: photo.dispatchUnit,
            catalogRateUnit: photo.catalogRateUnit,
            piecesPerPack: photo.piecesPerPack,
            moq: photo.moq,
            notes: photo.notes,
            categories,
          },
          packShared,
          applyToAll,
        );
        const fields = productFieldsFromMember(stamped);
        const product = await api.post<ProductView>('/products', {
          name: displayName,
          sku: photo.sku,
          images: photo.images.map((img) => toAbsoluteMediaUrl(img.imageUrl!)),
          categories: fields.categories ?? categories,
          description: fields.description,
          rate: fields.rate ?? undefined,
          rateMax: fields.rateMax ?? undefined,
          unit: fields.unit as CreateProductDto['unit'],
          dispatchUnit: fields.dispatchUnit as CreateProductDto['dispatchUnit'],
          catalogRateUnit: fields.catalogRateUnit as CreateProductDto['catalogRateUnit'],
          piecesPerPack: fields.piecesPerPack,
          moq: fields.moq ?? undefined,
        } satisfies CreateProductDto);
        createdIds.push(product.id);
      }
      // Pack Rate fills designs with no rate; design’s own rate wins. Followers
      // also get Rate per units. Apply stamps pack size / MOQ.
      for (const productId of libraryPicks) {
        const product = selectableDesigns.find((p) => p.id === productId);
        if (!product) continue;
        const patch: Record<string, unknown> = {};
        const nextTags = packTagsPatch(product.categories, form.categories);
        if (nextTags) patch.categories = nextTags;
        const parsed = productFieldsFromMember({
          name: product.name,
          rate: packShared.rate,
          unit: packShared.unit,
          dispatchUnit: packShared.dispatchUnit,
          catalogRateUnit: packShared.catalogRateUnit,
          piecesPerPack: packShared.piecesPerPack,
          moq: packShared.moq,
          notes: packShared.notes,
          categories: [],
        });
        Object.assign(
          patch,
          packMemberProductPatch({
            parsed,
            followsPackRate:
              designFollowsPackRate(
                { rate: product.rate, rateMax: product.rateMax },
                '',
                packRate,
              ) && !opts.keepRateIds.has(productId),
            packRate,
            applyToAll,
          }),
        );
        if (Object.keys(patch).length === 0) continue;
        await api.patch(`/products/${productId}`, patch);
      }
      const productIds = membershipWithNewFirst(existingIds, [...createdIds, ...libraryPicks]);
      await api.put<CollectionDetailView>(
        `/collections/${collectionId}/products`,
        { productIds },
      );
      if (opts.publish) {
        const pack = await api.get<CollectionDetailView>(`/collections/${collectionId}`);
        if (pack.status !== CollectionStatus.Published) {
          await api.post(`/collections/${collectionId}/publish`, {
            audience: publishAudience.audience,
            rateVisibility: publishAudience.rateVisibility,
            allowForward: publishAudience.allowForward,
            allowDownload: publishAudience.allowDownload,
            showSourceShops: hasForeignMembers ? publishAudience.showSourceShops : false,
            ...publishAudienceDtoFields(publishAudience),
            ...(canPublishAlready ? {} : { consentToSell: true }),
          });
        }
      }
      for (const photo of pendingPhotos) {
        for (const img of photo.images) {
          if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
        }
      }
      setPendingPhotos([]);
      setLibraryPicks(new Set());
      setPublishOpen(false);
      setNameClash(null);
      leaveBypassRef.current = true;
      const appended = Boolean(opts.collectionId);
      showToast(
        appended
          ? `Added to ${opts.name}`
          : opts.publish
            ? 'Published'
            : 'Collection saved',
      );
      const stayOnEditor = appended || !opts.publish;
      navigate(
        stayOnEditor
          ? `/catalog/collections/${collectionId}`
          : youLibraryHrefAfterPackPublish(isCatalog ? 'catalog' : 'regular'),
        stayOnEditor
          ? { replace: true }
          : {
              replace: true,
              state: {
                collectionFilter: 'published',
                productFilter: 'published',
              },
            },
      );
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
  };

  const toggle = (productId: string) => {
    if (replaceDraft !== null) {
      setReplaceDraft((prev) => {
        const cur = prev ?? new Set<string>();
        const next = new Set(cur);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      return;
    }
    setSelected((prev) => {
      const next = new Set(
        prev.has(productId)
          ? [...prev].filter((id) => id !== productId)
          : membershipWithNewFirst([...prev], [productId]),
      );
      scheduleDesignSave(next);
      return next;
    });
  };

  const finishLibrarySheet = async () => {
    setLibraryOpen(false);
    setDesignSearch('');
    if (replaceDraft === null) return;
    const ids = [...replaceDraft];
    setReplaceDraft(null);
    if (ids.length === 0) {
      abandonReplaceIfPending();
      return;
    }
    const nextIds = membershipForReplaceOrAppend([...selected], ids, true);
    if (nextIds === null) {
      abandonReplaceIfPending();
      return;
    }
    setReplacePendingFlag(false);
    setSelected(new Set(nextIds));
    const saved = await persistDesigns(nextIds);
    if (saved && isPublished) {
      showToast('Published');
    }
  };

  const manageSelectedIds = useMemo(() => [...manageSelected], [manageSelected]);
  const productCompanyById = useMemo(
    () => new Map(selectedProducts.map((product) => [product.id, product.companyId])),
    [selectedProducts],
  );
  const ownerCanDelete = canDeleteSelected(manageSelectedIds);
  const ownerCanRemove = manageSelectedIds.length > 0;

  useEffect(() => {
    if (!manageSelecting) setManageSelected(new Set());
  }, [manageSelecting]);

  const clearManageSelect = () => {
    setManageSelected(new Set());
    setManageSelecting(false);
  };


  const onEditorRemove = async () => {
    if (!ownerCanRemove) return;
    setManageBusy(true);
    try {
      const next = membershipAfterRemove([...selected], manageSelectedIds);
      setSelected(new Set(next));
      await persistDesigns(next);
      clearManageSelect();
      showToast(removedFromPackToast(existing.data?.kind));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not remove.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const finishEditorDelete = async (mode: 'everywhere' | 'only-here') => {
    const myId = company.data?.id ?? '';
    const owned = ownedSelectedIds(manageSelectedIds, productCompanyById, myId);
    setManageBusy(true);
    try {
      if (mode === 'everywhere' && owned.length > 0) {
        for (const productId of owned) {
          await api.del(`/products/${productId}`);
        }
      }
      const next = membershipAfterRemove([...selected], manageSelectedIds);
      setSelected(new Set(next));
      await persistDesigns(next);
      setDeleteSheetOpen(false);
      clearManageSelect();
      showToast(
        mode === 'everywhere' && owned.length > 0
          ? 'Deleted'
          : mode === 'everywhere'
            ? deletedFromThisPackToast(existing.data?.kind)
            : removedFromPackToast(existing.data?.kind),
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not delete.', 'danger');
    } finally {
      setManageBusy(false);
    }
  };

  const onEditorDelete = async () => {
    if (!ownerCanDelete || !id) return;
    const myId = company.data?.id ?? '';
    const owned = ownedSelectedIds(manageSelectedIds, productCompanyById, myId);
    if (owned.length === 0) {
      await finishEditorDelete('everywhere');
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
    await finishEditorDelete('everywhere');
  };

  const removePending = (localId: string) => {
    setPendingPhotos((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target) {
        for (const img of target.images) {
          if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
        }
      }
      return prev.filter((p) => p.localId !== localId);
    });
  };

  const toggleLibraryPick = (productId: string) => {
    setLibraryPicks((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const canSubmitPublish =
    (canPublishAlready || consent) &&
    publishAudienceCanSubmit(publishAudience) &&
    canPublishAlbum;

  const showLifecycleMenu =
    editing &&
    Boolean(existing.data) &&
    (isDraft || isPublished || isArchived);

  const editSnapshot = useMemo(
    () =>
      collectionEditorSnapshot({
        name: form.name,
        description: form.description,
        coverImage: form.coverImage,
        categories: form.categories,
        masterCategoryId: form.masterCategoryId,
        productIds: [...selected].sort(),
        rateFrom,
        rateTo,
        unit: sameForAll.unit,
        dispatchUnit: sameForAll.dispatchUnit,
        catalogRateUnit: sameForAll.catalogRateUnit,
        piecesPerPack: sameForAll.piecesPerPack,
        moq: sameForAll.moq,
        orderMode,
      }),
    [form, selected, rateFrom, rateTo, sameForAll, orderMode],
  );
  const collectionDirty = useMemo(() => {
    if (quickUploading || savingDesigns || creating) return true;
    if (!editing) {
      return (
        pendingPhotos.length > 0 ||
        libraryPicks.size > 0 ||
        Boolean(form.description.trim()) ||
        form.categories.length > 0 ||
        Boolean(form.coverImage) ||
        Boolean(form.name.trim())
      );
    }
    return savedSnapshotRef.current !== null && editSnapshot !== savedSnapshotRef.current;
  }, [
    editing,
    editSnapshot,
    quickUploading,
    savingDesigns,
    creating,
    pendingPhotos.length,
    libraryPicks.size,
    form.description,
    form.categories,
    form.coverImage,
    form.name,
  ]);
  const discard = useDiscardGuard(collectionDirty, leaveBypassRef);

  const openMemberDesignSheet = (product: ProductView) => {
    const categories = packTagsForMember(product.categories, form.categories);
    setMemberForm({
      name: product.name,
      rate: formatRateInput(product.rate, product.rateMax ?? null),
      unit: product.unit || Unit.Set,
      dispatchUnit: normalizePackDispatchUnit(
        product.unit || Unit.Set,
        product.dispatchUnit || Unit.Set,
      ),
      catalogRateUnit: storedCatalogRateUnit(product),
      piecesPerPack: piecesPerPackFieldValue(product.piecesPerPack),
      moq: product.moq != null ? String(product.moq) : '',
      notes: product.description ?? '',
      categories,
    });
    setMemberTagSlots(categoriesToTagSlots(categories));
    setMemberPhotos(
      product.images.map((url) => ({ id: crypto.randomUUID(), url })),
    );
    setMemberOrderDispatchOpen(false);
    setMemberSheet({ kind: 'product', productId: product.id });
  };

  const openPendingDesignSheet = (localId: string) => {
    const photo = pendingPhotos.find((p) => p.localId === localId);
    if (!photo) return;
    const pendingCats = photo.tagsDirty
      ? photo.categories
      : packTagsForMember(photo.categories, form.categories);
    setMemberForm({
      name: nameForNewDesign(photo.name, photo.sku),
      rate: photo.rate,
      unit: photo.unit || Unit.Set,
      dispatchUnit: normalizePackDispatchUnit(
        photo.unit || Unit.Set,
        photo.dispatchUnit || Unit.Set,
      ),
      catalogRateUnit: photo.catalogRateUnit,
      piecesPerPack: photo.piecesPerPack,
      moq: photo.moq,
      notes: photo.notes,
      categories: pendingCats,
    });
    setMemberTagSlots(categoriesToTagSlots(pendingCats));
    setMemberPhotos(
      photo.images
        .filter((img) => img.imageUrl || img.previewUrl)
        .map((img) => ({
          id: img.id,
          url: img.imageUrl ?? img.previewUrl,
        })),
    );
    setMemberOrderDispatchOpen(false);
    setMemberSheet({ kind: 'pending', localId });
  };

  const saveMemberSheet = async () => {
    if (!memberSheet) return;
    setMemberSaving(true);
    setError(null);
    try {
      if (memberSheet.kind === 'pending') {
        const imageUrls = memberPhotos.map((p) => p.url).filter(Boolean);
        setPendingPhotos((prev) =>
          prev.map((p) =>
            p.localId === memberSheet.localId
              ? {
                  ...p,
                  name: memberForm.name.trim(),
                  rate: memberForm.rate,
                  unit: memberForm.unit,
                  dispatchUnit: memberForm.dispatchUnit,
                  catalogRateUnit: memberForm.catalogRateUnit,
                  piecesPerPack: memberForm.piecesPerPack,
                  moq: memberForm.moq,
                  notes: memberForm.notes,
                  categories: memberForm.categories,
                  tagsDirty: true,
                  images:
                    imageUrls.length > 0
                      ? imageUrls.map((url, i) => {
                          const existing = p.images[i];
                          return {
                            id: existing?.id ?? crypto.randomUUID(),
                            previewUrl: existing?.previewUrl ?? url,
                            imageUrl: url.startsWith('blob:')
                              ? existing?.imageUrl ?? null
                              : url,
                            uploading: false,
                          };
                        })
                      : p.images,
                }
              : p,
          ),
        );
      } else {
        const fields = productFieldsFromMember(memberForm, {
          includeEmptyCategories: true,
        });
        const own =
          selectedProducts.find((p) => p.id === memberSheet.productId)?.companyId ===
            company.data?.id ||
          selectableDesigns.find((p) => p.id === memberSheet.productId)?.companyId ===
            company.data?.id;
        if (!own) {
          setMemberSheet(null);
          return;
        }
        await api.patch(`/products/${memberSheet.productId}`, {
          name: memberForm.name.trim(),
          description: fields.description,
          rate: fields.rate,
          rateMax: fields.rateMax,
          unit: fields.unit,
          dispatchUnit: fields.dispatchUnit ?? null,
          catalogRateUnit: fields.catalogRateUnit ?? null,
          piecesPerPack: fields.piecesPerPack ?? null,
          moq: fields.moq ?? null,
          categories: memberForm.categories,
          images: memberPhotos.map((p) => p.url).filter((u) => !u.startsWith('blob:')),
        });
        void queryClient.invalidateQueries({ queryKey: ['my-products'] });
        void queryClient.invalidateQueries({ queryKey: ['collection', id] });
        void queryClient.invalidateQueries({ queryKey: ['collection-preview'] });
        showToast('Design updated');
      }
      setMemberSheet(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save design.');
    } finally {
      setMemberSaving(false);
    }
  };

  const sameForAllLine = sameForAllSummary(sameForAll);
  const whoSummary = (() => {
    const who =
      publishAudience.audience === PublishAudience.Selected
        ? `${publishAudience.audienceCompanies.size} selected`
        : publishAudience.audience === PublishAudience.Followers
          ? 'Followers'
          : publishAudience.audience;
    const rates =
      publishAudience.rateVisibility === RateVisibility.Visible ? 'rates on' : 'rates on request';
    return `${who} · ${rates} · from Settings`;
  })();
  const albumTip = sameForAllLine
    ? diffIds.size > 0
      ? `New photos use shared details. ${diffIds.size} Diff — library kept its own; tap to change.`
      : 'New photos use shared details. Library designs keep their own rates.'
    : 'Tap a design to add more photos of the same one.';
  const createAlbumTiles = sortDiffFirst(
    [
      ...pendingPhotos.map((photo) => ({
        id: photo.localId,
        kind: 'photo' as const,
        photo,
      })),
      ...(editing ? selectedProducts : createLibraryDesigns).map((product) => ({
        id: product.id,
        kind: 'library' as const,
        product,
      })),
    ],
    diffIds,
  );
  const setTagSlots = (next: TagSlots) => {
    if (tagSlotsToCategories(next).length > 20) return;
    setTagSlotsState(next);
    setForm({ ...form, categories: tagSlotsToCategories(next) });
    // Prefer platform set for empty order/dispatch when the category offers it.
    const units = permittedUnits;
    if (units.length > 0) {
      const preferred = preferredPackUnit(units);
      setSameForAll((prev) => ({
        ...prev,
        unit: prev.unit || preferred,
        dispatchUnit: prev.dispatchUnit || preferred,
      }));
    }
  };

  const onMasterCategoryChange = (nextId: string) => {
    if (isCollectionCategoryError(error)) setError(null);
    if (nextId === form.masterCategoryId) return;
    if (isCreate) ratePerTouchedRef.current = false;
    const oldId = form.masterCategoryId;
    const hasTags =
      tagSlots.items.length > 0 ||
      tagSlots.qualities.length > 0 ||
      tagSlots.sizes.length > 0;

    // Sell-as stays put — never rewrite unit / piecesPerPack / dispatch on category change.
    if (!hasTags || !nextId) {
      setForm((prev) => ({ ...prev, masterCategoryId: nextId || null }));
      return;
    }

    const slotsAtChange = tagSlots;
    const loadTaxonomy = (categoryId: string) =>
      queryClient.fetchQuery({
        queryKey: ['catalog-master-taxonomy', categoryId],
        queryFn: () =>
          api.get<MasterTaxonomyView>(
            `/catalog/master-taxonomy?categoryId=${encodeURIComponent(categoryId)}`,
          ),
        staleTime: 60_000,
      });

    void (async () => {
      try {
        const [oldTax, newTax] = await Promise.all([
          oldId
            ? loadTaxonomy(oldId)
            : Promise.resolve({
                itemTypes: [] as string[],
                qualities: [] as string[],
                sizes: [] as string[],
              }),
          loadTaxonomy(nextId),
        ]);
        const pruned = pruneOfficialTagsOnCategoryChange(
          slotsAtChange,
          {
            itemTypes: oldTax.itemTypes ?? [],
            qualities: oldTax.qualities ?? [],
            sizes: oldTax.sizes ?? [],
          },
          {
            itemTypes: newTax.itemTypes,
            qualities: newTax.qualities,
            sizes: newTax.sizes,
          },
        );
        setTagSlotsState(pruned);
        setForm((prev) => ({
          ...prev,
          masterCategoryId: nextId,
          categories: tagSlotsToCategories(pruned),
        }));
      } catch {
        // Taxonomy unavailable — keep every tag, still switch category.
        setForm((prev) => ({ ...prev, masterCategoryId: nextId || null }));
      }
    })();
  };

  const whoExpandable = (
    <CollectionExpandableSection
      title="Who can see this?"
      summary={whoSummary}
      open={whoExpanded}
      onToggle={() => setWhoExpanded((v) => !v)}
      testId="collection-who"
    >
      <PublishAudienceFields
        state={publishAudience}
        onChange={(next) => {
          setError(null);
          setPublishAudience(next);
        }}
        lists={broadcastLists.data ?? []}
        connections={activeConnections}
        connectionsLoading={connections.isLoading}
        tradeDefaults={settings.data?.tradeDefaults}
        maxAudience={maxCuratedAudience}
        showSourceShopsOption={hasForeignMembers}
        showConsent={!canPublishAlready}
        consent={consent}
        onConsent={setConsent}
        onCreateGroup={() => setCreateGroupOpen(true)}
      />
    </CollectionExpandableSection>
  );

  const identityFields = (
    <div className="flex flex-col gap-3">
      {isCatalog ? (
        <>
          <div data-testid="catalog-exclusive-note" className={CATALOG_EXCLUSIVE_NOTE_CLASS}>
            <p className={CATALOG_EXCLUSIVE_NOTE_TEXT_CLASS}>{CATALOG_EXCLUSIVE_NOTE}</p>
          </div>
          <div
            role="radiogroup"
            aria-label="Catalog order"
            data-testid="collection-order-mode"
            className="grid grid-cols-2 rounded-full bg-foam p-0.5"
          >
            {([CatalogOrderMode.Whole, CatalogOrderMode.Pick] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={orderMode === mode}
                data-testid={`collection-order-mode-${mode}`}
                className={cx(
                  'min-h-8 rounded-full px-3 text-sm font-emphasis tracking-tight',
                  orderMode === mode ? 'bg-accent text-white' : 'bg-transparent text-muted',
                )}
                onClick={() => setOrderMode(mode)}
              >
                {mode === CatalogOrderMode.Whole ? 'Order as whole' : 'Pick and choose'}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <Field
        label={packNameLabel(copyKind)}
        required
        error={isCollectionCategoryError(error) ? null : error}
      >
        <TextInput
          aria-label={packNameLabel(copyKind)}
          value={form.name}
          onChange={(e) => {
            setError(null);
            setForm({ ...form, name: e.target.value });
          }}
          autoComplete="off"
        />
      </Field>
      <Field label="Description">
        <GrowingDescriptionField
          value={form.description}
          onChange={(description) => setForm({ ...form, description })}
        />
      </Field>
      {!isGeneral ? (
      <div className="flex flex-col gap-2" data-testid="collection-product-details">
        <p className="text-xs font-body uppercase tracking-wide text-muted">Product details</p>
        <ProductDetailsSlots
          category={
            <MasterCategoryField
              required
              value={form.masterCategoryId}
              onChange={onMasterCategoryChange}
              options={catalogMasterOptions}
              error={isCollectionCategoryError(error) ? error : null}
            />
          }
          rate={
            <RateRangeFields
              from={rateFrom}
              to={rateTo}
              rateUnit={packRateUnit}
              permittedUnits={permittedUnits}
              onRateUnit={(next) => {
                ratePerTouchedRef.current = true;
                setSameForAll((prev) => applyCollectionRateUnit(prev, next));
              }}
              onFrom={(next) => {
                setRateFrom(next);
                setSameForAll((prev) => ({ ...prev, rate: combineRateInput(next, rateTo) }));
              }}
              onTo={(next) => {
                setRateTo(next);
                setSameForAll((prev) => ({ ...prev, rate: combineRateInput(rateFrom, next) }));
              }}
            />
          }
          tags={
            <CascadeTagsFields
              items={tagSlots.items}
              qualities={tagSlots.qualities}
              sizes={tagSlots.sizes}
              masterCategoryId={form.masterCategoryId}
              onItems={(items) => setTagSlots({ ...tagSlots, items })}
              onQualities={(qualities) => setTagSlots({ ...tagSlots, qualities })}
              onSizes={(sizes) => setTagSlots({ ...tagSlots, sizes })}
            />
          }
        />
      </div>
      ) : null}
      {isCreate && !isGeneral ? whoExpandable : null}
      {!isGeneral ? (
      <>
      <div className="flex flex-col gap-1">
        <div
          className={cx(
            'flex w-full items-center gap-1 rounded-xl border px-3 py-3',
            applyToAll ? 'border-accent bg-accent/5' : 'border-line',
          )}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={applyToAll}
            data-testid="collection-apply-all"
            className={cx(
              'flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left text-sm',
              applyToAll ? 'font-emphasis text-ink' : 'text-ink',
            )}
            onClick={() => setApplyToAllRemembered(!applyToAll)}
          >
            <span
              className={cx(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px]',
                applyToAll ? 'border-accent bg-accent text-white' : 'border-line bg-surface',
              )}
              aria-hidden
            >
              {applyToAll ? <CheckIcon width={14} height={14} strokeWidth={2.5} /> : null}
            </span>
            <span>Apply this info to all designs</span>
          </button>
          <InfoHint
            label="About applying to all designs"
            testId="collection-apply-all-info"
          >
            Overwrites member rates. Tags add on. Rate per and 1 set contains
            save with Update. MOQ stamps when this is on.
          </InfoHint>
        </div>
      </div>
      <OrderDispatchAccordion
        orderUnit={sameForAll.unit || Unit.Set}
        piecesPerPack={sameForAll.piecesPerPack}
        dispatchUnit={sameForAll.dispatchUnit || Unit.Set}
        moq={sameForAll.moq}
        contentsUnit={packRateUnit}
        onOrderUnit={(unit) => setSameForAll((prev) => ({ ...prev, unit }))}
        onPiecesPerPack={(piecesPerPack) =>
          setSameForAll((prev) => ({ ...prev, piecesPerPack }))
        }
        onDispatchUnit={(dispatchUnit) =>
          setSameForAll((prev) => ({
            ...prev,
            dispatchUnit: normalizePackDispatchUnit(prev.unit || Unit.Set, dispatchUnit),
          }))
        }
        onMoq={(moq) => setSameForAll((prev) => ({ ...prev, moq }))}
        open={orderDispatchExpanded}
        onToggle={() => setOrderDispatchExpanded((v) => !v)}
      />
      </>
      ) : null}
    </div>
  );

  const categoryReady =
    Boolean(form.masterCategoryId) ||
    (masterCategoriesQuery.isFetched && catalogMasterOptions.length === 0);
  const canOpenCreatePublish =
    !creating &&
    !quickUploading &&
    createMemberCount >= 1 &&
    Boolean(form.name.trim()) &&
    categoryReady;
  const canCreatePublish =
    canOpenCreatePublish &&
    (canPublishAlready || consent) &&
    publishAudienceCanSubmit(publishAudience);

  const canCreateDraft = !creating && !quickUploading;

  // No early returns above — loading/error are branches so hook order never changes.
  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading…" />;
  }
  if (editing && (existing.isError || !existing.data)) {
    return (
      <>
        <PageHeader title={editPackTitle(copyKind)} />
        <p className="text-center text-sm text-danger">
          {existing.error instanceof ApiError
            ? existing.error.message
            : couldNotLoadThisPack(copyKind)}
        </p>
      </>
    );
  }

  const lifecycleMoreItems: MoreActionItem[] = [];
  if (id) {
    lifecycleMoreItems.push({
      id: 'open',
      label: 'Open',
      icon: <CollectionIcon width={20} height={20} />,
      testId: 'collection-editor-open',
      onClick: () => {
        setMoreOpen(false);
        navigate(`/collections/${id}`);
      },
    });
  }
  if (!isGeneral && isPublished) {
    lifecycleMoreItems.push(
      {
        id: 'visibility',
        label: 'Visibility',
        icon: <MegaphoneIcon width={20} height={20} />,
        onClick: () => {
          setMoreOpen(false);
          setPublishOpen(true);
        },
      },
      {
        id: 'share',
        label: 'Share',
        icon: <PaperPlaneIcon width={20} height={20} />,
        onClick: () => {
          setMoreOpen(false);
          setShareOpen(true);
        },
      },
      {
        id: 'hide',
        label: 'Draft',
        icon: <LockIcon width={20} height={20} />,
        disabled: lifecycle.isPending,
        onClick: () => {
          setMoreOpen(false);
          setAlsoDraftDesigns(false);
          setPackDraftOpen(true);
        },
      },
      {
        id: 'archive',
        label: 'Delete',
        icon: <CollectionIcon width={20} height={20} />,
        disabled: lifecycle.isPending,
        danger: true,
        onClick: () => {
          setMoreOpen(false);
          setAlsoArchiveDesigns(alsoDeleteDesignsDefault(existing.data?.kind));
          setPackDeleteOpen(true);
        },
      },
    );
  } else if (!isGeneral && !isArchived) {
    lifecycleMoreItems.push(
      {
        id: 'publish',
        label: 'Publish',
        icon: <MegaphoneIcon width={20} height={20} />,
        disabled: !canPublishAlbum,
        onClick: () => {
          setMoreOpen(false);
          setPublishOpen(true);
        },
      },
      {
        id: 'archive',
        label: 'Delete',
        icon: <CollectionIcon width={20} height={20} />,
        disabled: lifecycle.isPending,
        danger: true,
        onClick: () => {
          setMoreOpen(false);
          setAlsoArchiveDesigns(alsoDeleteDesignsDefault(existing.data?.kind));
          setPackDeleteOpen(true);
        },
      },
    );
  }

  return (
    <div className={cx('flex flex-col gap-4', BOTTOM_DOCK_CLEARANCE_CLASS)}>
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <OwnerPackLifecycleSheet
        open={packDeleteOpen}
        onClose={() => setPackDeleteOpen(false)}
        busy={lifecycle.isPending}
        title={packDeleteCopy(existing.data?.kind).title}
        body={packDeleteCopy(existing.data?.kind).body}
        alsoLabel={packDeleteCopy(existing.data?.kind).alsoDeleteLabel}
        alsoOn={alsoArchiveDesigns}
        onAlso={setAlsoArchiveDesigns}
        confirmLabel={packDeleteCopy(existing.data?.kind).confirmLabel}
        onConfirm={() =>
          lifecycle.mutate({ action: 'archive', alsoArchiveDesigns })
        }
      />
      <OwnerPackLifecycleSheet
        open={packDraftOpen}
        onClose={() => setPackDraftOpen(false)}
        busy={lifecycle.isPending}
        title={packDraftCopy(existing.data?.kind).title}
        body={packDraftCopy(existing.data?.kind).body}
        alsoLabel={packDraftCopy(existing.data?.kind).alsoDraftLabel}
        alsoOn={alsoDraftDesigns}
        onAlso={setAlsoDraftDesigns}
        confirmLabel={packDraftCopy(existing.data?.kind).confirmLabel}
        onConfirm={() =>
          lifecycle.mutate({ action: 'unpublish', alsoDraftDesigns })
        }
      />
      <PageHeader
        title={editing ? editPackTitle(copyKind) : newPackTitle(copyKind)}
        onBack={() => discard.tryLeave(() => navigate(-1))}
        action={
          editing && existing.data && showLifecycleMenu ? (
            <button
              type="button"
              aria-label="More"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((open) => !open)}
              className={cx(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                moreOpen ? 'bg-foam text-ink' : 'text-muted hover:bg-foam hover:text-ink',
              )}
            >
              <MoreHorizontalIcon width={18} height={18} />
            </button>
          ) : undefined
        }
      />

      {editing &&
      existing.data &&
      (ownerSourceLine ||
        (!isGeneral && isPublished && existing.data.rateVisibility === RateVisibility.OnRequest)) ? (
        <div className="-mt-2 flex flex-col gap-1">
          {ownerSourceLine ? (
            <p className="text-sm font-emphasis tracking-tight text-ink" data-testid="collection-editor-source">
              {ownerSourceLine}
            </p>
          ) : null}
          {!isGeneral && isPublished && existing.data.rateVisibility === RateVisibility.OnRequest ? (
            <p className="text-xs text-muted">Buyers may need to ask for rates</p>
          ) : null}
        </div>
      ) : null}

      {collectionEditShowsMemberGrid({
        editing,
        unpublished: isDraft || isArchived,
      }) ? (
        <>
          <div className="flex flex-col gap-3">
            {!hasCreateMembers ? (
              <AddDesignsControl
                size="hero"
                uploading={quickUploading}
                disabled={quickUploading}
                photosDisabled={pendingPhotos.length >= QUICK_PHOTO_CAP}
                onDesigns={pickSourceDesigns}
                onPhotos={pickSourcePhotos}
              />
            ) : (
              <>
                <CreateAlbumChangeStrip
                  count={createAlbumTiles.length}
                  expanded={createMembersExpanded}
                  onToggle={() => setCreateMembersExpanded((open) => !open)}
                  thumbs={createAlbumTiles.flatMap((tile) => {
                    const src =
                      tile.kind === 'photo'
                        ? tile.photo.images[0]?.previewUrl
                        : tile.product.images[0];
                    return src ? [{ key: tile.id, src }] : [];
                  })}
                />
                {createMembersExpanded ? (
                  <ScrollWhenOpened open={createMembersExpanded} className="flex flex-col gap-3">
                    <CappedMediaGrid
                      items={createAlbumTiles}
                      getKey={(tile) => tile.id}
                      overflowPreviewUrl={(tile) =>
                        tile.kind === 'photo'
                          ? tile.photo.images[0]?.previewUrl ?? null
                          : tile.product.images[0] ?? null
                      }
                      renderTile={(tile) => {
                        if (tile.kind === 'photo') {
                          const { photo } = tile;
                          const isDiff = diffIds.has(photo.localId);
                          return (
                            <div
                              className={cx(
                                'relative aspect-square min-w-0 w-full overflow-hidden rounded-xl bg-foam',
                                isDiff ? 'bg-accent/10 ring-2 ring-inset ring-accent' : null,
                              )}
                              data-testid={isDiff ? 'collection-diff-tile' : undefined}
                            >
                              <button
                                type="button"
                                className="absolute inset-0 block text-left"
                                data-testid="collection-pending-tile"
                                onClick={() => openPendingDesignSheet(photo.localId)}
                                aria-label={`Edit design · ${nameForNewDesign(photo.name, photo.sku)}`}
                              >
                                {photo.images[0] ? (
                                  <ManagedImage
                                    src={photo.images[0].previewUrl}
                                    alt=""
                                    variant={MEDIA_VARIANT.Thumbnail1}
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : null}
                              </button>
                              {isDiff ? (
                                <span
                                  data-testid="collection-diff-badge"
                                  className="pointer-events-none absolute left-1 top-1 z-[1] rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white"
                                >
                                  Diff
                                </span>
                              ) : null}
                              {photo.images.some((img) => img.uploading) ? (
                                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40 text-xs font-emphasis text-white">
                                  …
                                </span>
                              ) : null}
                              <button
                                type="button"
                                aria-label="Remove photo"
                                className="absolute right-1 top-1 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
                                onClick={() => removePending(photo.localId)}
                              >
                                ×
                              </button>
                            </div>
                          );
                        }
                        const { product } = tile;
                        const isDiff = diffIds.has(product.id);
                        return (
                          <div
                            className={cx(
                              'relative aspect-square min-w-0 w-full overflow-hidden rounded-xl bg-foam',
                              isDiff ? 'bg-accent/10 ring-2 ring-inset ring-accent' : null,
                            )}
                            data-testid={isDiff ? 'collection-diff-tile' : undefined}
                          >
                            <button
                              type="button"
                              className="absolute inset-0 block text-left"
                              onClick={() => openMemberDesignSheet(product)}
                              aria-label={`Edit design · ${product.name}`}
                            >
                              {product.images[0] ? (
                                <ManagedImage
                                  src={product.images[0]}
                                  alt=""
                                  variant={MEDIA_VARIANT.Thumbnail1}
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg font-body text-muted">
                                  {product.name.charAt(0)}
                                </div>
                              )}
                            </button>
                            {isDiff ? (
                              <span
                                data-testid="collection-diff-badge"
                                className="pointer-events-none absolute left-1 top-1 z-[1] rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white"
                              >
                                Diff
                              </span>
                            ) : null}
                            <button
                              type="button"
                              aria-label={`Remove ${product.name}`}
                              className="absolute right-1 top-1 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
                              onClick={() =>
                                editing ? toggle(product.id) : toggleLibraryPick(product.id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        );
                      }}
                    />
                    <AddDesignsControl
                      size="compact"
                      uploading={quickUploading}
                      disabled={quickUploading}
                      photosDisabled={pendingPhotos.length >= QUICK_PHOTO_CAP}
                      onDesigns={pickSourceDesigns}
                      onPhotos={pickSourcePhotos}
                    />
                    <p className="text-xs text-muted" data-testid="collection-create-design-tip">
                      {albumTip}
                    </p>
                  </ScrollWhenOpened>
                ) : null}
              </>
            )}
          </div>

          {identityFields}
        </>
      ) : null}

      {editing &&
      !collectionEditShowsMemberGrid({
        editing,
        unpublished: isDraft || isArchived,
      }) ? (
        <div className="flex flex-col gap-4" data-testid="collection-edit-details">
          {identityFields}
        </div>
      ) : null}

      <MoreActionsSheet
        open={moreOpen && showLifecycleMenu}
        onClose={() => setMoreOpen(false)}
        title={form.name.trim() || untitledPackFallback(copyKind)}
        testId="collection-editor-more-sheet"
        items={lifecycleMoreItems}
      />

      {editing && existing.data ? (
        <>
          <OwnerPackManageDock
            selecting={manageSelecting}
            busy={manageBusy || savingDesigns || quickUploading}
            canDelete={ownerCanDelete}
            canRemove={ownerCanRemove}
            removeLabel={removeFromThisPackLabel(existing.data?.kind)}
            kind={existing.data?.kind}
            onDelete={() => void onEditorDelete()}
            onRemove={() => void onEditorRemove()}
            onUpdate={() => save.mutate()}
            updatePending={save.isPending || savingDesigns}
            updateDisabled={collectionEditUpdateDisabled({
              isGeneral,
              name: form.name,
              memberCount: selected.size,
            })}
          />
          <OwnerPackReplaceSheet
            open={replaceSheetOpen}
            onClose={() => setReplaceSheetOpen(false)}
            busy={manageBusy}
            uploading={quickUploading}
            onDesigns={beginReplaceFromDesigns}
            onPhotos={beginReplaceFromPhotos}
          />
          <OwnerPackDeleteSheet
            open={deleteSheetOpen}
            onClose={() => setDeleteSheetOpen(false)}
            busy={manageBusy}
            kind={existing.data?.kind}
            onDeleteEverywhere={() => void finishEditorDelete('everywhere')}
            onOnlyThisCollection={() => void finishEditorDelete('only-here')}
          />
        </>
      ) : null}

      {!editing ? (
            <BottomTradeDock testId="collection-create-dock" aboveAppNav={false}>
                <Button
                  className="min-w-0 flex-1"
                  loading={creating}
                  disabled={!canOpenCreatePublish}
                  onClick={() => {
                    if (!canCreatePublish) {
                      setWhoExpanded(true);
                      setError(
                        !canPublishAlready && !consent
                          ? 'Confirm you can sell on Ekum under Who can see this.'
                          : pickWhoCanSeeThisPack(copyKind),
                      );
                      showToast(
                        !canPublishAlready && !consent
                          ? 'Confirm you can sell on Ekum'
                          : pickWhoCanSeeThisPack(copyKind, false),
                        'danger',
                      );
                      return;
                    }
                    void onCreate({ publish: true });
                  }}
                >
                  Create & Publish
                </Button>
                <Button
                  variant="secondary"
                  className="min-w-0 flex-1"
                  loading={creating}
                  disabled={!canCreateDraft}
                  onClick={() => void onCreate()}
                >
                  Save in Draft
                </Button>
            </BottomTradeDock>
          ) : null}

      <input
        ref={designFileRef}
        {...collectionGalleryInputProps}
        data-testid="collection-gallery-input"
        className="hidden"
        onChange={(e) => void onQuickDesignFiles(e.target.files)}
      />

      <ContinuousCamera
        key={cameraSession}
        open={cameraOpen}
        maxShots={
          cameraAppend
            ? CAMERA_APPEND_SOFT_MAX
            : editing
              ? QUICK_PHOTO_CAP
              : collectionCameraMaxShots(pendingPhotos.length)
        }
        onCancel={() => {
          setCameraOpen(false);
          cameraAppendRef.current = null;
          setCameraAppend(null);
          if (!cameraAppend) abandonReplaceIfPending();
          restoreMemberSheetAfterCamera();
        }}
        batchAsDesigns={!cameraAppend}
        onUnavailable={() => {
          setCameraOpen(false);
          if (cameraAppend) {
            restoreMemberSheetAfterCamera();
            cameraAppendRef.current = null;
            setCameraAppend(null);
            return;
          }
          openCollectionGalleryDeferred();
        }}
        onGallery={() => {
          setCameraOpen(false);
          setError(null);
          clickCollectionGallery();
        }}
        onDone={(files) => {
          setCameraOpen(false);
          void ingestPhotoFiles(files);
        }}
      />

      <Sheet
        open={addDesignsOpen}
        onClose={() => {
          setAddDesignsOpen(false);
          if (replaceProceedPickRef.current) {
            replaceProceedPickRef.current = false;
            return;
          }
          abandonReplaceIfPending();
        }}
        title={replacePending ? 'Replace designs' : 'Add designs'}
      >
        <div className="flex flex-col gap-3" data-testid="collection-add-designs-sheet">
          <p className="text-sm text-muted">
            {replacePending
              ? 'Choose photos or designs. The collection updates only after you save a new set.'
              : 'Add from your library or take new photos.'}
          </p>
          <AddDesignsControl
            size="hero"
            uploading={quickUploading}
            disabled={quickUploading}
            onDesigns={() => {
              replaceProceedPickRef.current = true;
              setAddDesignsOpen(false);
              openLibraryDesigns();
            }}
            onPhotos={() => {
              replaceProceedPickRef.current = true;
              setAddDesignsOpen(false);
              openPhotos();
            }}
          />
        </div>
      </Sheet>

      <Sheet
        open={libraryOpen}
        onClose={() => {
          void finishLibrarySheet();
        }}
        title={replaceDraft !== null ? 'Replace designs' : 'Add designs'}
        footer={
          <Button fullWidth onClick={() => void finishLibrarySheet()}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
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
                  openCollectionCamera();
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
                {libraryPickerHint(packKind, replaceDraft !== null)}
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
                loadMoreTestId="collection-library-load-more"
                renderTile={(product) => {
                  const on = editing
                    ? replaceDraft !== null
                      ? replaceDraft.has(product.id)
                      : selected.has(product.id)
                    : libraryPicks.has(product.id);
                  return (
                    <LibraryPickTile
                      name={product.name}
                      imageUrl={product.images[0]}
                      selected={on}
                      onClick={() =>
                        editing ? toggle(product.id) : toggleLibraryPick(product.id)
                      }
                    />
                  );
                }}
              />
            </>
          )}
        </div>
      </Sheet>

      <Sheet
        open={publishOpen}
        onClose={closePublishSheet}
        title={
          !editing
            ? 'Create & Publish'
            : isPublished
              ? 'Visibility & rates'
              : publishPackSheetTitle(copyKind)
        }
        footer={
          <Button
            fullWidth
            loading={creating || publish.isPending}
            disabled={
              editing
                ? !canSubmitPublish
                : !canCreatePublish
            }
            onClick={() => {
              if (!editing) {
                void onCreate({ publish: true });
                return;
              }
              publish.mutate();
            }}
          >
            {!editing
              ? 'Create & Publish'
              : isPublished
                ? 'Update visibility'
                : 'Publish'}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {editing && !isPublished ? (
            <p className="text-sm text-muted">
              {hasForeignMembers
                ? 'You’re sharing others’ designs under their rules.'
                : publishingThisPackExplore(copyKind)}
            </p>
          ) : null}

          <PublishAudienceFields
            state={publishAudience}
            onChange={(next) => {
              setSheetError(null);
              setPublishAudience(next);
            }}
            lists={broadcastLists.data ?? []}
            connections={activeConnections}
            connectionsLoading={connections.isLoading}
            tradeDefaults={settings.data?.tradeDefaults}
            isVisibilityUpdate={editing && isPublished}
            maxAudience={maxCuratedAudience}
            showSourceShopsOption={hasForeignMembers}
            showConsent={!canPublishAlready}
            consent={consent}
            onConsent={setConsent}
            consentLabel={publishThisPackConsent(copyKind, hasForeignMembers)}
            onCreateGroup={() => setCreateGroupOpen(true)}
          />

          {sheetError ? <p className="text-center text-xs text-danger">{sheetError}</p> : null}
        </div>
      </Sheet>

      <Sheet
        open={Boolean(memberSheet)}
        onClose={() => !memberSaving && setMemberSheet(null)}
        title="Update this design"
        footer={
          <div className="flex flex-col gap-2">
            {memberSheetCanSetLive ? (
              <Button
                fullWidth
                loading={savingDesigns}
                disabled={memberSaving}
                data-testid="collection-member-sheet-set-live"
                onClick={() => void setMemberLiveInPack()}
              >
                Publish
              </Button>
            ) : null}
            <Button
              fullWidth
              variant={memberSheetCanSetLive ? 'secondary' : 'primary'}
              loading={memberSaving}
              onClick={() => void saveMemberSheet()}
            >
              Done
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 text-sm font-emphasis text-ink">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {memberPhotos.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-foam"
                >
                  <ManagedImage src={img.url} alt="" variant={MEDIA_VARIANT.Thumbnail1} className="h-full w-full object-cover" />
                  {memberPhotos.length > 1 ? (
                    <button
                      type="button"
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                      onClick={() =>
                        setMemberPhotos((prev) => prev.filter((p) => p.id !== img.id))
                      }
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
              {memberSheet?.kind === 'pending' ||
              (memberSheet?.kind === 'product' &&
                (selectedProducts.find((p) => p.id === memberSheet.productId)?.companyId ===
                  company.data?.id ||
                  selectableDesigns.find((p) => p.id === memberSheet.productId)?.companyId ===
                    company.data?.id)) ? (
                <button
                  type="button"
                  data-testid="collection-member-add-photos"
                  aria-label="Add photos to this design"
                  onClick={openMorePhotosForMember}
                  disabled={quickUploading || memberSaving}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted disabled:opacity-40"
                >
                  <CameraIcon width={22} height={22} />
                  <span className="text-xs font-emphasis">Add photos</span>
                </button>
              ) : null}
            </div>
          </div>
          <Field label="Name">
            <TextInput
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder={
                memberSheet?.kind === 'pending'
                  ? pendingPhotos.find((p) => p.localId === memberSheet.localId)?.sku ||
                    'Design name'
                  : 'Design name'
              }
            />
          </Field>
          {!isCatalog && memberSheet?.kind === 'product'
            ? (() => {
                const product =
                  selectedProducts.find((p) => p.id === memberSheet.productId) ??
                  createLibraryDesigns.find((p) => p.id === memberSheet.productId) ??
                  selectableDesigns.find((p) => p.id === memberSheet.productId);
                const otherPacks = (product?.collectionNames ?? []).filter(
                  (name) => !editing || !existing.data || name !== existing.data.name,
                );
                return otherPacks.length > 0 ? (
                  <p className="text-xs text-muted" data-testid="collection-also-in">
                    Also in: {otherPacks.join(' · ')}
                  </p>
                ) : null;
              })()
            : null}
          {!isCatalog ? (
            <>
          <ProductDetailsSlots
            category={
              <MasterCategoryField
                locked={Boolean(form.masterCategoryId)}
                value={form.masterCategoryId}
                onChange={onMasterCategoryChange}
                options={catalogMasterOptions}
                testId="design-master-category"
              />
            }
            rate={
              <RateRangeFields
                from={splitRateInput(memberForm.rate).from}
                to={splitRateInput(memberForm.rate).to}
                rateUnit={
                  memberForm.catalogRateUnit.trim() ||
                  (catalogRateDisplayUnit({
                    unit: memberForm.unit || Unit.Set,
                    dispatchUnit: memberForm.dispatchUnit || Unit.Set,
                    catalogRateUnit: memberForm.catalogRateUnit,
                    offeredRateUnits: permittedUnits.length > 0 ? permittedUnits : undefined,
                  }) ??
                    Unit.Piece)
                }
                permittedUnits={permittedUnits}
                onRateUnit={(next) =>
                  setMemberForm({
                    ...memberForm,
                    ...applyDesignRateUnit(
                      memberForm.unit || Unit.Set,
                      next,
                      memberForm.dispatchUnit,
                    ),
                  })
                }
                onFrom={(next) =>
                  setMemberForm({
                    ...memberForm,
                    rate: combineRateInput(next, splitRateInput(memberForm.rate).to),
                  })
                }
                onTo={(next) =>
                  setMemberForm({
                    ...memberForm,
                    rate: combineRateInput(splitRateInput(memberForm.rate).from, next),
                  })
                }
              />
            }
            tags={
              <CascadeTagsFields
                items={memberTagSlots.items}
                qualities={memberTagSlots.qualities}
                sizes={memberTagSlots.sizes}
                masterCategoryId={form.masterCategoryId}
                onItems={(items) => {
                  const next = { ...memberTagSlots, items };
                  if (tagSlotsToCategories(next).length > 20) return;
                  setMemberTagSlots(next);
                  setMemberForm({
                    ...memberForm,
                    categories: tagSlotsToCategories(next),
                  });
                }}
                onQualities={(qualities) => {
                  const next = { ...memberTagSlots, qualities };
                  if (tagSlotsToCategories(next).length > 20) return;
                  setMemberTagSlots(next);
                  setMemberForm({
                    ...memberForm,
                    categories: tagSlotsToCategories(next),
                  });
                }}
                onSizes={(sizes) => {
                  const next = { ...memberTagSlots, sizes };
                  if (tagSlotsToCategories(next).length > 20) return;
                  setMemberTagSlots(next);
                  setMemberForm({
                    ...memberForm,
                    categories: tagSlotsToCategories(next),
                  });
                }}
              />
            }
          />
          <OrderDispatchAccordion
            orderUnit={memberForm.unit || Unit.Set}
            piecesPerPack={memberForm.piecesPerPack}
            dispatchUnit={memberForm.dispatchUnit || Unit.Set}
            moq={memberForm.moq}
            contentsUnit={
              memberForm.catalogRateUnit.trim() ||
              (catalogRateDisplayUnit({
                unit: memberForm.unit || Unit.Set,
                dispatchUnit: memberForm.dispatchUnit || Unit.Set,
                catalogRateUnit: memberForm.catalogRateUnit,
                offeredRateUnits: permittedUnits.length > 0 ? permittedUnits : undefined,
              }) ??
                Unit.Piece)
            }
            onOrderUnit={(unit) => setMemberForm({ ...memberForm, unit })}
            onPiecesPerPack={(piecesPerPack) =>
              setMemberForm({ ...memberForm, piecesPerPack })
            }
            onDispatchUnit={(dispatchUnit) =>
              setMemberForm({ ...memberForm, dispatchUnit })
            }
            onMoq={(moq) => setMemberForm({ ...memberForm, moq })}
            open={memberOrderDispatchOpen}
            onToggle={() => setMemberOrderDispatchOpen((open) => !open)}
          />
            </>
          ) : null}
          <Field label="Notes">
            <TextArea
              value={memberForm.notes}
              onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
              placeholder="e.g. 44 inch, cotton"
            />
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(nameClash)}
        onClose={() => setNameClash(null)}
        title={packNameTakenTitle(copyKind)}
        footer={
          nameClash ? (
            <div className="flex flex-col gap-2" data-testid="collection-name-clash">
              <Button
                fullWidth
                data-testid="collection-name-clash-append"
                disabled={creating}
                onClick={() => {
                  const clash = nameClash;
                  setCreating(true);
                  void (async () => {
                    try {
                      await completeCreate({
                        collectionId: clash.collectionId,
                        name: clash.name,
                        publish: clash.publish,
                        keepRateIds: rateConflictKeepIds,
                        packRate: combineRateInput(rateFrom, rateTo),
                      });
                    } catch (err) {
                      const message =
                        err instanceof ApiError
                          ? err.message
                          : (err as Error).message || 'Could not add designs.';
                      showToast(message, 'danger');
                    } finally {
                      setCreating(false);
                    }
                  })();
                }}
              >
                Add to that collection
              </Button>
              <Button
                fullWidth
                variant="secondary"
                data-testid="collection-name-clash-rename"
                disabled={creating}
                onClick={() => setNameClash(null)}
              >
                I’ll use another name
              </Button>
            </div>
          ) : null
        }
      >
        <p className="text-sm text-muted">
          {packNameTakenBody(nameClash?.name || form.name.trim(), nameClash?.kind ?? copyKind)}
        </p>
      </Sheet>

      <Sheet
        open={Boolean(rateConflicts && rateConflicts.length > 0)}
        onClose={() => setRateConflicts(null)}
        title="Different rate"
        footer={
          rateConflicts && rateConflicts[0] ? (
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                data-testid="collection-rate-change"
                onClick={() => {
                  const rest = rateConflicts.slice(1);
                  if (rest.length === 0) {
                    const keep = rateConflictKeepIds;
                    setRateConflicts(null);
                    void onCreate({ publish: pendingPublish, keepRateIds: keep });
                    return;
                  }
                  setRateConflicts(rest);
                }}
              >
                Change
              </Button>
              <Button
                variant="ghost"
                fullWidth
                data-testid="collection-rate-keep"
                onClick={() => {
                  const current = rateConflicts[0]!;
                  const keep = new Set(rateConflictKeepIds);
                  keep.add(current.id);
                  setRateConflictKeepIds(keep);
                  const rest = rateConflicts.slice(1);
                  if (rest.length === 0) {
                    setRateConflicts(null);
                    void onCreate({ publish: pendingPublish, keepRateIds: keep });
                    return;
                  }
                  setRateConflicts(rest);
                }}
              >
                Keep as is
              </Button>
            </div>
          ) : null
        }
      >
        {rateConflicts && rateConflicts[0] ? (
          <p className="text-sm text-ink" data-testid="collection-rate-conflict">
            {rateConflicts[0].name} is {rateConflicts[0].existing}
            {rateConflicts[0].otherPacks[0]
              ? ` in ${rateConflicts[0].otherPacks[0]}`
              : ''}
            . Change to {rateConflicts[0].incoming}, or keep as is?
          </p>
        ) : null}
      </Sheet>

      <BuyerGroupFormSheet
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSaved={(list) => {
          setPublishAudience((prev) =>
            selectCreatedGroup(
              prev,
              list,
              broadcastLists.data ?? [],
              settings.data?.tradeDefaults,
            ),
          );
          void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
        }}
      />

      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={
          id && existing.data
            ? [
                {
                  collectionId: id,
                  name: existing.data.name,
                  image: existing.data.coverImage,
                },
              ]
            : []
        }
      />
    </div>
  );
}
