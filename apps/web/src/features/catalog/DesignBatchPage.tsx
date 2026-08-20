import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProductDto,
  PostProductToMarketDto,
  ProductView,
} from '@ekum/domain-types';
import { Unit, unitValues } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { ContinuousCamera } from '@/ui/ContinuousCamera';
import { Button, Field, Sheet, TextInput, cx } from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';
import { CameraIcon, PlusIcon } from '@/ui/icons';
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
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={1}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        'w-full resize-none overflow-hidden rounded-[13px] border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink outline-none placeholder:font-normal placeholder:text-muted focus:border-accent',
        expand ? 'min-h-24' : 'min-h-[46px]',
      )}
    />
  );
}

type DraftImage = {
  id: string;
  previewUrl: string;
  imageUrl: string;
  uploading: boolean;
};

type DraftOverrides = {
  category?: string;
  rate?: string;
  unit?: string;
  moq?: string;
  notes?: string;
};

type Draft = {
  id: string;
  images: DraftImage[];
  name: string;
  nameEdited: boolean;
  overrides: DraftOverrides;
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

/** Red_Banarasi.jpg → Red Banarasi; IMG_1234.JPG → IMG 1234 */
function nameFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || 'Design';
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
    o.rate !== undefined ||
    o.unit !== undefined ||
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
  const memory = readBatchMemory();
  const phone = isPhoneLike();
  const [cameraOpen, setCameraOpen] = useState(false);
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
  const [sharedRate, setSharedRate] = useState('');
  const [sharedUnit, setSharedUnit] = useState(memory.unit);
  const [sharedMoq, setSharedMoq] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');

  const [sheetCategory, setSheetCategory] = useState('');
  const [sheetRate, setSheetRate] = useState('');
  const [sheetUnit, setSheetUnit] = useState('');
  const [sheetMoq, setSheetMoq] = useState('');
  const [sheetNotes, setSheetNotes] = useState('');

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
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  useEffect(() => {
    if (!publishOpen || !settings.data) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    setPublishAudience((prev) => ({
      ...emptyPublishAudienceState(usual),
      audience: prev.audience || PublishAudience.Connections,
    }));
  }, [publishOpen, settings.data]);

  const openGallery = (draftId: string | null = null) => {
    if (!draftId && drafts.length >= MAX_DESIGNS) {
      setError(`You can add up to ${MAX_DESIGNS} designs at once.`);
      return;
    }
    setTargetDraftId(draftId);
    setError(null);
    queueMicrotask(() => fileRef.current?.click());
  };

  const openAddPhotos = () => {
    if (drafts.length >= MAX_DESIGNS) {
      setError(`You can add up to ${MAX_DESIGNS} designs at once.`);
      return;
    }
    setError(null);
    if (phone) {
      setCameraOpen(true);
      return;
    }
    openGallery(null);
  };

  const onCameraUnavailable = useCallback(() => {
    setCameraOpen(false);
    setError(null);
    queueMicrotask(() => fileRef.current?.click());
  }, []);

  const openPickerForNew = () => openAddPhotos();

  const openPickerForDraft = (draftId: string) => {
    openGallery(draftId);
  };

  const openUpdateSheet = (draft: Draft) => {
    setSheetCategory(draft.overrides.category ?? sharedCategory);
    setSheetRate(draft.overrides.rate ?? sharedRate);
    setSheetUnit(draft.overrides.unit ?? sharedUnit);
    setSheetMoq(draft.overrides.moq ?? sharedMoq);
    setSheetNotes(draft.overrides.notes ?? sharedNotes);
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
      const jobs = selected.map((file) => ({
        file,
        draftId: crypto.randomUUID(),
        imageId: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        name: nameFromFilename(file.name),
      }));
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

  const onFiles = async (incoming: FileList | File[] | null) => {
    if (!incoming || (incoming instanceof FileList ? !incoming.length : incoming.length === 0)) {
      return;
    }
    setError(null);
    const appendToId = targetDraftId;
    const files = [...incoming];
    setTargetDraftId(null);
    if (fileRef.current) fileRef.current.value = '';

    try {
      if (appendToId) {
        await uploadFilesToDraft(appendToId, files);
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
    const next: DraftOverrides = {};
    if (sheetCategory !== sharedCategory) next.category = sheetCategory;
    if (sheetRate !== sharedRate) next.rate = sheetRate;
    if (sheetUnit !== sharedUnit) next.unit = sheetUnit;
    if (sheetMoq !== sharedMoq) next.moq = sheetMoq;
    if (sheetNotes !== sharedNotes) next.notes = sheetNotes;
    setDrafts((prev) =>
      prev.map((d) => (d.id === editDraftId ? { ...d, overrides: next } : d)),
    );
  };

  const clearSheetOverrides = () => {
    if (!editDraftId) return;
    setSheetCategory(sharedCategory);
    setSheetRate(sharedRate);
    setSheetUnit(sharedUnit);
    setSheetMoq(sharedMoq);
    setSheetNotes(sharedNotes);
    setDrafts((prev) =>
      prev.map((d) => (d.id === editDraftId ? { ...d, overrides: {} } : d)),
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
    rate: d.overrides.rate ?? sharedRate,
    unit: d.overrides.unit ?? sharedUnit,
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
          message: 'Name each design before saving.',
          details: null,
        });
      }
      const shouldPublish = Boolean(opts?.publish);
      setProgressLabel(
        shouldPublish ? `Publishing 0 of ${ready.length}…` : `Saving 0 of ${ready.length}…`,
      );
      const created = await mapPool(
        ready,
        SAVE_CONCURRENCY,
        async (draft) => {
          const e = effectiveFor(draft);
          const images = draft.images.map((i) => i.imageUrl).filter(Boolean);
          const dto: CreateProductDto = {
            name: draft.name.trim(),
            rate: e.rate.trim() ? Number(e.rate) : null,
            moq: e.moq.trim() ? Number(e.moq) : null,
            description: e.notes.trim() || undefined,
            unit: (e.unit || undefined) as CreateProductDto['unit'],
            categories: parseCategories(e.category),
            images,
          };
          const product = await api.post<ProductView>('/products', dto);
          if (shouldPublish) {
            const publishDto: PostProductToMarketDto = {
              audience: publishAudience.audience as PostProductToMarketDto['audience'],
              rateVisibility:
                publishAudience.rateVisibility as PostProductToMarketDto['rateVisibility'],
              allowForward: publishAudience.allowForward,
              ...publishAudienceDtoFields(publishAudience),
              ...(canPublishAlready ? {} : { consentToSell: true }),
            };
            await api.post<ProductView>(`/products/${product.id}/post-to-market`, publishDto);
          }
          return product;
        },
        (done, total) =>
          setProgressLabel(
            shouldPublish ? `Publishing ${done} of ${total}…` : `Saving ${done} of ${total}…`,
          ),
      );
      return { created, published: shouldPublish };
    },
    onSuccess: ({ published }) => {
      writeBatchMemory(sharedCategory, sharedUnit);
      setProgressLabel(null);
      setPublishOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      showToast(published ? 'Published' : 'Designs saved');
      navigate('/catalog', { replace: true });
    },
    onError: (err) => {
      setProgressLabel(null);
      setError(err instanceof ApiError ? err.message : 'Could not save designs.');
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

  const unitSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink focus:border-accent"
    >
      <option value="">—</option>
      {unitValues.map((unit) => (
        <option key={unit} value={unit}>
          {unit === Unit.Metre ? 'metre' : unit}
        </option>
      ))}
    </select>
  );

  const sectionTitle = (title: string) => (
    <p className="mb-2 text-base font-semibold text-ink">{title}</p>
  );

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader title="Add designs" />

      {drafts.length === 0 ? (
        <section>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={openAddPhotos}
              disabled={uploading}
              className="flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-foam px-6 py-12"
            >
              <CameraIcon width={36} height={36} className="text-accent" />
              <span className="text-lg font-semibold text-ink">Add photos</span>
            </button>
            <button
              type="button"
              onClick={() => openGallery(null)}
              disabled={uploading}
              className="py-1 text-center text-sm font-medium text-accent"
            >
              Choose from gallery
            </button>
          </div>
        </section>
      ) : (
        <>
          <section>
            {sectionTitle(
              `Photos · ${drafts.length} design${drafts.length === 1 ? '' : 's'}`,
            )}
            {progressLabel ? (
              <p className="mb-2 text-sm font-medium text-accent">{progressLabel}</p>
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
            <div className="grid grid-cols-3 gap-2">
              {visibleDrafts.map((d) => {
                const lead = d.images[0];
                const busy = d.images.some((i) => i.uploading);
                const different = hasOverrides(d.overrides);
                return (
                  <div key={d.id} className="flex flex-col gap-1">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-foam">
                      <button
                        type="button"
                        onClick={() => openUpdateSheet(d)}
                        className="absolute inset-0"
                        aria-label={d.name || 'Update design'}
                      >
                        {lead ? (
                          <img
                            src={lead.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                        {busy ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-sm font-bold text-white">
                            …
                          </div>
                        ) : null}
                      </button>
                      {d.images.length > 1 ? (
                        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-ink/70 px-1.5 text-[11px] font-semibold text-white">
                          {d.images.length}
                        </span>
                      ) : null}
                      {different ? (
                        <span className="pointer-events-none absolute left-1 top-1 rounded bg-accent px-1.5 text-[10px] font-bold text-white">
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
                      placeholder="Name"
                      disabled={busy}
                      aria-label="Design name"
                      className="min-h-9 w-full rounded-lg border border-line bg-surface px-1.5 text-center text-xs font-medium text-ink outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>
                );
              })}
              {!searchQ || !isLarge ? (
                <button
                  type="button"
                  onClick={openPickerForNew}
                  disabled={uploading || drafts.length >= MAX_DESIGNS}
                  className="flex aspect-square flex-col items-center justify-center gap-1 self-start rounded-xl border border-dashed border-line text-muted disabled:opacity-40"
                >
                  <PlusIcon width={22} height={22} />
                  <span className="text-xs font-medium">Add</span>
                </button>
              ) : null}
            </div>
            {isLarge && searchQ && visibleDrafts.length === 0 ? (
              <p className="mt-2 text-center text-sm text-muted">No designs match that name.</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4">
            {sectionTitle('Same for all')}
            <div className="flex flex-col gap-3">
              <Field label="Category">
                <SuggestInput
                  kind="category"
                  mode="list"
                  value={sharedCategory}
                  onChange={setSharedCategory}
                  placeholder="Sarees"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rate">
                  <TextInput
                    type="number"
                    value={sharedRate}
                    onChange={(e) => setSharedRate(e.target.value)}
                    placeholder="1200"
                  />
                </Field>
                <Field label="Unit">{unitSelect(sharedUnit, setSharedUnit)}</Field>
              </div>
              <Field label="Minimum order">
                <TextInput
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={sharedMoq}
                  onChange={(e) => setSharedMoq(e.target.value)}
                  placeholder="100 pieces"
                />
              </Field>
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
              disabled={!allUploaded || readyCount === 0 || saveAll.isPending || uploading}
              onClick={() => saveAll.mutate({})}
            >
              {saveAll.isPending && !publishOpen
                ? progressLabel || 'Saving…'
                : `Save ${readyCount || drafts.length} draft${readyCount === 1 ? '' : 's'}`}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={!allUploaded || readyCount === 0 || saveAll.isPending || uploading}
              onClick={() => setPublishOpen(true)}
            >
              Save & publish…
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
            disabled={!canSubmitPublish || saveAll.isPending}
            onClick={() => saveAll.mutate({ publish: true })}
          >
            {saveAll.isPending ? progressLabel || 'Publishing…' : `Publish ${readyCount}`}
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
        open={cameraOpen}
        maxShots={Math.max(0, MAX_DESIGNS - drafts.length)}
        onCancel={() => setCameraOpen(false)}
        onUnavailable={onCameraUnavailable}
        onDone={(files) => {
          setCameraOpen(false);
          void onFiles(files);
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
            <Field label="Name">
              <TextInput
                value={editDraft.name}
                onChange={(e) => setName(editDraft.id, e.target.value)}
                placeholder="Design name"
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {editDraft.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-xl bg-foam"
                  >
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                    {img.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-sm font-bold text-white">
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
                  onClick={() => openPickerForDraft(editDraft.id)}
                  disabled={uploading}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted disabled:opacity-40"
                >
                  <PlusIcon width={22} height={22} />
                  <span className="text-xs font-medium">Add</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-sm font-semibold text-ink">Different details</p>
              <div className="flex flex-col gap-3">
                <Field label="Category">
                  <SuggestInput
                    kind="category"
                    mode="list"
                    value={sheetCategory}
                    onChange={setSheetCategory}
                    placeholder="Sarees"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rate">
                    <TextInput
                      type="number"
                      value={sheetRate}
                      onChange={(e) => setSheetRate(e.target.value)}
                      placeholder="1200"
                    />
                  </Field>
                  <Field label="Unit">{unitSelect(sheetUnit, setSheetUnit)}</Field>
                </div>
                <Field label="Minimum order">
                  <TextInput
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={sheetMoq}
                    onChange={(e) => setSheetMoq(e.target.value)}
                    placeholder="100 pieces"
                  />
                </Field>
                <Field label="Notes">
                  <ExpandableNotes
                    value={sheetNotes}
                    onChange={setSheetNotes}
                    placeholder="e.g. 44 inch, cotton"
                  />
                </Field>
                <Button variant="secondary" fullWidth onClick={clearSheetOverrides}>
                  Use same as all
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
