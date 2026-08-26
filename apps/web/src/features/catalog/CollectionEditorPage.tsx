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
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
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
import { createPortal } from 'react-dom';
import { CameraIcon, CollectionIcon, MoreHorizontalIcon, PlusIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { resolveOrderPathPreference } from '@/features/browse/orderPathPreference';
import { nameFromFilename } from './collectionCreateHelpers';
import { collectionStatusSummary } from './collectionStatusSummary';
import { auditLine } from './productStatusSummary';
import {
  clampAudienceToCeiling,
  maxPublishAudienceForCuratedPack,
} from './curationAudienceCeiling';
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

const QUICK_PHOTO_CAP = 24;

type PendingPhoto = {
  localId: string;
  previewUrl: string;
  imageUrl: string | null;
  name: string;
  uploading: boolean;
};

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
  const phone = isPhoneLike();
  const [error, setError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreAnchorRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const [morePos, setMorePos] = useState({ top: 0, right: 0 });
  const [designPickerOpen, setDesignPickerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [designCapture, setDesignCapture] = useState<boolean | 'gallery'>('gallery');
  const [quickUploading, setQuickUploading] = useState(false);
  const [savingDesigns, setSavingDesigns] = useState(false);
  const [creating, setCreating] = useState(false);
  const [designSearch, setDesignSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    coverImage: '',
  });
  const leaveBypassRef = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishAudience, setPublishAudience] = useState<PublishAudienceState>(() =>
    emptyPublishAudienceState(),
  );
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [evergreen, setEvergreen] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  const [consent, setConsent] = useState(false);
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
    () => pendingPhotos.filter((p) => p.imageUrl),
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
    readyCreatePhotos[0]?.imageUrl ?? createLibraryDesigns[0]?.images[0] ?? undefined;

  useEffect(() => {
    if (existing.data) {
      setForm({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
      });
      setSelected(new Set(existing.data.products.map((product) => product.id)));
      setPublishAudience(
        restorePublishAudienceState({
          audience: existing.data.audience || PublishAudience.Connections,
          audienceCompanyIds: existing.data.audienceCompanyIds ?? [],
          audienceGroupIds: existing.data.audienceGroupIds ?? [],
          rateVisibility: existing.data.rateVisibility,
          allowForward: existing.data.allowForward !== false,
          orderPathPreference: existing.data.orderPathPreference,
        }),
      );
      setStartsAt(toDateInput(existing.data.startsAt));
      setEndsAt(toDateInput(existing.data.endsAt));
      setEvergreen(!existing.data.endsAt);
      setNoteOpen(Boolean(existing.data.description?.trim()));
      savedSnapshotRef.current = JSON.stringify({
        name: existing.data.name,
        description: existing.data.description ?? '',
        coverImage: existing.data.coverImage ?? '',
        productIds: existing.data.products.map((product) => product.id).sort(),
      });
    }
  }, [existing.data]);

  useEffect(() => {
    if (!publishOpen || !settings.data) return;
    if (existing.data?.status === CollectionStatus.Published) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    const orderPath = resolveOrderPathPreference(settings.data.tradeDefaults);
    setPublishAudience((prev) => ({
      ...prev,
      // Curated packs default rates to on request (source ceiling).
      rateVisibility: hasForeignMembers
        ? RateVisibility.OnRequest
        : usual.rateVisibility,
      allowForward: usual.allowForward,
      orderPathPreference: prev.orderPathPreference || orderPath,
      policyHint: hasForeignMembers
        ? 'Rates stay on request when this pack includes others’ designs.'
        : null,
    }));
  }, [publishOpen, settings.data, existing.data?.status, hasForeignMembers]);

  useEffect(() => {
    if (!publishOpen || !maxCuratedAudience) return;
    setPublishAudience((prev) => {
      const nextAudience = clampAudienceToCeiling(prev.audience, maxCuratedAudience);
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
        orderPathPreference: publishAudience.orderPathPreference,
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

  const openDesignPicker = () => {
    if (phone) {
      setDesignPickerOpen(true);
      return;
    }
    setDesignCapture('gallery');
    queueMicrotask(() => designFileRef.current?.click());
  };

  const pickDesignPhotos = (mode: 'camera' | 'gallery') => {
    setDesignPickerOpen(false);
    setDesignCapture(mode === 'camera' ? true : 'gallery');
    queueMicrotask(() => designFileRef.current?.click());
  };

  const onCreatePhotoFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const room = QUICK_PHOTO_CAP - pendingPhotos.length;
    if (room <= 0) {
      setError(`You can add up to ${QUICK_PHOTO_CAP} photos.`);
      return;
    }
    const files = [...fileList].slice(0, room);
    setError(null);
    const stubs: PendingPhoto[] = files.map((file) => ({
      localId: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      imageUrl: null,
      name: nameFromFilename(file.name),
      uploading: true,
    }));
    setPendingPhotos((prev) => [...prev, ...stubs]);
    setQuickUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const stub = stubs[i]!;
        try {
          const imageUrl = await uploadImage(file);
          setPendingPhotos((prev) =>
            prev.map((p) =>
              p.localId === stub.localId ? { ...p, imageUrl, uploading: false } : p,
            ),
          );
        } catch {
          setPendingPhotos((prev) => prev.filter((p) => p.localId !== stub.localId));
          URL.revokeObjectURL(stub.previewUrl);
          setError('Could not upload one of the photos.');
        }
      }
    } finally {
      setQuickUploading(false);
      if (designFileRef.current) designFileRef.current.value = '';
    }
  };

  const onQuickDesignFiles = async (fileList: FileList | null) => {
    if (!editing) {
      await onCreatePhotoFiles(fileList);
      return;
    }
    if (!id || !fileList?.length) return;
    const files = [...fileList].slice(0, QUICK_PHOTO_CAP);
    setError(null);
    setQuickUploading(true);
    try {
      const createdIds: string[] = [];
      for (const file of files) {
        const imageUrl = await uploadImage(file);
        const dto: CreateProductDto = {
          name: nameFromFilename(file.name),
          images: [imageUrl],
          categories: [],
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

  const onCreate = async (opts?: { publish?: boolean }) => {
    if (pendingPhotos.some((p) => p.uploading)) {
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
      const cover =
        createCoverUrl && /^https?:\/\//i.test(createCoverUrl) ? createCoverUrl : undefined;
      const created = await api.post<CollectionDetailView>('/collections', {
        name,
        ...(cover ? { coverImage: cover } : {}),
      } satisfies CreateCollectionDto);
      const createdIds: string[] = [];
      for (const photo of readyCreatePhotos) {
        const product = await api.post<ProductView>('/products', {
          name: photo.name,
          images: [photo.imageUrl!],
          categories: [],
        } satisfies CreateProductDto);
        createdIds.push(product.id);
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
        URL.revokeObjectURL(photo.previewUrl);
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
      if (target) URL.revokeObjectURL(target.previewUrl);
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
    form.coverImage,
    form.name,
  ]);
  const discard = useDiscardGuard(collectionDirty, leaveBypassRef);

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
          {isPublished && existing.data.rateVisibility === RateVisibility.OnRequest ? (
            <p className="text-xs text-muted">Buyers may need to ask for rates</p>
          ) : null}
        </div>
      ) : null}

      {!editing ? (
        <>
          <p className="text-sm text-muted">
            Add photos, designs, or both. First item is the cover.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="collection-add-photos"
              onClick={openDesignPicker}
              disabled={quickUploading || pendingPhotos.length >= QUICK_PHOTO_CAP}
              className="flex aspect-[5/4] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam px-3 text-muted disabled:opacity-40"
            >
              <CameraIcon width={32} height={32} />
              <span className="text-base font-semibold text-ink">
                {quickUploading ? 'Uploading…' : 'Photos'}
              </span>
            </button>
            <button
              type="button"
              data-testid="collection-add-designs"
              onClick={() => setLibraryOpen(true)}
              className="flex aspect-[5/4] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam px-3 text-muted"
            >
              <CollectionIcon width={32} height={32} />
              <span className="text-base font-semibold text-ink">Designs</span>
            </button>
          </div>

          {pendingPhotos.length > 0 || createLibraryDesigns.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {pendingPhotos.map((photo, index) => (
                <div
                  key={photo.localId}
                  className="relative overflow-hidden rounded-xl bg-foam"
                >
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  {index === 0 && !photo.uploading ? (
                    <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Cover
                    </span>
                  ) : null}
                  {photo.uploading ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-xs font-bold text-white">
                      …
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
                    onClick={() => removePending(photo.localId)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {createLibraryDesigns.map((product, index) => {
                const isCover = readyCreatePhotos.length === 0 && index === 0;
                return (
                  <div
                    key={product.id}
                    className="relative overflow-hidden rounded-xl bg-foam"
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-lg font-bold text-muted">
                        {product.name.charAt(0)}
                      </div>
                    )}
                    {isCover ? (
                      <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Cover
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Remove ${product.name}`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
                      onClick={() => toggleLibraryPick(product.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

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
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              disabled={
                creating ||
                quickUploading ||
                createMemberCount < 1 ||
                !form.name.trim()
              }
              onClick={() => void onCreate()}
            >
              {creating && !publishOpen ? 'Saving…' : 'Save Collection in Draft'}
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
              onClick={() => setPublishOpen(true)}
            >
              Create & Publish
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
            {noteOpen ? (
              <Field label="Note">
                <TextArea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional note for your team or buyers"
                />
              </Field>
            ) : (
              <button
                type="button"
                className="self-start text-sm font-medium text-accent"
                onClick={() => setNoteOpen(true)}
              >
                Add note
              </button>
            )}
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
            <div className="grid grid-cols-3 gap-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative overflow-hidden rounded-xl border border-line bg-foam"
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => navigate(`/collections/${id}`)}
                    aria-label={`Open album · ${product.name}`}
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-lg font-bold text-muted">
                        {product.name.charAt(0)}
                      </div>
                    )}
                    <span className="block truncate bg-surface/95 px-1.5 py-1 text-sm text-ink">
                      {product.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${product.name}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/75 text-sm leading-none text-white"
                    onClick={() => toggle(product.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Add photos or designs from your library.</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openDesignPicker}
              disabled={quickUploading}
              className={cx(
                'flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-muted',
                'disabled:opacity-40',
              )}
            >
              <PlusIcon width={18} height={18} />
              {quickUploading ? 'Adding…' : 'Photos'}
            </button>
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-muted"
            >
              <PlusIcon width={18} height={18} />
              Designs
            </button>
          </div>
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
                      <Button
                        className="min-w-0 flex-1"
                        onClick={() =>
                          navigate(`/broadcast/new?collectionId=${encodeURIComponent(id!)}`)
                        }
                      >
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

      <input
        ref={designFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple={designCapture !== true}
        capture={designCapture === true ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => void onQuickDesignFiles(e.target.files)}
      />

      <Sheet
        open={designPickerOpen}
        onClose={() => setDesignPickerOpen(false)}
        title={editing ? 'Add photos as designs' : 'Add photos'}
      >
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-sm text-muted">
            Each photo becomes a draft design in your library
            {editing ? ' and joins this collection.' : '.'}
          </p>
          <Button fullWidth onClick={() => pickDesignPhotos('camera')}>
            Camera
          </Button>
          <Button variant="secondary" fullWidth onClick={() => pickDesignPhotos('gallery')}>
            Gallery
          </Button>
        </div>
      </Sheet>

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
              <div className="grid grid-cols-3 gap-2">
                {filteredDesigns.map((product) => {
                  const on = editing
                    ? selected.has(product.id)
                    : libraryPicks.has(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        editing ? toggle(product.id) : toggleLibraryPick(product.id)
                      }
                      className={cx(
                        'relative overflow-hidden rounded-xl border-2 bg-foam text-left',
                        on ? 'border-accent' : 'border-transparent',
                      )}
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-lg font-bold text-muted">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      {on ? (
                        <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                          ✓
                        </span>
                      ) : null}
                      <span className="block truncate px-1.5 py-1 text-sm text-ink">
                        {product.name}
                      </span>
                    </button>
                  );
                })}
              </div>
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
      >
        <div className="flex flex-col gap-4">
          {editing && !isPublished ? (
            <p className="text-sm text-muted">
              {hasForeignMembers
                ? 'You’re sharing others’ designs under their rules. Draft designs you own will publish with this pack.'
                : 'Draft designs in this album will be published with the collection.'}
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
    </div>
  );
}
