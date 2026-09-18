import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  CollectionDetailView,
  CompanySettingsView,
  ConnectionView,
  CreateCollectionDto,
  CreateProductDto,
  ProductView,
  PublishCollectionDto,
} from '@ekum/domain-types';
import {
  CollectionStatus,
  ProductStatus,
  PublishAudience,
  RateVisibility,
  Unit,
  unitValues,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
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
import { TagsField } from './TagsField';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { nameFromFilename, COLLECTION_QUICK_PHOTO_CAP, collectionCameraMaxShots } from './collectionCreateHelpers';
import {
  applySameForAllToForm,
  emptySameForAll,
  memberDiffersFromSameForAll,
  productFieldsFromMember,
  sameForAllIsEmpty,
  sameForAllSummary,
  type MemberDesignForm,
  type SameForAllDetails,
} from './collectionSameForAll';
import { formatRateInput } from './rateInput';
import {
  CAMERA_APPEND_SOFT_MAX,
  morePhotosEntry,
} from './designBatchHelpers';
import { createPortal } from 'react-dom';
import { CameraIcon, MoreHorizontalIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { collectionOwnerSourceLine } from './collectionOwnerSourceLine';
import { collectionStatusSummary } from './collectionStatusSummary';
import { auditLine } from './productStatusSummary';
import {
  maxPublishAudienceForCuratedPack,
} from './curationAudienceCeiling';
import { audienceForPublishSheet } from './publishAudienceOptions';
import { readCompanyPublishDefaults } from './publishDefaults';
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
  name: string;
  rate: string;
  unit: string;
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

function unitSelect(
  value: string,
  onChange: (next: string) => void,
) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
    >
      {unitValues.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  );
}

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
  const moreAnchorRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const [morePos, setMorePos] = useState({ top: 0, right: 0 });
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSession, setCameraSession] = useState(0);
  /** Desktop, or camera unavailable — Photo library / Designs. Not the OS picker. */
  const [sourceOpen, setSourceOpen] = useState(false);
  const [quickUploading, setQuickUploading] = useState(false);
  const [savingDesigns, setSavingDesigns] = useState(false);
  const [creating, setCreating] = useState(false);
  const [designSearch, setDesignSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverImage: '',
    categories: [] as string[],
  });
  const leaveBypassRef = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
    unit: Unit.Piece,
    moq: '',
    notes: '',
    categories: [],
  });
  const [memberPhotos, setMemberPhotos] = useState<MemberPhotoThumb[]>([]);
  const [memberSaving, setMemberSaving] = useState(false);
  const [sameForAll, setSameForAll] = useState<SameForAllDetails>(() =>
    emptySameForAll(Unit.Piece),
  );
  const [sameForAllDraft, setSameForAllDraft] = useState<SameForAllDetails>(() =>
    emptySameForAll(Unit.Piece),
  );
  const [sameForAllOpen, setSameForAllOpen] = useState(false);
  const [diffIds, setDiffIds] = useState<Set<string>>(() => new Set());
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
    enabled: publishOpen,
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled:
      editing ||
      (publishOpen && publishAudience.audience === PublishAudience.Selected),
  });
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: publishOpen,
  });

  const canPublishAlready = Boolean(company.data?.capabilities.publish);
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');
  const status = existing.data?.status;
  const isPublished = status === CollectionStatus.Published;
  const isDraft =
    status === CollectionStatus.Draft || status === CollectionStatus.Ready;
  const isArchived = status === CollectionStatus.Archived;
  const statusSummary = existing.data
    ? collectionStatusSummary(existing.data, broadcastLists.data ?? [])
    : null;
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
      setForm({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
        categories: existing.data.categories ?? [],
      });
      setSelected(new Set(existing.data.products.map((product) => product.id)));
      setPublishAudience(
        restorePublishAudienceState({
          audience: existing.data.audience || PublishAudience.Followers,
          audienceCompanyIds: existing.data.audienceCompanyIds ?? [],
          audienceGroupIds: existing.data.audienceGroupIds ?? [],
          rateVisibility: existing.data.rateVisibility,
          allowForward: existing.data.allowForward !== false,
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
      policyHint: hasForeignMembers
        ? 'Rates stay on request when this pack includes others’ designs.'
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
    const state = location.state as { notice?: string; openPublish?: boolean } | null;
    if (!state?.notice && !state?.openPublish) return;
    if (state.notice) showToast(state.notice);
    if (state.openPublish) setPublishOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, showToast]);

  useLayoutEffect(() => {
    if (!moreOpen) return;
    const place = () => {
      const anchor = moreAnchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setMorePos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (morePanelRef.current?.contains(target)) return;
      if (moreAnchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [moreOpen]);

  const invalidate = (collectionId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['collection', collectionId ?? id] });
    void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
    void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['explore'] });
  };

  const persistDesigns = async (productIds: string[], collectionId = id) => {
    if (!collectionId) return;
    setSavingDesigns(true);
    try {
      await api.put(`/collections/${collectionId}/products`, { productIds });
      invalidate(collectionId);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update designs.';
      showToast(message, 'danger');
    } finally {
      setSavingDesigns(false);
    }
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
      const dto: CreateCollectionDto = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        categories: form.categories,
      };
      return api.patch<CollectionDetailView>(`/collections/${id}`, dto);
    },
    onSuccess: () => {
      invalidate();
      showToast('Updated');
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

  const openCollectionGallery = () => {
    setError(null);
    queueMicrotask(() => designFileRef.current?.click());
  };

  const openCollectionCamera = (append: CameraAppendTarget | null = null) => {
    if (!append && pendingPhotos.length >= QUICK_PHOTO_CAP && !editing) {
      setError(`You can add up to ${QUICK_PHOTO_CAP} photos.`);
      return;
    }
    setError(null);
    cameraAppendRef.current = append;
    setCameraAppend(append);
    // Start getUserMedia in this tap. Phones ignore a later effect call.
    void acquireMediaStream('camera', continuousCameraConstraints);
    setCameraSession((n) => n + 1);
    setCameraOpen(true);
  };

  /** Same camera on phone and desktop. Gallery and Designs live on that chrome. */
  const openDesignPicker = () => {
    cameraAppendRef.current = null;
    setCameraAppend(null);
    openCollectionCamera(null);
  };

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
    openCollectionGallery();
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
    const stubs: PendingPhoto[] = selected.map((file) => ({
      localId: crypto.randomUUID(),
      images: [
        {
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
          imageUrl: null,
          uploading: true,
        },
      ],
      name: nameFromFilename(file.name),
      rate: shared.rate,
      unit: shared.unit || Unit.Piece,
      moq: shared.moq,
      notes: shared.notes,
      categories:
        shared.categories.length > 0 ? [...shared.categories] : [],
      tagsDirty: shared.categories.length > 0,
    }));
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
    setError(null);
    setQuickUploading(true);
    try {
      const createdIds: string[] = [];
      const shared = sameForAll;
      for (const file of picked) {
        const imageUrl = await uploadImage(file);
        const parsed = productFieldsFromMember({
          name: nameFromFilename(file.name),
          rate: shared.rate,
          unit: shared.unit || Unit.Piece,
          moq: shared.moq,
          notes: shared.notes,
          categories:
            shared.categories.length > 0 ? [...shared.categories] : [],
        });
        const dto: CreateProductDto = {
          name: nameFromFilename(file.name),
          images: [imageUrl],
          categories: parsed.categories ?? [],
          description: parsed.description,
          rate: parsed.rate ?? undefined,
          rateMax: parsed.rateMax ?? undefined,
          unit: parsed.unit as CreateProductDto['unit'],
          moq: parsed.moq ?? undefined,
        };
        const product = await api.post<ProductView>('/products', dto);
        createdIds.push(product.id);
      }
      const next = new Set(selected);
      for (const productId of createdIds) next.add(productId);
      setSelected(next);
      await persistDesigns([...next]);
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
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

  const onCreate = async (opts?: { publish?: boolean }) => {
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
        setSheetError('Choose who can see this pack.');
        setCreating(false);
        return;
      }
    }
    setCreating(true);
    setError(null);
    setSheetError(null);
    try {
      const name = form.name.trim();
      const coverRaw = createCoverUrl ? toAbsoluteMediaUrl(createCoverUrl) : '';
      const cover =
        coverRaw && /^https?:\/\//i.test(coverRaw) ? coverRaw : undefined;
      const created = await api.post<CollectionDetailView>('/collections', {
        name,
        description: form.description.trim() || undefined,
        categories: form.categories,
        ...(cover ? { coverImage: cover } : {}),
      } satisfies CreateCollectionDto);
      const createdIds: string[] = [];
      for (const photo of readyCreatePhotos) {
        const categories =
          photo.tagsDirty || photo.categories.length > 0
            ? photo.categories
            : form.categories;
        const fields = productFieldsFromMember({
          name: photo.name,
          rate: photo.rate,
          unit: photo.unit,
          moq: photo.moq,
          notes: photo.notes,
          categories,
        });
        const product = await api.post<ProductView>('/products', {
          name: photo.name,
          images: photo.images.map((img) => toAbsoluteMediaUrl(img.imageUrl!)),
          categories: fields.categories ?? categories,
          description: fields.description,
          rate: fields.rate ?? undefined,
          rateMax: fields.rateMax ?? undefined,
          unit: fields.unit as CreateProductDto['unit'],
          moq: fields.moq ?? undefined,
        } satisfies CreateProductDto);
        createdIds.push(product.id);
      }
      // Cascade collection tags onto library picks that have no categories yet.
      for (const productId of libraryPicks) {
        const product = selectableDesigns.find((p) => p.id === productId);
        if (!product || product.categories.length > 0 || form.categories.length === 0) {
          continue;
        }
        await api.patch(`/products/${productId}`, { categories: form.categories });
      }
      const productIds = [...createdIds, ...libraryPicks];
      await api.put<CollectionDetailView>(
        `/collections/${created.id}/products`,
        { productIds },
      );
      if (opts?.publish) {
        await api.post(`/collections/${created.id}/publish`, {
          audience: publishAudience.audience,
          rateVisibility: publishAudience.rateVisibility,
          allowForward: publishAudience.allowForward,
          ...publishAudienceDtoFields(publishAudience),
          ...(canPublishAlready ? {} : { consentToSell: true }),
        });
      }
      for (const photo of pendingPhotos) {
        for (const img of photo.images) {
          if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
        }
      }
      setPendingPhotos([]);
      setLibraryPicks(new Set());
      setPublishOpen(false);
      leaveBypassRef.current = true;
      showToast(opts?.publish ? 'Published' : 'Collection saved');
      navigate('/catalog?tab=collections', {
        replace: true,
        state: {
          collectionFilter: opts?.publish ? 'published' : 'draft',
        },
      });
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    } catch (err) {
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

  const toggle = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      scheduleDesignSave(next);
      return next;
    });
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
    setDiffIds((prev) => {
      if (!prev.has(localId)) return prev;
      const next = new Set(prev);
      next.delete(localId);
      return next;
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
      unit: product.unit || Unit.Piece,
      moq: product.moq != null ? String(product.moq) : '',
      notes: product.description ?? '',
      categories: product.categories ?? [],
    });
    setMemberPhotos(
      product.images.map((url) => ({ id: crypto.randomUUID(), url })),
    );
    setMemberSheet({ kind: 'product', productId: product.id });
  };

  const openPendingDesignSheet = (localId: string) => {
    const photo = pendingPhotos.find((p) => p.localId === localId);
    if (!photo) return;
    setMemberForm({
      name: photo.name,
      rate: photo.rate,
      unit: photo.unit || Unit.Piece,
      moq: photo.moq,
      notes: photo.notes,
      categories:
        photo.tagsDirty || photo.categories.length > 0
          ? photo.categories
          : sameForAll.categories.length > 0
            ? [...sameForAll.categories]
            : [...form.categories],
    });
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

  const markDiff = (id: string, differs: boolean) => {
    setDiffIds((prev) => {
      const has = prev.has(id);
      if (differs && has) return prev;
      if (!differs && !has) return prev;
      const next = new Set(prev);
      if (differs) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const confirmSameForAll = async () => {
    const next = sameForAllDraft;
    setSameForAll(next);
    setSameForAllOpen(false);
    setPendingPhotos((prev) =>
      prev.map((p) => {
        if (diffIds.has(p.localId)) return p;
        return {
          ...p,
          rate: next.rate.trim() ? next.rate : p.rate,
          unit: next.unit.trim() ? next.unit : p.unit,
          moq: next.moq.trim() ? next.moq : p.moq,
          notes: next.notes.trim() ? next.notes : p.notes,
          categories:
            next.categories.length > 0 ? [...next.categories] : p.categories,
          tagsDirty: next.categories.length > 0 ? true : p.tagsDirty,
        };
      }),
    );
    if (!editing || !id) return;
    const ownId = company.data?.id;
    const targets = selectedProducts.filter(
      (p) => p.companyId === ownId && !diffIds.has(p.id),
    );
    if (targets.length === 0 || sameForAllIsEmpty(next)) return;
    setSavingDesigns(true);
    try {
      for (const product of targets) {
        const fields = productFieldsFromMember({
          name: product.name,
          rate: next.rate.trim() ? next.rate : formatRateInput(product.rate, product.rateMax ?? null),
          unit: next.unit.trim() ? next.unit : product.unit || Unit.Piece,
          moq: next.moq.trim() ? next.moq : product.moq != null ? String(product.moq) : '',
          notes: next.notes.trim() ? next.notes : product.description ?? '',
          categories:
            next.categories.length > 0
              ? [...next.categories]
              : product.categories ?? [],
        });
        await api.patch(`/products/${product.id}`, {
          description: fields.description,
          rate: fields.rate,
          rateMax: fields.rateMax,
          unit: fields.unit,
          moq: fields.moq ?? null,
          categories: fields.categories,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      void queryClient.invalidateQueries({ queryKey: ['collection', id] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not apply details.');
    } finally {
      setSavingDesigns(false);
    }
  };

  const saveMemberSheet = async () => {
    if (!memberSheet) return;
    setMemberSaving(true);
    setError(null);
    try {
      const differs = memberDiffersFromSameForAll(memberForm, sameForAll);
      if (memberSheet.kind === 'pending') {
        const imageUrls = memberPhotos.map((p) => p.url).filter(Boolean);
        setPendingPhotos((prev) =>
          prev.map((p) =>
            p.localId === memberSheet.localId
              ? {
                  ...p,
                  name: memberForm.name.trim() || p.name,
                  rate: memberForm.rate,
                  unit: memberForm.unit,
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
        markDiff(memberSheet.localId, differs);
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
          moq: fields.moq ?? null,
          categories: memberForm.categories,
          images: memberPhotos.map((p) => p.url).filter((u) => !u.startsWith('blob:')),
        });
        markDiff(memberSheet.productId, differs);
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
    const next = applySameForAllToForm(memberForm, sameForAll);
    setMemberForm(next);
    markDiff(
      memberSheet.kind === 'pending' ? memberSheet.localId : memberSheet.productId,
      false,
    );
  };

  const sameForAllLine = sameForAllSummary(sameForAll);
  const sameForAllRow = (
    <button
      type="button"
      data-testid="collection-same-for-all"
      onClick={() => {
        setSameForAllDraft(sameForAll);
        setSameForAllOpen(true);
      }}
      className={cx(
        'flex w-full flex-col gap-0.5 rounded-xl border px-3 py-3 text-left',
        sameForAllLine ? 'border-line bg-surface' : 'border-dashed border-line',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">Same for all designs</span>
        <span aria-hidden className="text-muted">
          ›
        </span>
      </span>
      {sameForAllLine ? (
        <span className="text-xs text-muted">
          {sameForAllLine}
          {diffIds.size > 0 ? ` · ${diffIds.size} Diff` : ''}
        </span>
      ) : (
        <span className="text-xs text-muted">
          Optional · applies to every design here and new ones you add
        </span>
      )}
    </button>
  );

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

  return (
    <div className={cx('flex flex-col gap-4', editing ? 'pb-44' : 'pb-8')}>
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title={editing ? 'Edit collection' : 'New collection'}
        onBack={() => discard.tryLeave(() => navigate(-1))}
        action={
          editing && existing.data ? (
            <div className="flex items-center gap-1">
              {id ? (
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5"
                  onClick={() => navigate(`/collections/${id}`)}
                >
                  Open
                </button>
              ) : null}
              {showLifecycleMenu ? (
                <button
                  ref={moreAnchorRef}
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
              ) : null}
            </div>
          ) : undefined
        }
      />

      {editing && existing.data && statusSummary ? (
        <div className="-mt-2 flex flex-col gap-1">
          {isPublished ? (
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="text-left text-sm text-muted"
            >
              {statusSummary.line}
              {auditLine(existing.data) ? ` · ${auditLine(existing.data)}` : ''}
            </button>
          ) : (
            <p className="text-sm text-muted">
              {statusSummary.line}
              {auditLine(existing.data) ? ` · ${auditLine(existing.data)}` : ''}
            </p>
          )}
          {ownerSourceLine ? <p className="text-xs text-muted">{ownerSourceLine}</p> : null}
          {isPublished && existing.data.rateVisibility === RateVisibility.OnRequest ? (
            <p className="text-xs text-muted">Buyers may need to ask for rates</p>
          ) : null}
        </div>
      ) : null}

      {!editing ? (
        <>
          <p className="text-sm text-muted">First item is the cover.</p>
          <button
            type="button"
            data-testid="collection-add-designs"
            onClick={openDesignPicker}
            disabled={quickUploading || pendingPhotos.length >= QUICK_PHOTO_CAP}
            className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam px-3 text-muted disabled:opacity-40"
          >
            <CameraIcon width={32} height={32} />
            <span className="text-base font-semibold text-ink">
              {quickUploading ? 'Uploading…' : 'Designs'}
            </span>
          </button>

          {pendingPhotos.length > 0 || createLibraryDesigns.length > 0 ? (
            <CappedMediaGrid
              items={[
                ...pendingPhotos.map((photo, index) => ({
                  kind: 'photo' as const,
                  photo,
                  index,
                })),
                ...createLibraryDesigns.map((product, index) => ({
                  kind: 'library' as const,
                  product,
                  index,
                })),
              ]}
              getKey={(tile) =>
                tile.kind === 'photo' ? tile.photo.localId : tile.product.id
              }
              overflowPreviewUrl={(tile) =>
                tile.kind === 'photo'
                  ? tile.photo.images[0]?.previewUrl ?? null
                  : tile.product.images[0] ?? null
              }
              renderTile={(tile) => {
                if (tile.kind === 'photo') {
                  const { photo, index } = tile;
                  return (
                    <div className="relative aspect-square min-w-0 w-full overflow-hidden rounded-xl bg-foam">
                      <button
                        type="button"
                        className="absolute inset-0 block text-left"
                        data-testid="collection-pending-tile"
                        onClick={() => openPendingDesignSheet(photo.localId)}
                        aria-label={`Edit design · ${photo.name}`}
                      >
                        {photo.images[0] ? (
                          <img
                            src={photo.images[0].previewUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : null}
                      </button>
                      {index === 0 && !photo.images.some((img) => img.uploading) ? (
                        <span className="pointer-events-none absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Cover
                        </span>
                      ) : null}
                      {diffIds.has(photo.localId) ? (
                        <span className="pointer-events-none absolute left-1 bottom-1 rounded bg-accent px-1.5 text-[10px] font-bold text-white">
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
                const { product, index } = tile;
                const isCover = readyCreatePhotos.length === 0 && index === 0;
                return (
                  <div className="relative aspect-square min-w-0 w-full overflow-hidden rounded-xl bg-foam">
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
                    {isCover ? (
                      <span className="pointer-events-none absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Cover
                      </span>
                    ) : null}
                    {diffIds.has(product.id) ? (
                      <span className="pointer-events-none absolute left-1 bottom-1 rounded bg-accent px-1.5 text-[10px] font-bold text-white">
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
          ) : null}

          {(pendingPhotos.length > 0 || createLibraryDesigns.length > 0) && (
            <p className="text-xs text-muted">Tap a design to edit or add photos.</p>
          )}
          {sameForAllRow}

          {/* In-flow on create — fixed docks break under ekum-rise (transform containing block). */}
          <Field label="Name" error={error}>
            <TextInput
              value={form.name}
              onChange={(e) => {
                setError(null);
                setForm({ ...form, name: e.target.value });
              }}
              placeholder="e.g. Festive 2026"
              autoComplete="off"
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional — what this pack is for"
            />
          </Field>
          <TagsField
            value={form.categories}
            onChange={(categories) => setForm({ ...form, categories })}
          />
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              disabled={
                creating ||
                quickUploading ||
                createMemberCount < 1 ||
                !form.name.trim()
              }
              onClick={() => setPublishOpen(true)}
            >
              Create & Publish
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={
                creating ||
                quickUploading ||
                createMemberCount < 1 ||
                !form.name.trim()
              }
              onClick={() => void onCreate()}
            >
              {creating && !publishOpen ? 'Saving…' : 'Save in Draft'}
            </Button>
          </div>
        </>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Field label="Name" error={error}>
              <TextInput
                value={form.name}
                onChange={(e) => {
                  setError(null);
                  setForm({ ...form, name: e.target.value });
                }}
                placeholder="Festive 2026"
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional — what this pack is for"
              />
            </Field>
            <TagsField
              value={form.categories}
              onChange={(categories) => setForm({ ...form, categories })}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-ink">
              {selectedProducts.length} design{selectedProducts.length === 1 ? '' : 's'} in collection
            </p>
            <span className="text-sm text-muted">
              {savingDesigns || quickUploading
                ? quickUploading
                  ? 'Adding…'
                  : 'Saving…'
                : null}
            </span>
          </div>

          {selectedProducts.length > 0 ? (
            <CappedMediaGrid
              items={selectedProducts}
              getKey={(product) => product.id}
              overflowPreviewUrl={(product) => product.images[0] ?? null}
              renderTile={(product) => (
                <div className="relative aspect-square min-w-0 w-full overflow-hidden rounded-xl border border-line bg-foam">
                  <button
                    type="button"
                    className="absolute inset-0 block text-left"
                    data-testid="collection-member-tile"
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
                    <span className="absolute inset-x-0 bottom-0 truncate bg-surface/95 px-1.5 py-1 text-sm text-ink">
                      {product.name}
                    </span>
                  </button>
                  {diffIds.has(product.id) ? (
                    <span className="pointer-events-none absolute left-1 top-1 z-[1] rounded bg-accent px-1.5 text-[10px] font-bold text-white">
                      Diff
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name}`}
                    className="absolute right-1 top-1 z-[1] flex h-7 w-7 items-center justify-center rounded-full bg-ink/75 text-sm leading-none text-white"
                    onClick={() => toggle(product.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            />
          ) : (
            <p className="text-sm text-muted">Add designs — photo or from your library.</p>
          )}

          <button
            type="button"
            onClick={openDesignPicker}
            disabled={quickUploading}
            className={cx(
              'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-muted',
              'disabled:opacity-40',
            )}
          >
            <CameraIcon width={18} height={18} />
            {quickUploading ? 'Adding…' : 'Designs'}
          </button>
          {selectedProducts.length > 0 ? (
            <p className="text-xs text-muted">Tap a design to edit or add photos.</p>
          ) : null}
          {sameForAllRow}
        </div>
      ) : null}

      {moreOpen && showLifecycleMenu && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-[60] cursor-default bg-ink/15"
                onClick={() => setMoreOpen(false)}
              />
              <div
                ref={morePanelRef}
                role="menu"
                className="fixed z-[61] min-w-[11rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
                style={{ top: morePos.top, right: morePos.right }}
              >
                {isArchived ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={lifecycle.isPending}
                    className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                    onClick={() => {
                      setMoreOpen(false);
                      lifecycle.mutate('unarchive');
                    }}
                  >
                    Restore to draft
                  </button>
                ) : (
                  <>
                    {isPublished ? (
                      <button
                        type="button"
                        role="menuitem"
                        disabled={lifecycle.isPending}
                        className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                        onClick={() => {
                          setMoreOpen(false);
                          lifecycle.mutate('unpublish');
                        }}
                      >
                        Hide from Explore
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      disabled={lifecycle.isPending}
                      className={cx(
                        'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-danger hover:bg-foam/70 disabled:opacity-40',
                        isPublished && 'border-t border-line/70',
                      )}
                      onClick={() => {
                        setMoreOpen(false);
                        lifecycle.mutate('archive');
                      }}
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
            </>,
            document.body,
          )
        : null}

      {editing && existing.data
        ? createPortal(
            <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
              <div className="mx-auto flex max-w-md flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="min-w-0 flex-1"
                    disabled={!form.name.trim() || save.isPending}
                    onClick={() => save.mutate()}
                  >
                    {save.isPending ? 'Updating…' : 'Update'}
                  </Button>
                  {isArchived ? (
                    <Button
                      className="min-w-0 flex-1"
                      disabled={lifecycle.isPending}
                      onClick={() => lifecycle.mutate('unarchive')}
                    >
                      {lifecycle.isPending ? 'Restoring…' : 'Restore'}
                    </Button>
                  ) : isPublished ? (
                    <>
                      <Button
                        className="min-w-0 flex-1"
                        variant="secondary"
                        onClick={() => setPublishOpen(true)}
                      >
                        Visibility
                      </Button>
                      <Button className="min-w-0 flex-1" onClick={() => setShareOpen(true)}>
                        Share
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="min-w-0 flex-1"
                      disabled={!canPublishAlbum}
                      onClick={() => setPublishOpen(true)}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {sourceOpen && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close"
                className="fixed inset-0 z-[80] cursor-default bg-ink/40"
                onClick={() => setSourceOpen(false)}
              />
              <div
                role="menu"
                data-testid="collection-source-menu"
                className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[81] mx-auto max-w-md overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-4 py-3.5 text-left text-[15px] font-semibold text-ink hover:bg-foam"
                  onClick={() => {
                    setSourceOpen(false);
                    openCollectionGallery();
                  }}
                >
                  Photo library
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="collection-source-designs"
                  className="flex w-full border-t border-line px-4 py-3.5 text-left text-[15px] font-semibold text-ink hover:bg-foam"
                  onClick={() => {
                    setSourceOpen(false);
                    setLibraryOpen(true);
                  }}
                >
                  Designs
                </button>
              </div>
            </>,
            document.body,
          )
        : null}

      <input
        ref={designFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
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
          restoreMemberSheetAfterCamera();
        }}
        onUnavailable={() => {
          setCameraOpen(false);
          if (cameraAppend) {
            restoreMemberSheetAfterCamera();
            cameraAppendRef.current = null;
            setCameraAppend(null);
            return;
          }
          setSourceOpen(true);
        }}
        onGallery={() => {
          setCameraOpen(false);
          openCollectionGallery();
        }}
        onDesigns={
          cameraAppend
            ? undefined
            : () => {
                setCameraOpen(false);
                setLibraryOpen(true);
              }
        }
        onDone={(files) => {
          setCameraOpen(false);
          void ingestPhotoFiles(files);
        }}
      />

      <Sheet
        open={libraryOpen}
        onClose={() => {
          setLibraryOpen(false);
          setDesignSearch('');
        }}
        title="Add designs"
        footer={
          <Button fullWidth onClick={() => setLibraryOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Tap to add. Added designs show in your album — Done when finished.
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
                    ? selected.has(product.id)
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
                : creating ||
                  !form.name.trim() ||
                  !((canPublishAlready || consent) && publishAudienceCanSubmit(publishAudience))
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
                : 'Publishing this pack puts the collection on Explore — not each design separately. Buyers can still order or share designs from inside the pack.'}
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
            showConsent={!canPublishAlready}
            consent={consent}
            onConsent={setConsent}
            consentLabel={
              hasForeignMembers
                ? "You're sharing others' designs under their rules — publish this pack?"
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
            <Button fullWidth disabled={memberSaving} onClick={() => void saveMemberSheet()}>
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
              placeholder="Design name"
            />
          </Field>
          <TagsField
            value={memberForm.categories}
            onChange={(categories) => setMemberForm({ ...memberForm, categories })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate">
              <TextInput
                value={memberForm.rate}
                onChange={(e) => setMemberForm({ ...memberForm, rate: e.target.value })}
                placeholder="1200 or 1200-1400"
                inputMode="decimal"
              />
            </Field>
            <Field label="Unit">
              {unitSelect(memberForm.unit, (unit) => setMemberForm({ ...memberForm, unit }))}
            </Field>
          </div>
          <Field label="Minimum order">
            <TextInput
              type="number"
              min={1}
              inputMode="numeric"
              value={memberForm.moq}
              onChange={(e) => setMemberForm({ ...memberForm, moq: e.target.value })}
              placeholder="100 pieces"
            />
          </Field>
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
        open={sameForAllOpen}
        onClose={() => setSameForAllOpen(false)}
        title="Same for all designs"
        footer={
          <Button fullWidth onClick={() => void confirmSameForAll()}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Optional. Applies to every design here and new ones you add. Tap a design to change
            one.
          </p>
          <TagsField
            label="Tags"
            value={sameForAllDraft.categories}
            onChange={(categories) =>
              setSameForAllDraft((prev) => ({ ...prev, categories }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate">
              <TextInput
                value={sameForAllDraft.rate}
                onChange={(e) =>
                  setSameForAllDraft((prev) => ({ ...prev, rate: e.target.value }))
                }
                placeholder="1200 or 1200-1400"
                inputMode="decimal"
              />
            </Field>
            <Field label="Unit">
              {unitSelect(sameForAllDraft.unit, (unit) =>
                setSameForAllDraft((prev) => ({ ...prev, unit })),
              )}
            </Field>
          </div>
          <Field label="Minimum order">
            <TextInput
              type="number"
              min={1}
              inputMode="numeric"
              value={sameForAllDraft.moq}
              onChange={(e) =>
                setSameForAllDraft((prev) => ({ ...prev, moq: e.target.value }))
              }
              placeholder="100 pieces"
            />
          </Field>
          <Field label="Notes">
            <TextArea
              value={sameForAllDraft.notes}
              onChange={(e) =>
                setSameForAllDraft((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. 44 inch, cotton"
            />
          </Field>
        </div>
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
