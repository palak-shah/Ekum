import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProductDto,
  MasterCategoryView,
  PostProductToMarketDto,
  ProductView,
} from '@ekum/domain-types';
import { MEDIA_VARIANT, Unit, categoriesToTagSlots, tagSlotsToCategories } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { PageHeader } from '@/ui/PageHeader';
import { ListSquareButton } from '@/ui/ListSearchRow';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import { ContinuousCamera } from '@/ui/ContinuousCamera';
import { CappedMediaGrid } from '@/ui/CappedMediaGrid';
import { ManagedImage } from '@/ui/ManagedImage';
import { Button, Field, Sheet, TextArea, TextInput, cx } from '@/ui/kit';
import { FIELD_FOCUS_FILL_CLASS, FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';
import { CameraIcon } from '@/ui/icons';
import { useMyCompany } from '@/lib/queries';
import { useToast } from '@/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import type { BroadcastListView, CompanySettingsView, ConnectionView } from '@ekum/domain-types';
import { PublishAudience } from '@ekum/domain-types';
import { readCatalogFieldMemory, writeCatalogFieldMemory } from './catalogFieldMemory';
import { readCompanyPublishDefaults } from './publishDefaults';
import {
  emptyPublishAudienceState,
  publishAudienceCanSubmit,
  publishAudienceDtoFields,
  PublishAudienceFields,
  selectCreatedGroup,
  type PublishAudienceState,
} from './PublishAudienceFields';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { catalogRateDisplayUnit, catalogRateFieldLabel } from '@/lib/catalogRate';
import { CascadeTagsFields } from './CascadeTagsFields';
import { MasterCategoryField } from './MasterCategoryField';
import { OrderDispatchAccordion } from './OrderDispatchAccordion';
import { parsePiecesPerPack } from './orderDispatchPreview';
import { defaultProfileMasterCategoryId } from './companyMasterOptions';
import {
  createProductIdentity,
  detailsCardTitle,
  gridHeading,
  morePhotosEntry,
  overridesFromSheet,
  parkEditDraftForCamera,
  batchSaveErrorMessage,
  DESIGNS_ALREADY_ADDED_MESSAGE,
  uniqueDraftSku,
  continuousCameraMaxShots,
  resolvePhotoBatchTarget,
  type DraftOverrides,
} from './designBatchHelpers';
import { parseRateInput, rateFieldInputProps } from './rateInput';

/** One-line by default; grows while typing / when focused. */
function ExpandableNotes({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const expand = focused || value.includes('\n') || value.length > 48;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    const next = expand ? Math.min(Math.max(el.scrollHeight, 96), 168) : 46;
    el.style.height = `${next}px`;
  }, [value, expand]);

  return (
    <TextArea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={1}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      className={cx('resize-none overflow-hidden rounded-[13px]', expand ? 'min-h-24' : 'min-h-10')}
    />
  );
}

type DraftImage = {
  id: string;
  previewUrl: string;
  imageUrl: string;
  uploading: boolean;
};

type Draft = {
  id: string;
  images: DraftImage[];
  name: string;
  nameEdited: boolean;
  overrides: DraftOverrides;
  /** Set after POST /products succeeds — skip re-create on Save/Publish retry. */
  persistedProductId?: string;
};

const MAX_DESIGNS = 120;
const LARGE_BATCH = 20;
const UPLOAD_CONCURRENCY = 4;
const SAVE_CONCURRENCY = 3;

function readBatchMemory() {
  return readCatalogFieldMemory();
}

function writeBatchMemory(category: string, unit: string) {
  writeCatalogFieldMemory(category, unit);
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let done = 0;
  const total = items.length;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const item = items[i];
      if (item === undefined) continue;
      results[i] = await fn(item, i);
      done += 1;
      onProgress?.(done, total);
    }
  }
  const workers = Math.min(concurrency, Math.max(items.length, 1));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

