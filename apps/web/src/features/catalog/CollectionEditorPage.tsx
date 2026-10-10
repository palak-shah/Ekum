import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  CollectionDetailView,
  CompanySettingsView,
  ConnectionView,
  CreateCollectionDto,
  CreateProductDto,
  OtherPackCountsView,
  ProductView,
  PublishCollectionDto,
} from '@ekum/domain-types';
import {
  CollectionStatus,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  Unit,
  categoriesToTagSlots,
  emptyTagSlots,
  mainsForCompany,
  parentKeysFromCompanyCategories,
  tagSlotsToCategories,
  unitsSuggestedByItem,
  type TagSlots,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import {
  readCollectionApplyToAll,
  writeCollectionApplyToAll,
} from '@/lib/collectionApplyToAll';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { acquireMediaStream } from '@/lib/mediaSession';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { ContinuousCamera, continuousCameraConstraints } from '@/ui/ContinuousCamera';
import { CappedMediaGrid } from '@/ui/CappedMediaGrid';
import { PageHeader } from '@/ui/PageHeader';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import {
  Button,
  Field,
  LoadingBlock,
  Sheet,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';
import { CollectionExpandableSection } from './CollectionExpandableSection';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { OwnerPackManageDock } from '@/features/collections/OwnerPackManageDock';
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
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { COLLECTION_QUICK_PHOTO_CAP, collectionCameraMaxShots, collectionNameClash } from './collectionCreateHelpers';
import {
  createProductIdentity,
  nameForNewDesign,
  uniqueDraftSku,
} from './designBatchHelpers';
import {
  collectSameForAllDiffIds,
  emptySameForAll,
  forceSameForAllToForm,
  productFieldsFromMember,
  sameForAllIsEmpty,
  sameForAllSummary,
  sortDiffFirst,
  designFollowsPackRate,
  stampCreatePhotoMemberForm,
  unanimousMemberRate,
  unionTags,
  type MemberDesignForm,
  type RateConflict,
  type SameForAllDetails,
} from './collectionSameForAll';
import { formatRateInput, parseRateInput } from './rateInput';
import { combineRateInput, splitRateInput } from './rateRange';
import {
  catalogRateDisplayUnit,
  catalogRateFieldLabel,
  isPackOrderUnit,
} from '@/lib/catalogRate';
import { RateRangeFields } from './RateRangeFields';
import { CascadeTagsFields } from './CascadeTagsFields';
import { OrderDispatchFields } from './OrderDispatchFields';
import { orderDispatchSectionSummary } from './orderDispatchPreview';
import { collectionEditShowsMemberGrid } from './collectionEditDetailsOnly';
import { collectionGalleryInputProps } from './collectionGalleryInput';
import { AddDesignsControl } from './AddDesignsControl';
import {
  CAMERA_APPEND_SOFT_MAX,
  morePhotosEntry,
} from './designBatchHelpers';
import { createPortal } from 'react-dom';
import { MoreActionsSheet, type MoreActionItem } from '@/ui/MoreActionsSheet';
import {
  CameraIcon,
  CheckIcon,
  CollectionIcon,
  LockIcon,
  MegaphoneIcon,
  MoreHorizontalIcon,
  PaperPlaneIcon,
  UnlockIcon,
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

export function CollectionEditorPage() {
  const { id: routeId } = useParams();
  /** `/catalog/collections/new` shares `:id` with edit — treat literal `new` as create. */
  const isCreate = !routeId || routeId === 'new';
  const id = isCreate ? undefined : routeId;
  const editing = !isCreate;
  const navigate = useNavigate();
  const location = useLocation();
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
  });
  const [tagSlots, setTagSlotsState] = useState<TagSlots>(() => emptyTagSlots());
  const [memberTagSlots, setMemberTagSlots] = useState<TagSlots>(() => emptyTagSlots());
  const leaveBypassRef = useRef(false);
  /** Repost → Publish: land on My Collections (or Explore when asked). */
  const afterPublishDestRef = useRef<'explore' | 'collections' | null>(null);
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
    dispatchUnit: Unit.Piece,
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
  const applyToAllHydrated = useRef(false);
  const [rateFrom, setRateFrom] = useState('');
  const [rateTo, setRateTo] = useState('');
  const rateFieldsHydrated = useRef(false);
  const [rateConflicts, setRateConflicts] = useState<RateConflict[] | null>(null);
  const [rateConflictKeepIds, setRateConflictKeepIds] = useState<Set<string>>(new Set());
  const [pendingPublish, setPendingPublish] = useState(false);
  const [whoExpanded, setWhoExpanded] = useState(false);
  const [orderDispatchExpanded, setOrderDispatchExpanded] = useState(false);
  const [defaultsPrefillDone, setDefaultsPrefillDone] = useState(false);
  const cameraAppendRef = useRef<CameraAppendTarget | null>(null);
  const [cameraAppend, setCameraAppend] = useState<CameraAppendTarget | null>(null);
  const resumeMemberSheetRef = useRef<MemberSheetState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSnapshotRef = useRef<string | null>(null);
  /** Create mode: photos and/or library designs; Publish/Share after create. */
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [libraryPicks, setLibraryPicks] = useState<Set<string>>(new Set());

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
  const designQuery = designSearch.trim().toLowerCase();
  const filteredDesigns = designQuery
    ? selectableDesigns.filter((p) => p.name.toLowerCase().includes(designQuery))
    : selectableDesigns;
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
          piecesPerPack: photo.piecesPerPack,
          moq: photo.moq,
          notes: photo.notes,
          categories:
            photo.tagsDirty || photo.categories.length > 0
              ? photo.categories
              : [...form.categories],
        },
      })),
      ...memberDiffSources.map((product) => ({
        id: product.id,
        form: {
          name: product.name,
          rate: formatRateInput(product.rate, product.rateMax ?? null),
          unit: product.unit || Unit.Set,
          dispatchUnit: product.dispatchUnit || Unit.Piece,
          piecesPerPack:
            product.piecesPerPack != null ? String(product.piecesPerPack) : '',
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
  const createCoverUrl =
    readyCreatePhotos[0]?.images[0]?.imageUrl ??
    createLibraryDesigns[0]?.images[0] ??
    undefined;

  useEffect(() => {
    if (existing.data) {
      const loadedCategories = existing.data.categories ?? [];
      setForm({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
        categories: loadedCategories,
      });
      setTagSlotsState(categoriesToTagSlots(loadedCategories));
      setSelected(new Set(existing.data.products.map((product) => product.id)));
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
      setSameForAll((prev) => ({
        ...prev,
        rate: loadedRate || prev.rate,
        unit: first?.unit || prev.unit || Unit.Set,
        dispatchUnit: first?.dispatchUnit || prev.dispatchUnit || Unit.Piece,
        piecesPerPack:
          first?.piecesPerPack != null ? String(first.piecesPerPack) : prev.piecesPerPack,
        moq: first?.moq != null ? String(first.moq) : prev.moq,
      }));
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
      savedSnapshotRef.current = JSON.stringify({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
        categories: existing.data.categories ?? [],
        productIds: existing.data.products.map((product) => product.id).sort(),
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
    setSameForAll((prev) => ({
      ...prev,
      unit: prev.unit || sell.unit || Unit.Set,
      dispatchUnit: prev.dispatchUnit || sell.dispatchUnit || Unit.Piece,
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
        ? 'Rates stay on request when this collection includes others’ designs.'
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
    } | null;
    if (!state?.notice && !state?.openPublish) return;
    if (state.notice) showToast(state.notice);
    if (state.openPublish) setPublishOpen(true);
    if (state.afterPublish === 'explore' || state.afterPublish === 'collections') {
      afterPublishDestRef.current = state.afterPublish;
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, showToast]);

  const invalidate = (collectionId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['collection', collectionId ?? id] });
    void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
    void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['explore'] });
  };

  const persistDesigns = async (productIds: string[], collectionId = id) => {
    if (!collectionId) return false;
    setSavingDesigns(true);
    try {
      await api.put(`/collections/${collectionId}/products`, { productIds });
      invalidate(collectionId);
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
      const unpublishedOwn = selectedProducts.filter(
        (product) =>
          product.status === ProductStatus.Draft && product.companyId === company.data?.id,
      ).length;
      const saved = await persistDesigns([...selected]);
      if (!saved) {
        return { unpublishedOwn: 0, designsFailed: true as const };
      }
      const packRate = combineRateInput(rateFrom, rateTo).trim();
      const previousPackRate = formatRateInput(
        existing.data?.rate ?? null,
        existing.data?.rateMax ?? null,
      );
      const packShared: SameForAllDetails = { ...sameForAll, rate: packRate };
      if (packRate || applyToAll) {
        for (const product of selectedProducts) {
          if (product.companyId !== company.data?.id) continue;
          const parsed = productFieldsFromMember({
            name: product.name,
            rate: packShared.rate,
            unit: packShared.unit,
            dispatchUnit: packShared.dispatchUnit,
            piecesPerPack: packShared.piecesPerPack,
            moq: packShared.moq,
            notes: packShared.notes,
            categories: [],
          });
          const patch: Record<string, unknown> = {};
          // Empty or still on the old pack rate → follow the new pack rate.
          if (
            packRate &&
            designFollowsPackRate(
              { rate: product.rate, rateMax: product.rateMax },
              previousPackRate,
            )
          ) {
            patch.rate = parsed.rate;
            patch.rateMax = parsed.rateMax;
          }
          if (applyToAll) {
            if (parsed.unit) patch.unit = parsed.unit;
            if (parsed.dispatchUnit) patch.dispatchUnit = parsed.dispatchUnit;
            if (parsed.piecesPerPack != null) patch.piecesPerPack = parsed.piecesPerPack;
            if (parsed.moq != null) patch.moq = parsed.moq;
          }
          if (Object.keys(patch).length === 0) continue;
          await api.patch(`/products/${product.id}`, patch);
        }
      }
      const packParsed = parseRateInput(packRate);
      const dto: CreateCollectionDto = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        categories: form.categories,
        rate: packParsed.rate,
        rateMax: packParsed.rateMax,
      };
      await api.patch<CollectionDetailView>(`/collections/${id}`, dto);
      return { unpublishedOwn, designsFailed: false as const };
    },
    onSuccess: ({ unpublishedOwn, designsFailed }) => {
      if (designsFailed) return;
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
      if (!id) throw new Error('Missing collection');
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
        leaveBypassRef.current = true;
        showToast(
          !publishAudience.allowForward ? 'Buyers can’t forward this.' : 'Published',
        );
        if (afterDest === 'collections') {
          navigate('/catalog?tab=collections', {
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
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not publish.';
      setSheetError(message);
      showToast(message, 'danger');
    },
  });

  const lifecycle = useMutation({
    mutationFn: (action: 'unpublish' | 'archive' | 'unarchive') =>
      api.post(`/collections/${id}/${action}`, {}),
    onSuccess: (_data, action) => {
      setPublishOpen(false);
      setMoreOpen(false);
      invalidate();
      const messages: Record<string, string> = {
        archive: 'Archived',
        unarchive: 'Restored to draft',
        unpublish: 'Hidden',
      };
      showToast(messages[action] ?? 'Updated');
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
    setReplacePendingFlag(true);
    setReplaceDraft(null);
    openAddDesignsMenu();
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
        dispatchUnit: shared.dispatchUnit || Unit.Piece,
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
        const parsed = productFieldsFromMember({
          name: identity.name,
          rate: shared.rate,
          unit: shared.unit || Unit.Set,
          dispatchUnit: shared.dispatchUnit || Unit.Piece,
          piecesPerPack: shared.piecesPerPack,
          moq: shared.moq,
          notes: shared.notes,
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
    if (createMemberCount < 1) {
      setError('Add photos or pick designs.');
      return;
    }
    if (!form.name.trim()) {
      setError('Enter a collection name.');
      return;
    }
    if (opts?.publish) {
      const canPublishCreate =
        (canPublishAlready || consent) && publishAudienceCanSubmit(publishAudience);
      if (!canPublishCreate) {
        setSheetError('Choose who can see this collection.');
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
      const packShared: SameForAllDetails = { ...sameForAll, rate: packRate };
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
          rate: packParsed.rate,
          rateMax: packParsed.rateMax,
          ...(cover ? { coverImage: cover } : {}),
        } satisfies CreateCollectionDto);
        collectionId = created.id;
      }
      if (!collectionId) {
        throw new Error('Could not create.');
      }
      const createdIds: string[] = [];
      for (const photo of readyCreatePhotos) {
        const categories = unionTags(photo.categories, form.categories);
        const displayName = nameForNewDesign(photo.name, photo.sku);
        const stamped = stampCreatePhotoMemberForm(
          {
            name: displayName,
            rate: photo.rate,
            unit: photo.unit,
            dispatchUnit: photo.dispatchUnit,
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
          piecesPerPack: fields.piecesPerPack,
          moq: fields.moq ?? undefined,
        } satisfies CreateProductDto);
        createdIds.push(product.id);
      }
      // Pack Rate fills designs with no rate; design’s own rate wins. Apply stamps units/MOQ.
      for (const productId of libraryPicks) {
        const product = selectableDesigns.find((p) => p.id === productId);
        if (!product) continue;
        const patch: Record<string, unknown> = {};
        if (applyToAll || form.categories.length > 0) {
          const nextTags = unionTags(product.categories ?? [], form.categories);
          if (nextTags.length !== (product.categories ?? []).length) {
            patch.categories = nextTags;
          }
        }
        const parsed = productFieldsFromMember({
          name: product.name,
          rate: packShared.rate,
          unit: packShared.unit,
          dispatchUnit: packShared.dispatchUnit,
          piecesPerPack: packShared.piecesPerPack,
          moq: packShared.moq,
          notes: packShared.notes,
          categories: [],
        });
        if (
          packRate &&
          designFollowsPackRate(
            { rate: product.rate, rateMax: product.rateMax },
            '',
          ) &&
          !opts.keepRateIds.has(productId)
        ) {
          patch.rate = parsed.rate;
          patch.rateMax = parsed.rateMax;
        }
        if (applyToAll) {
          if (parsed.unit) patch.unit = parsed.unit;
          if (parsed.dispatchUnit) patch.dispatchUnit = parsed.dispatchUnit;
          if (parsed.piecesPerPack != null) patch.piecesPerPack = parsed.piecesPerPack;
          if (parsed.moq != null) patch.moq = parsed.moq;
        }
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
      navigate(
        appended ? `/catalog/collections/${collectionId}` : '/catalog?tab=collections',
        appended
          ? { replace: true }
          : {
              replace: true,
              state: {
                collectionFilter: opts.publish ? 'published' : 'draft',
                productFilter: opts.publish ? 'published' : 'draft',
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

  const onEditorReplaceConfirm = () => {
    setReplaceSheetOpen(false);
    beginReplacePick();
  };

  const onEditorRemove = async () => {
    if (!ownerCanRemove) return;
    setManageBusy(true);
    try {
      const next = membershipAfterRemove([...selected], manageSelectedIds);
      setSelected(new Set(next));
      await persistDesigns(next);
      clearManageSelect();
      showToast('Removed from collection');
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
            ? 'Deleted from this collection'
            : 'Removed from collection',
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
      JSON.stringify({
        name: form.name,
        description: form.description,
        coverImage: form.coverImage,
        categories: form.categories,
        productIds: [...selected].sort(),
      }),
    [form, selected],
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
    setMemberForm({
      name: product.name,
      rate: formatRateInput(product.rate, product.rateMax ?? null),
      unit: product.unit || Unit.Set,
      dispatchUnit: product.dispatchUnit || Unit.Piece,
      piecesPerPack:
        product.piecesPerPack != null ? String(product.piecesPerPack) : '',
      moq: product.moq != null ? String(product.moq) : '',
      notes: product.description ?? '',
      categories: product.categories ?? [],
    });
    setMemberTagSlots(categoriesToTagSlots(product.categories ?? []));
    setMemberPhotos(
      product.images.map((url) => ({ id: crypto.randomUUID(), url })),
    );
    setMemberSheet({ kind: 'product', productId: product.id });
  };

  const openPendingDesignSheet = (localId: string) => {
    const photo = pendingPhotos.find((p) => p.localId === localId);
    if (!photo) return;
    const pendingCats =
      photo.tagsDirty || photo.categories.length > 0
        ? photo.categories
        : [...form.categories];
    setMemberForm({
      name: nameForNewDesign(photo.name, photo.sku),
      rate: photo.rate,
      unit: photo.unit || Unit.Set,
      dispatchUnit: photo.dispatchUnit || Unit.Piece,
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
          piecesPerPack: fields.piecesPerPack ?? null,
          moq: fields.moq ?? null,
          categories: memberForm.categories,
          images: memberPhotos.map((p) => p.url).filter((u) => !u.startsWith('blob:')),
        });
        void queryClient.invalidateQueries({ queryKey: ['my-products'] });
        void queryClient.invalidateQueries({ queryKey: ['collection', id] });
        showToast('Design updated');
      }
      setMemberSheet(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save design.');
    } finally {
      setMemberSaving(false);
    }
  };

  const useSameAsAllOnMember = () => {
    if (!memberSheet) return;
    const next = forceSameForAllToForm(memberForm, { ...sameForAll, categories: [] });
    const categories = unionTags(memberForm.categories, form.categories);
    setMemberForm({
      ...next,
      categories,
    });
    setMemberTagSlots(categoriesToTagSlots(categories));
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
      ...createLibraryDesigns.map((product) => ({
        id: product.id,
        kind: 'library' as const,
        product,
      })),
    ],
    diffIds,
  );
  const parentKeys = parentKeysFromCompanyCategories(
    company.data?.sellCategories ?? [],
    company.data?.superCategories ?? [],
  );
  const setTagSlots = (next: TagSlots) => {
    if (tagSlotsToCategories(next).length > 20) return;
    setTagSlotsState(next);
    setForm({ ...form, categories: tagSlotsToCategories(next) });
    for (const item of next.items) {
      const suggested = unitsSuggestedByItem(mainsForCompany(parentKeys), item);
      if (!suggested) continue;
      setSameForAll((prev) => ({
        ...prev,
        unit: prev.unit || suggested.orderUnit,
        dispatchUnit: prev.dispatchUnit || suggested.dispatchUnit,
        piecesPerPack:
          prev.piecesPerPack.trim() ||
          (suggested.piecesPerPack != null ? String(suggested.piecesPerPack) : ''),
      }));
      break;
    }
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
      <Field label="Collection name" error={error}>
        <TextInput
          aria-label="Collection name"
          value={form.name}
          onChange={(e) => {
            setError(null);
            setForm({ ...form, name: e.target.value });
          }}
          placeholder="Name this collection"
          autoComplete="off"
        />
      </Field>
      <RateRangeFields
        from={rateFrom}
        to={rateTo}
        rateUnit={
          catalogRateDisplayUnit({
            unit: sameForAll.unit || Unit.Set,
            dispatchUnit: sameForAll.dispatchUnit || Unit.Piece,
          }) ?? Unit.Piece
        }
        onRateUnit={(next) => {
          setSameForAll((prev) => {
            const orderUnit = prev.unit || Unit.Set;
            if (isPackOrderUnit(orderUnit)) {
              return { ...prev, dispatchUnit: next };
            }
            return { ...prev, unit: next };
          });
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
      <Field label="Description">
        <TextArea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="optional"
        />
      </Field>
      <CascadeTagsFields
        items={tagSlots.items}
        qualities={tagSlots.qualities}
        size={tagSlots.size}
        parentKeys={parentKeys}
        onItems={(items) => setTagSlots({ ...tagSlots, items })}
        onQualities={(qualities) => setTagSlots({ ...tagSlots, qualities })}
        onSize={(size) => setTagSlots({ ...tagSlots, size })}
      />
      {isCreate ? whoExpandable : null}
      <button
        type="button"
        role="checkbox"
        aria-checked={applyToAll}
        data-testid="collection-apply-all"
        className={cx(
          'flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm',
          applyToAll
            ? 'border-accent bg-accent/5 font-medium text-ink'
            : 'border-line text-ink',
        )}
        onClick={() => setApplyToAllRemembered(!applyToAll)}
      >
        <span
          className={cx(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px]',
            applyToAll ? 'border-accent bg-accent text-white' : 'border-line bg-surface',
          )}
          aria-hidden
        >
          {applyToAll ? <CheckIcon width={14} height={14} strokeWidth={2.5} /> : null}
        </span>
        <span className="flex flex-col gap-0.5">
          <span>Apply this info to all designs</span>
          <span className="text-xs font-normal text-muted">
            Units and MOQ — not rates. Designs keep their own rate.
          </span>
        </span>
      </button>
      <CollectionExpandableSection
        title="Order and dispatch"
        summary={orderDispatchSectionSummary({
          orderUnit: sameForAll.unit || Unit.Set,
          piecesPerPack: sameForAll.piecesPerPack,
          dispatchUnit: sameForAll.dispatchUnit || Unit.Piece,
          moq: sameForAll.moq,
        })}
        open={orderDispatchExpanded}
        onToggle={() => setOrderDispatchExpanded((v) => !v)}
        testId="collection-order-dispatch"
      >
        <OrderDispatchFields
          hideHeading
          orderUnit={sameForAll.unit || Unit.Set}
          piecesPerPack={sameForAll.piecesPerPack}
          dispatchUnit={sameForAll.dispatchUnit || Unit.Piece}
          moq={sameForAll.moq}
          onOrderUnit={(unit) => setSameForAll((prev) => ({ ...prev, unit }))}
          onPiecesPerPack={(piecesPerPack) =>
            setSameForAll((prev) => ({ ...prev, piecesPerPack }))
          }
          onDispatchUnit={(dispatchUnit) =>
            setSameForAll((prev) => ({ ...prev, dispatchUnit }))
          }
          onMoq={(moq) => setSameForAll((prev) => ({ ...prev, moq }))}
        />
      </CollectionExpandableSection>
    </div>
  );

  const canOpenCreatePublish =
    !creating && !quickUploading && createMemberCount >= 1 && Boolean(form.name.trim());
  const canCreatePublish =
    canOpenCreatePublish &&
    (canPublishAlready || consent) &&
    publishAudienceCanSubmit(publishAudience);

  const canCreateDraft =
    !creating && !quickUploading && createMemberCount >= 1 && Boolean(form.name.trim());

  // No early returns above — loading/error are branches so hook order never changes.
  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading collection…" />;
  }
  if (editing && (existing.isError || !existing.data)) {
    return (
      <>
        <PageHeader title="Edit collection" />
        <p className="text-center text-sm text-danger">
          {existing.error instanceof ApiError
            ? existing.error.message
            : 'Could not load this collection.'}
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
  if (isArchived) {
    lifecycleMoreItems.push({
      id: 'restore',
      label: 'Restore to draft',
      icon: <UnlockIcon width={20} height={20} />,
      disabled: lifecycle.isPending,
      onClick: () => {
        setMoreOpen(false);
        lifecycle.mutate('unarchive');
      },
    });
  } else if (isPublished) {
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
        label: 'Hide from Explore',
        icon: <LockIcon width={20} height={20} />,
        disabled: lifecycle.isPending,
        onClick: () => {
          setMoreOpen(false);
          lifecycle.mutate('unpublish');
        },
      },
      {
        id: 'archive',
        label: 'Archive',
        icon: <CollectionIcon width={20} height={20} />,
        disabled: lifecycle.isPending,
        danger: true,
        onClick: () => {
          setMoreOpen(false);
          lifecycle.mutate('archive');
        },
      },
    );
  } else {
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
        label: 'Archive',
        icon: <CollectionIcon width={20} height={20} />,
        disabled: lifecycle.isPending,
        danger: true,
        onClick: () => {
          setMoreOpen(false);
          lifecycle.mutate('archive');
        },
      },
    );
  }

  return (
    <div className={cx('flex flex-col gap-4', editing ? 'pb-44' : 'pb-52')}>
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title={editing ? 'Edit collection' : 'New collection'}
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

      {editing && existing.data && (ownerSourceLine || (isPublished && existing.data.rateVisibility === RateVisibility.OnRequest)) ? (
        <div className="-mt-2 flex flex-col gap-1">
          {ownerSourceLine ? (
            <p className="text-sm font-semibold tracking-tight text-ink" data-testid="collection-editor-source">
              {ownerSourceLine}
            </p>
          ) : null}
          {isPublished && existing.data.rateVisibility === RateVisibility.OnRequest ? (
            <p className="text-xs text-muted">Buyers may need to ask for rates</p>
          ) : null}
        </div>
      ) : null}

      {collectionEditShowsMemberGrid(editing) ? (
        <>
          {pendingPhotos.length === 0 && createLibraryDesigns.length === 0 ? (
            <AddDesignsControl
              size="hero"
              uploading={quickUploading}
              disabled={quickUploading}
              photosDisabled={pendingPhotos.length >= QUICK_PHOTO_CAP}
              onDesigns={pickSourceDesigns}
              onPhotos={pickSourcePhotos}
            />
          ) : (
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
                          <img
                            src={photo.images[0].previewUrl}
                            alt=""
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
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/40 text-xs font-bold text-white">
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
                        <img
                          src={product.images[0]}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted">
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
                      onClick={() => toggleLibraryPick(product.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              }}
            />
          )}

          {pendingPhotos.length > 0 || createLibraryDesigns.length > 0 ? (
            <>
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
            </>
          ) : null}

          {identityFields}
        </>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-4" data-testid="collection-edit-details">
          {identityFields}
        </div>
      ) : null}

      <MoreActionsSheet
        open={moreOpen && showLifecycleMenu}
        onClose={() => setMoreOpen(false)}
        title={form.name.trim() || 'Collection'}
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
            onDelete={() => void onEditorDelete()}
            onRemove={() => void onEditorRemove()}
            onUpdate={() => save.mutate()}
            updatePending={save.isPending || savingDesigns}
            updateDisabled={!form.name.trim() || selected.size < 1 || save.isPending || savingDesigns}
          />
          <OwnerPackReplaceSheet
            open={replaceSheetOpen}
            onClose={() => setReplaceSheetOpen(false)}
            busy={manageBusy}
            onConfirm={() => void onEditorReplaceConfirm()}
          />
          <OwnerPackDeleteSheet
            open={deleteSheetOpen}
            onClose={() => setDeleteSheetOpen(false)}
            busy={manageBusy}
            onDeleteEverywhere={() => void finishEditorDelete('everywhere')}
            onOnlyThisCollection={() => void finishEditorDelete('only-here')}
          />
        </>
      ) : null}

      {!editing
        ? createPortal(
            <div
              className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md"
              data-testid="collection-create-dock"
            >
              <div className="mx-auto flex max-w-md gap-2">
                <Button
                  className="min-w-0 flex-1"
                  disabled={!canOpenCreatePublish}
                  onClick={() => {
                    if (!canCreatePublish) {
                      setWhoExpanded(true);
                      setError(
                        !canPublishAlready && !consent
                          ? 'Confirm you can sell on Ekum under Who can see this.'
                          : 'Pick who can see this collection.',
                      );
                      showToast(
                        !canPublishAlready && !consent
                          ? 'Confirm you can sell on Ekum'
                          : 'Pick who can see this collection',
                        'danger',
                      );
                      return;
                    }
                    void onCreate({ publish: true });
                  }}
                >
                  {creating ? 'Publishing…' : 'Create & Publish'}
                </Button>
                <Button
                  variant="secondary"
                  className="min-w-0 flex-1"
                  disabled={!canCreateDraft}
                  onClick={() => void onCreate()}
                >
                  {creating ? 'Saving…' : 'Save in Draft'}
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}

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
          <p className="text-sm text-muted">
            {replaceDraft !== null
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
                loadMoreTestId="collection-library-load-more"
                renderTile={(product) => {
                  const on = editing
                    ? replaceDraft !== null
                      ? replaceDraft.has(product.id)
                      : selected.has(product.id)
                    : libraryPicks.has(product.id);
                  return (
                    <button
                      type="button"
                      onClick={() =>
                        editing ? toggle(product.id) : toggleLibraryPick(product.id)
                      }
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
                        <span className="absolute right-1 top-1 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-badge text-sm font-bold text-white">
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

      <Sheet
        open={publishOpen}
        onClose={() => {
          if (creating) return;
          setPublishOpen(false);
          setSheetError(null);
        }}
        title={
          !editing
            ? 'Create & Publish'
            : isPublished
              ? 'Visibility & rates'
              : 'Publish collection'
        }
        footer={
          <Button
            fullWidth
            disabled={
              editing
                ? !canSubmitPublish || publish.isPending
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
            {creating || publish.isPending
              ? 'Publishing…'
              : !editing
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
                : 'Publishing this collection puts it on Explore — not each design separately. Buyers can still order or share designs from inside the collection.'}
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
            consentLabel={
              hasForeignMembers
                ? "You're sharing others' designs under their rules — publish this collection?"
                : 'Start selling — publish this collection?'
            }
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
                disabled={memberSaving || savingDesigns}
                data-testid="collection-member-sheet-set-live"
                onClick={() => void setMemberLiveInPack()}
              >
                {savingDesigns ? 'Publishing…' : 'Publish'}
              </Button>
            ) : null}
            <Button
              fullWidth
              variant={memberSheetCanSetLive ? 'secondary' : 'primary'}
              disabled={memberSaving}
              onClick={() => void saveMemberSheet()}
            >
              {memberSaving ? 'Saving…' : 'Done'}
            </Button>
            {!sameForAllIsEmpty(sameForAll) &&
            (pendingPhotos.length + (editing ? selectedProducts.length : libraryPicks.size) >
              1) ? (
              <Button variant="ghost" fullWidth disabled={memberSaving} onClick={useSameAsAllOnMember}>
                Use same as all designs
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {memberPhotos.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-foam"
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
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
                  <span className="text-xs font-medium">Add photos</span>
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
          {memberSheet?.kind === 'product'
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
          <CascadeTagsFields
            items={memberTagSlots.items}
            qualities={memberTagSlots.qualities}
            size={memberTagSlots.size}
            parentKeys={parentKeys}
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
            onSize={(size) => {
              const next = { ...memberTagSlots, size };
              if (tagSlotsToCategories(next).length > 20) return;
              setMemberTagSlots(next);
              setMemberForm({
                ...memberForm,
                categories: tagSlotsToCategories(next),
              });
            }}
          />
          <RateRangeFields
            label={catalogRateFieldLabel(
              memberForm.unit || Unit.Set,
              memberForm.dispatchUnit || Unit.Piece,
            )}
            from={splitRateInput(memberForm.rate).from}
            to={splitRateInput(memberForm.rate).to}
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
          <OrderDispatchFields
            orderUnit={memberForm.unit || Unit.Set}
            piecesPerPack={memberForm.piecesPerPack}
            dispatchUnit={memberForm.dispatchUnit || Unit.Piece}
            moq={memberForm.moq}
            onOrderUnit={(unit) => setMemberForm({ ...memberForm, unit })}
            onPiecesPerPack={(piecesPerPack) =>
              setMemberForm({ ...memberForm, piecesPerPack })
            }
            onDispatchUnit={(dispatchUnit) =>
              setMemberForm({ ...memberForm, dispatchUnit })
            }
            onMoq={(moq) => setMemberForm({ ...memberForm, moq })}
          />
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
        title="This collection already exists"
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
          You already have “{nameClash?.name || form.name.trim()}”. Add these designs to that collection,
          or type a new name.
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