function parseCategories(raw: string) {
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

function hasOverrides(o: DraftOverrides) {
  return (
    o.category !== undefined ||
    o.masterCategoryId !== undefined ||
    o.rate !== undefined ||
    o.unit !== undefined ||
    o.dispatchUnit !== undefined ||
    o.piecesPerPack !== undefined ||
    o.moq !== undefined ||
    o.notes !== undefined
  );
}

/**
 * Guided upload: photos → shared defaults → name/refine → save.
 */
export function DesignBatchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  /** Reopen Update-design sheet after fullscreen camera Done/Cancel. */
  const resumeEditDraftIdRef = useRef<string | null>(null);
  /**
   * Append-to-design target for the in-flight camera/gallery pick.
   * Ref wins over state so Done / file onChange cannot race into “new designs”.
   */
  const pendingAppendDraftIdRef = useRef<string | null>(null);
  /** draftId → productId written during save (setState alone is too late for retries). */
  const persistedProductByDraftRef = useRef<Map<string, string>>(new Map());
  /** Successful Save/Publish → My designs must not trip the discard sheet. */
  const leaveBypassRef = useRef(false);
  const memory = readBatchMemory();
  const phone = isPhoneLike();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSession, setCameraSession] = useState(0);
  const [cameraGalleryDraftId, setCameraGalleryDraftId] = useState<string | null>(null);
  const [targetDraftId, setTargetDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [editDraftId, setEditDraftId] = useState<string | null>(null);
  const [nameSearch, setNameSearch] = useState('');
  const [namePrefix, setNamePrefix] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [publishAudience, setPublishAudience] = useState<PublishAudienceState>(() =>
    emptyPublishAudienceState(),
  );

  const [sharedCategory, setSharedCategory] = useState(memory.category);
  const [sharedMasterCategoryId, setSharedMasterCategoryId] = useState<string | null>(null);
  const [sharedRate, setSharedRate] = useState('');
  const [sharedUnit, setSharedUnit] = useState(memory.unit);
  const [sharedDispatchUnit, setSharedDispatchUnit] = useState('');
  const [sharedPiecesPerPack, setSharedPiecesPerPack] = useState('');
  const [sharedMoq, setSharedMoq] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [sharedOrderDispatchOpen, setSharedOrderDispatchOpen] = useState(false);

  const [sheetCategory, setSheetCategory] = useState('');
  const [sheetMasterCategoryId, setSheetMasterCategoryId] = useState<string | null>(null);
  const [sheetRate, setSheetRate] = useState('');
  const [sheetUnit, setSheetUnit] = useState('');
  const [sheetDispatchUnit, setSheetDispatchUnit] = useState('');
  const [sheetPiecesPerPack, setSheetPiecesPerPack] = useState('');
  const [sheetMoq, setSheetMoq] = useState('');
  const [sheetNotes, setSheetNotes] = useState('');
  const [sheetOrderDispatchOpen, setSheetOrderDispatchOpen] = useState(false);

  const canPublishAlready = Boolean(company.data?.capabilities.publish);
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/access/connections'),
    enabled: publishOpen,
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled: publishOpen && publishAudience.audience === PublishAudience.Selected,
  });
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: publishOpen,
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
  const sharedSlots = useMemo(
    () => categoriesToTagSlots(parseCategories(sharedCategory)),
    [sharedCategory],
  );
  const sheetSlots = useMemo(
    () => categoriesToTagSlots(parseCategories(sheetCategory)),
    [sheetCategory],
  );
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  useEffect(() => {
    if (sharedMasterCategoryId) return;
    if (!profileMasterDefaultId) return;
    setSharedMasterCategoryId(profileMasterDefaultId);
  }, [profileMasterDefaultId, sharedMasterCategoryId]);

  useEffect(() => {
    if (!publishOpen || !settings.data) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    setPublishAudience((prev) => ({
      ...emptyPublishAudienceState(usual),
      audience: prev.audience || PublishAudience.Followers,
    }));
  }, [publishOpen, settings.data]);

  const openGallery = (draftId: string | null = null) => {
    if (!draftId && drafts.length >= MAX_DESIGNS) {
      setError(`You can add up to ${MAX_DESIGNS} designs at once.`);
      return;
    }
    pendingAppendDraftIdRef.current = draftId;
    setTargetDraftId(draftId);
    setError(null);
    // Sync click — deferred clicks are ignored by iOS Safari (no gallery opens).
    fileRef.current?.click();
  };

  const openCamera = (draftId: string | null = null) => {
    if (!draftId && drafts.length >= MAX_DESIGNS) {
      setError(`You can add up to ${MAX_DESIGNS} designs at once.`);
      return;
    }
    setError(null);
    // Sheet (z-80) must fully dismiss — otherwise it covers / fights the camera.
    const park = parkEditDraftForCamera(editDraftId);
    resumeEditDraftIdRef.current = park.resumeEditDraftId;
    setEditDraftId(park.nextEditDraftId);
    pendingAppendDraftIdRef.current = draftId;
    setCameraGalleryDraftId(draftId);
    setCameraSession((n) => n + 1);
    setCameraOpen(true);
  };

  const closeCameraAndRestoreEdit = () => {
    setCameraOpen(false);
    setCameraGalleryDraftId(null);
    const resumeId = resumeEditDraftIdRef.current;
    resumeEditDraftIdRef.current = null;
    if (resumeId) setEditDraftId(resumeId);
  };

  const openAddPhotos = () => {
    if (drafts.length >= MAX_DESIGNS) {
      setError(`You can add up to ${MAX_DESIGNS} designs at once.`);
      return;
    }
    setError(null);
    if (phone) {
      openCamera(null);
      return;
    }
    openGallery(null);
  };

  const onCameraUnavailable = useCallback(() => {
    const draftId = pendingAppendDraftIdRef.current ?? cameraGalleryDraftId;
    const resumeId = resumeEditDraftIdRef.current;
    resumeEditDraftIdRef.current = null;
    setCameraOpen(false);
    setCameraGalleryDraftId(null);
    if (resumeId) setEditDraftId(resumeId);
    setError(null);
    // Keep user gesture chain as short as possible for iOS file picker.
    queueMicrotask(() => openGallery(draftId));
  }, [cameraGalleryDraftId]);

  /** Add more photos on an open design — never creates separate designs. */
  const openMorePhotosForDraft = (draftId: string) => {
    setError(null);
    pendingAppendDraftIdRef.current = draftId;
    if (morePhotosEntry(phone) === 'camera') {
      openCamera(draftId);
      return;
    }
    openGallery(draftId);
  };

  const openUpdateSheet = (draft: Draft) => {
    setSheetCategory(draft.overrides.category ?? sharedCategory);
    setSheetMasterCategoryId(draft.overrides.masterCategoryId ?? sharedMasterCategoryId);
    setSheetRate(draft.overrides.rate ?? sharedRate);
    setSheetUnit(draft.overrides.unit ?? sharedUnit);
    setSheetDispatchUnit(draft.overrides.dispatchUnit ?? sharedDispatchUnit);
    setSheetPiecesPerPack(draft.overrides.piecesPerPack ?? sharedPiecesPerPack);
    setSheetMoq(draft.overrides.moq ?? sharedMoq);
    setSheetNotes(draft.overrides.notes ?? sharedNotes);
    setSheetOrderDispatchOpen(false);
    setEditDraftId(draft.id);
  };

  const uploadFilesToDraft = async (draftId: string, files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setProgressLabel(`Uploading 0 of ${files.length}…`);
    try {
      const placeholders = files.map((file) => ({
        file,
        imageId: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
      }));
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? {
                ...d,
                images: [
                  ...d.images,
                  ...placeholders.map((p) => ({
                    id: p.imageId,
                    previewUrl: p.previewUrl,
                    imageUrl: '',
                    uploading: true,
                  })),
                ],
              }
            : d,
        ),
      );

      await mapPool(
        placeholders,
        UPLOAD_CONCURRENCY,
        async (p) => {
          try {
            const imageUrl = await uploadImage(p.file);
            setDrafts((prev) =>
              prev.map((d) =>
                d.id === draftId
                  ? {
                      ...d,
                      images: d.images.map((img) =>
                        img.id === p.imageId ? { ...img, imageUrl, uploading: false } : img,
                      ),
                    }
                  : d,
              ),
            );
          } catch (err) {
            setDrafts((prev) =>
              prev.map((d) =>
                d.id === draftId
                  ? { ...d, images: d.images.filter((img) => img.id !== p.imageId) }
                  : d,
              ),
            );
            URL.revokeObjectURL(p.previewUrl);
            throw err;
          }
        },
        (done, total) => setProgressLabel(`Uploading ${done} of ${total}…`),
      );
    } finally {
      setUploading(false);
      setProgressLabel(null);
    }
  };

  const createDraftsFromFiles = async (files: File[]) => {
    const room = MAX_DESIGNS - drafts.length;
    const selected = files.slice(0, room);
    if (selected.length === 0) {
      setError(`You can add up to ${MAX_DESIGNS} designs at once.`);
      return;
    }
    setUploading(true);
    setProgressLabel(`Uploading 0 of ${selected.length}…`);
    try {
      const existingSkus: string[] = [];
      const jobs = selected.map((file) => {
        const name = uniqueDraftSku([...drafts.map((d) => d.name), ...existingSkus]);
        existingSkus.push(name);
        return {
          file,
          draftId: crypto.randomUUID(),
          imageId: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
          name,
        };
      });
      setDrafts((prev) => [
        ...prev,
        ...jobs.map((j) => ({
          id: j.draftId,
          name: j.name,
          nameEdited: false,
          overrides: {},
          images: [
            {
              id: j.imageId,
              previewUrl: j.previewUrl,
              imageUrl: '',
              uploading: true,
            },
          ],
        })),
      ]);

      await mapPool(
        jobs,
        UPLOAD_CONCURRENCY,
        async (j) => {
          try {
            const imageUrl = await uploadImage(j.file);
            setDrafts((prev) =>
              prev.map((d) =>
                d.id === j.draftId
                  ? {
                      ...d,
                      images: d.images.map((img) =>
                        img.id === j.imageId ? { ...img, imageUrl, uploading: false } : img,
                      ),
                    }
                  : d,
              ),
            );
          } catch (err) {
            setDrafts((prev) => prev.filter((d) => d.id !== j.draftId));
            URL.revokeObjectURL(j.previewUrl);
            throw err;
          }
        },
        (done, total) => setProgressLabel(`Uploading ${done} of ${total}…`),
      );
    } finally {
      setUploading(false);
      setProgressLabel(null);
    }
  };

  const onFiles = async (
    incoming: FileList | File[] | null,
    appendToIdOverride?: string | null,
  ) => {
    if (!incoming || (incoming instanceof FileList ? !incoming.length : incoming.length === 0)) {
      return;
    }
    // Copy before clearing the input — FileList is live and empties when value is reset.
    const files = [...incoming];
    setError(null);
    const appendId =
      appendToIdOverride !== undefined
        ? appendToIdOverride
        : (pendingAppendDraftIdRef.current ?? targetDraftId);
    pendingAppendDraftIdRef.current = null;
    setTargetDraftId(null);
    setCameraGalleryDraftId(null);
    if (fileRef.current) fileRef.current.value = '';

    const target = resolvePhotoBatchTarget(appendId, null);

    try {
      if (target.mode === 'append') {
        await uploadFilesToDraft(target.draftId, files);
        return;
      }
      await createDraftsFromFiles(files);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    }
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const target = prev.find((d) => d.id === id);
      for (const img of target?.images ?? []) {
        if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
      }
      return prev.filter((d) => d.id !== id);
    });
    if (editDraftId === id) setEditDraftId(null);
    if (resumeEditDraftIdRef.current === id) resumeEditDraftIdRef.current = null;
  };

  const removeImage = (draftId: string, imageId: string) => {
    setDrafts((prev) =>
      prev.flatMap((d) => {
        if (d.id !== draftId) return [d];
        const img = d.images.find((i) => i.id === imageId);
        if (img?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
        const images = d.images.filter((i) => i.id !== imageId);
        if (images.length === 0) return [];
        return [{ ...d, images }];
      }),
    );
  };

  const setName = (id: string, name: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name, nameEdited: true } : d)),
    );
  };

  const applySheetDetails = () => {
    if (!editDraftId) return;
    const next = overridesFromSheet(
      {
        category: sheetCategory,
        masterCategoryId: sheetMasterCategoryId,
        rate: sheetRate,
        unit: sheetUnit,
        dispatchUnit: sheetDispatchUnit,
        piecesPerPack: sheetPiecesPerPack,
        moq: sheetMoq,
        notes: sheetNotes,
      },
      {
        category: sharedCategory,
        masterCategoryId: sharedMasterCategoryId,
        rate: sharedRate,
        unit: sharedUnit,
        dispatchUnit: sharedDispatchUnit,
        piecesPerPack: sharedPiecesPerPack,
        moq: sharedMoq,
        notes: sharedNotes,
      },
    );
    setDrafts((prev) =>
      prev.map((d) => (d.id === editDraftId ? { ...d, overrides: next } : d)),
    );
  };

  const applyBatchNames = () => {
    const prefix = namePrefix.trim();
    setDrafts((prev) => {
      let n = 0;
      return prev.map((d) => {
        if (d.nameEdited) return d;
        n += 1;
        return {
          ...d,
          name: prefix ? `${prefix} ${n}` : `Design ${n}`,
        };
      });
    });
  };

  const effectiveFor = (d: Draft) => ({
    category: d.overrides.category ?? sharedCategory,
    masterCategoryId: d.overrides.masterCategoryId ?? sharedMasterCategoryId,
    rate: d.overrides.rate ?? sharedRate,
    unit: d.overrides.unit ?? sharedUnit,
    dispatchUnit: d.overrides.dispatchUnit ?? sharedDispatchUnit,
    piecesPerPack: d.overrides.piecesPerPack ?? sharedPiecesPerPack,
    moq: d.overrides.moq ?? sharedMoq,
    notes: d.overrides.notes ?? sharedNotes,
  });

  const draftReady = (d: Draft) => {
    const uploaded = d.images.filter((i) => i.imageUrl && !i.uploading);
    return uploaded.length > 0 && d.name.trim().length > 0 && d.images.every((i) => !i.uploading);
  };

  const saveAll = useMutation({
    mutationFn: async (opts?: { publish?: boolean }) => {
      const ready = drafts.filter(draftReady);
      if (ready.length === 0) {
        throw new ApiError({
          statusCode: 400,
          code: 'VALIDATION',
          message: 'Give each design a SKU before saving.',
          details: null,
        });
      }
      const shouldPublish = Boolean(opts?.publish);
      const persistedOf = (draft: Draft) =>
        draft.persistedProductId ?? persistedProductByDraftRef.current.get(draft.id) ?? null;
      const needsCreate = ready.filter((d) => !persistedOf(d));
      if (!shouldPublish && needsCreate.length === 0) {
        return {
          created: ready.map((d) => ({ id: persistedOf(d)! })),
          published: false,
          alreadyAdded: true as const,
        };
      }
      setProgressLabel(
        shouldPublish ? `Publishing 0 of ${ready.length}…` : `Saving 0 of ${ready.length}…`,
      );
      const created = await mapPool(
        ready,
        SAVE_CONCURRENCY,
        async (draft) => {
          const e = effectiveFor(draft);
          const existingId = persistedOf(draft);
          let productId = existingId;
          if (!productId) {
            const images = draft.images
              .map((i) => i.imageUrl)
              .filter(Boolean)
              .map((url) => toAbsoluteMediaUrl(url));
            const identity = createProductIdentity(draft.name);
            const parsed = parseRateInput(e.rate);
            const dto: CreateProductDto = {
              name: identity.name,
              sku: identity.sku,
              rate: parsed.rate,
              rateMax: parsed.rateMax,
              moq: e.moq.trim() ? Number(e.moq) : null,
              description: e.notes.trim() || undefined,
              unit: (e.unit || undefined) as CreateProductDto['unit'],
              dispatchUnit: (e.dispatchUnit || undefined) as CreateProductDto['dispatchUnit'],
              piecesPerPack: parsePiecesPerPack(e.piecesPerPack),
              categories: parseCategories(e.category),
              masterCategoryId: e.masterCategoryId,
              images,
            };
            try {
              const product = await api.post<ProductView>('/products', dto);
              productId = product.id;
              persistedProductByDraftRef.current.set(draft.id, product.id);
              setDrafts((prev) =>
                prev.map((d) =>
                  d.id === draft.id ? { ...d, persistedProductId: product.id } : d,
                ),
              );
            } catch (err) {
              if (err instanceof ApiError && err.code === 'SKU_TAKEN') {
                throw new ApiError({
                  statusCode: 409,
                  code: 'DESIGNS_ALREADY_ADDED',
                  message: DESIGNS_ALREADY_ADDED_MESSAGE,
                  details: null,
                });
              }
              throw err;
            }
          }
          if (shouldPublish && productId) {
            const publishDto: PostProductToMarketDto = {
              audience: publishAudience.audience as PostProductToMarketDto['audience'],
              rateVisibility:
                publishAudience.rateVisibility as PostProductToMarketDto['rateVisibility'],
              allowForward: publishAudience.allowForward,
              allowDownload: publishAudience.allowDownload,
              ...publishAudienceDtoFields(publishAudience),
              ...(canPublishAlready ? {} : { consentToSell: true }),
            };
            await api.post<ProductView>(`/products/${productId}/post-to-market`, publishDto);
          }
          return { id: productId! };
        },
        (done, total) =>
          setProgressLabel(
            shouldPublish ? `Publishing ${done} of ${total}…` : `Saving ${done} of ${total}…`,
          ),
      );
      return { created, published: shouldPublish, alreadyAdded: false as const };
    },
    onSuccess: ({ published, alreadyAdded }) => {
      writeBatchMemory(sharedCategory, sharedUnit);
      setProgressLabel(null);
      setPublishOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      showToast(
        alreadyAdded ? 'Designs already added' : published ? 'Published' : 'Designs saved',
      );
      leaveBypassRef.current = true;
      navigate('/catalog?tab=products', {
        replace: true,
        state: published ? { productFilter: 'published' } : { productFilter: 'draft' },
      });
    },
    onError: (err) => {
      setProgressLabel(null);
      setError(
        err instanceof ApiError
          ? batchSaveErrorMessage(err)
          : 'Could not save designs.',
      );
    },
  });

  const readyCount = drafts.filter(draftReady).length;
  const allUploaded =
    drafts.length > 0 &&
    drafts.every((d) => d.images.length > 0 && d.images.every((i) => !i.uploading && i.imageUrl));
  const canSubmitPublish =
    (canPublishAlready || consent) && publishAudienceCanSubmit(publishAudience);

  const isLarge = drafts.length > LARGE_BATCH;
  const searchQ = nameSearch.trim().toLowerCase();
  const visibleDrafts =
    isLarge && searchQ
      ? drafts.filter((d) => d.name.toLowerCase().includes(searchQ))
      : drafts;

  const editDraft = drafts.find((d) => d.id === editDraftId) ?? null;
  const cameraAppendDraft = cameraGalleryDraftId
    ? (drafts.find((d) => d.id === cameraGalleryDraftId) ?? null)
    : null;
  const cameraMaxShots = continuousCameraMaxShots({
    appendToDraft: Boolean(cameraGalleryDraftId),
    draftImageCount: cameraAppendDraft?.images.length ?? 0,
    draftCount: drafts.length,
    maxDesigns: MAX_DESIGNS,
    maxPhotosPerDesign: null,
  });

  const sectionTitle = (title: string) => (
    <p className="mb-2 text-base font-emphasis text-ink">{title}</p>
  );

  const batchDirty = useMemo(
    () =>
      drafts.length > 0 ||
      drafts.some((draft) => draft.images.some((image) => image.uploading)) ||
      uploading ||
      cameraOpen,
    [drafts, uploading, cameraOpen],
  );
  const discard = useDiscardGuard(batchDirty, leaveBypassRef);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title="Add designs"
        onBack={() => discard.tryLeave(() => navigate(-1))}
      />

      {drafts.length === 0 ? (
        <section>
          <button
            type="button"
            onClick={openAddPhotos}
            disabled={uploading}
            aria-label="Add designs — one photo per design"
            className="flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam px-6 py-12"
          >
            <CameraIcon width={36} height={36} className="text-accent" />
            <span className="text-lg font-emphasis text-ink">One photo per design</span>
            <span className="max-w-xs text-center text-sm text-muted">
              Each photo becomes its own design — not more shots of the same one.
            </span>
          </button>
        </section>
      ) : (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-base font-emphasis text-ink">{gridHeading(drafts.length)}</p>
              {drafts.length < MAX_DESIGNS ? (
                <ListSquareButton
                  aria-label="Add designs"
                  disabled={uploading}
                  onClick={openAddPhotos}
                >
                  <CameraIcon width={22} height={22} />
                </ListSquareButton>
              ) : null}
            </div>
            <p className="mb-2 text-sm text-muted">
              Tap a design to edit details or add more photos.
            </p>
            {progressLabel ? (
              <p className="mb-2 text-sm font-emphasis text-accent">{progressLabel}</p>
            ) : null}
            {isLarge ? (
              <div className="mb-3 flex flex-col gap-2">
                <TextInput
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Search designs by name"
                />
                <div className="flex gap-2">
                  <TextInput
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder="Prefix (e.g. Festive)"
                    className="min-w-0 flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={applyBatchNames}>
                    Apply names
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  Apply names only changes designs you have not edited by hand.
                </p>
              </div>
            ) : null}
            <CappedMediaGrid
              items={visibleDrafts}
              getKey={(d) => d.id}
              overflowPreviewUrl={(d) => d.images[0]?.previewUrl ?? null}
              loadMoreTestId="design-batch-load-more"
              overflowFooter={
                <div className="min-h-9 w-full" aria-hidden />
              }
              renderTile={(d) => {
                const lead = d.images[0];
                const busy = d.images.some((i) => i.uploading);
                const different = hasOverrides(d.overrides);
                return (
                  <div className="flex min-w-0 flex-col gap-1">
                    <div
                      className={cx(
                        'relative aspect-square min-w-0 w-full overflow-hidden rounded-xl bg-foam',
                        different ? 'ring-2 ring-inset ring-accent' : null,
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openUpdateSheet(d)}
                        className="absolute inset-0"
                        aria-label={d.name || 'Update design'}
                      >
                        {lead ? (
                          <ManagedImage
                            src={lead.previewUrl}
                            alt=""
                            variant={MEDIA_VARIANT.Thumbnail1}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : null}
                        {busy ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-sm font-emphasis text-white">
                            …
                          </div>
                        ) : null}
                      </button>
                      {d.images.length > 1 ? (
                        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-ink/70 px-1.5 text-[11px] font-emphasis text-white">
                          {d.images.length}
                        </span>
                      ) : null}
                      {different ? (
                        <span
                          data-testid="design-batch-diff-badge"
                          className="pointer-events-none absolute left-1 top-1 z-[1] rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white"
                        >
                          Diff
                        </span>
                      ) : null}
                      <button
                        type="button"
                        aria-label="Remove design"
                        onClick={() => removeDraft(d.id)}
                        className="absolute right-1 top-1 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => setName(d.id, e.target.value)}
                      onFocus={(e) => {
                        if (!d.nameEdited) e.currentTarget.select();
                      }}
                      placeholder="SKU"
                      disabled={busy}
                      aria-label="SKU"
                      className={`min-h-9 w-full rounded-lg border border-line ${FIELD_IDLE_FILL_CLASS} px-1.5 text-center text-xs font-emphasis text-ink outline-none ${FIELD_FOCUS_FILL_CLASS} focus:border-line disabled:opacity-50`}
                    />
                  </div>
                );
              }}
            />
            {isLarge && searchQ && visibleDrafts.length === 0 ? (
              <p className="mt-2 text-center text-sm text-muted">No designs match that name.</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4">
            {sectionTitle(detailsCardTitle(drafts.length))}
            <div className="flex flex-col gap-3">
              <MasterCategoryField
                value={sharedMasterCategoryId}
                onChange={(next) => setSharedMasterCategoryId(next || null)}
                options={catalogMasterOptions}
              />
              <CascadeTagsFields
                items={sharedSlots.items}
                qualities={sharedSlots.qualities}
                sizes={sharedSlots.sizes}
                masterCategoryId={sharedMasterCategoryId}
                onItems={(items) =>
                  setSharedCategory(tagSlotsToCategories({ ...sharedSlots, items }).join(', '))
                }
                onQualities={(qualities) =>
                  setSharedCategory(
                    tagSlotsToCategories({ ...sharedSlots, qualities }).join(', '),
                  )
                }
                onSizes={(sizes) =>
                  setSharedCategory(tagSlotsToCategories({ ...sharedSlots, sizes }).join(', '))
                }
              />
              <Field label={catalogRateFieldLabel(sharedUnit, sharedDispatchUnit)}>
                <TextInput
                  value={sharedRate}
                  onChange={(e) => setSharedRate(e.target.value)}
                  {...rateFieldInputProps}
                />
              </Field>
              <OrderDispatchAccordion
                orderUnit={sharedUnit}
                piecesPerPack={sharedPiecesPerPack}
                dispatchUnit={sharedDispatchUnit}
                moq={sharedMoq}
                contentsUnit={
                  catalogRateDisplayUnit({
                    unit: sharedUnit,
                    dispatchUnit: sharedDispatchUnit,
                  }) ?? Unit.Piece
                }
                onOrderUnit={setSharedUnit}
                onPiecesPerPack={setSharedPiecesPerPack}
                onDispatchUnit={setSharedDispatchUnit}
                onMoq={setSharedMoq}
                open={sharedOrderDispatchOpen}
                onToggle={() => setSharedOrderDispatchOpen((open) => !open)}
              />
              <Field label="Notes">
                <ExpandableNotes
                  value={sharedNotes}
                  onChange={setSharedNotes}
                  placeholder="e.g. 44 inch, cotton, queen size"
                />
              </Field>
            </div>
          </section>

          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              disabled={!allUploaded || readyCount === 0 || uploading || saveAll.isPending}
              onClick={() => setPublishOpen(true)}
            >
              Publish {readyCount || drafts.length}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              loading={saveAll.isPending && !publishOpen}
              disabled={!allUploaded || readyCount === 0 || uploading}
              onClick={() => saveAll.mutate({})}
            >
              {saveAll.isPending && !publishOpen && progressLabel
                ? progressLabel
                : `Save ${readyCount || drafts.length} design${(readyCount || drafts.length) === 1 ? '' : 's'} in Draft`}
            </Button>
          </div>
        </>
      )}

      {error ? <p className="text-center text-sm text-danger">{error}</p> : null}

      <Sheet
        open={publishOpen}
        onClose={() => !saveAll.isPending && setPublishOpen(false)}
        title="Publish designs"
        footer={
          <Button
            fullWidth
            loading={saveAll.isPending}
            disabled={!canSubmitPublish}
            onClick={() => saveAll.mutate({ publish: true })}
          >
            {saveAll.isPending && progressLabel ? progressLabel : `Publish ${readyCount}`}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <PublishAudienceFields
            state={publishAudience}
            onChange={setPublishAudience}
            lists={broadcastLists.data ?? []}
            connections={activeConnections}
            connectionsLoading={connections.isLoading}
            tradeDefaults={settings.data?.tradeDefaults}
            onCreateGroup={() => setCreateGroupOpen(true)}
            showConsent={!canPublishAlready}
            consent={consent}
            onConsent={setConsent}
          />
        </div>
      </Sheet>

      <BuyerGroupFormSheet
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSaved={(list) => {
          setCreateGroupOpen(false);
          void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
          setPublishAudience((prev) =>
            selectCreatedGroup(
              prev,
              list,
              broadcastLists.data ?? [],
              settings.data?.tradeDefaults,
            ),
          );
        }}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />

      <ContinuousCamera
        key={cameraSession}
        open={cameraOpen}
        maxShots={cameraMaxShots}
        appendToDraftId={cameraGalleryDraftId}
        batchAsDesigns={!cameraGalleryDraftId}
        onCancel={() => {
          pendingAppendDraftIdRef.current = null;
          closeCameraAndRestoreEdit();
        }}
        onUnavailable={onCameraUnavailable}
        onGallery={() => {
          const draftId = pendingAppendDraftIdRef.current ?? cameraGalleryDraftId;
          closeCameraAndRestoreEdit();
          openGallery(draftId);
        }}
        onDone={(files, appendToDraftId) => {
          const draftId = appendToDraftId ?? pendingAppendDraftIdRef.current;
          closeCameraAndRestoreEdit();
          void onFiles(files, draftId);
        }}
      />

      <Sheet
        open={Boolean(editDraft)}
        onClose={() => {
          applySheetDetails();
          setEditDraftId(null);
        }}
        title="Update this design"
        footer={
          editDraft ? (
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                onClick={() => {
                  applySheetDetails();
                  setEditDraftId(null);
                }}
              >
                Done
              </Button>
              <Button variant="ghost" fullWidth onClick={() => removeDraft(editDraft.id)}>
                Remove design
              </Button>
            </div>
          ) : null
        }
      >
        {editDraft ? (
          <div className="flex flex-col gap-3">
            <Field label="SKU">
              <TextInput
                value={editDraft.name}
                onChange={(e) => setName(editDraft.id, e.target.value)}
                onFocus={(e) => {
                  if (!editDraft.nameEdited) e.currentTarget.select();
                }}
                placeholder="SKU"
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-emphasis text-ink">More photos for this design</p>
              <div className="grid grid-cols-3 gap-2">
                {editDraft.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-xl bg-foam"
                  >
                    <ManagedImage src={img.previewUrl} alt="" variant={MEDIA_VARIANT.Thumbnail1} className="h-full w-full object-cover" />
                    {img.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-sm font-emphasis text-white">
                        …
                      </div>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                      onClick={() => removeImage(editDraft.id, img.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  data-testid="design-batch-add-more-photos"
                  aria-label="Add photos to this design"
                  onClick={() => openMorePhotosForDraft(editDraft.id)}
                  disabled={uploading}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted disabled:opacity-40"
                >
                  <CameraIcon width={22} height={22} />
                  <span className="text-xs font-emphasis">Add photos</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-line p-3">
              <MasterCategoryField
                value={sheetMasterCategoryId}
                onChange={(next) => setSheetMasterCategoryId(next || null)}
                options={catalogMasterOptions}
              />
              <CascadeTagsFields
                items={sheetSlots.items}
                qualities={sheetSlots.qualities}
                sizes={sheetSlots.sizes}
                masterCategoryId={sheetMasterCategoryId}
                onItems={(items) =>
                  setSheetCategory(tagSlotsToCategories({ ...sheetSlots, items }).join(', '))
                }
                onQualities={(qualities) =>
                  setSheetCategory(
                    tagSlotsToCategories({ ...sheetSlots, qualities }).join(', '),
                  )
                }
                onSizes={(sizes) =>
                  setSheetCategory(tagSlotsToCategories({ ...sheetSlots, sizes }).join(', '))
                }
              />
              <Field label={catalogRateFieldLabel(sheetUnit, sheetDispatchUnit)}>
                <TextInput
                  value={sheetRate}
                  onChange={(e) => setSheetRate(e.target.value)}
                  {...rateFieldInputProps}
                />
              </Field>
              <OrderDispatchAccordion
                orderUnit={sheetUnit}
                piecesPerPack={sheetPiecesPerPack}
                dispatchUnit={sheetDispatchUnit}
                moq={sheetMoq}
                contentsUnit={
                  catalogRateDisplayUnit({
                    unit: sheetUnit,
                    dispatchUnit: sheetDispatchUnit,
                  }) ?? Unit.Piece
                }
                onOrderUnit={setSheetUnit}
                onPiecesPerPack={setSheetPiecesPerPack}
                onDispatchUnit={setSheetDispatchUnit}
                onMoq={setSheetMoq}
                open={sheetOrderDispatchOpen}
                onToggle={() => setSheetOrderDispatchOpen((open) => !open)}
              />
              <Field label="Notes">
                <ExpandableNotes
                  value={sheetNotes}
                  onChange={setSheetNotes}
                  placeholder="e.g. 44 inch, cotton"
                />
              </Field>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
