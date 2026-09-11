import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BroadcastListView,
  CompanySettingsView,
  ConnectionView,
  CreateProductDto,
  PostProductToMarketDto,
  ProductView,
} from '@ekum/domain-types';
import { ProductStatus, PublishAudience, Unit, unitValues } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import { Button, Field, LoadingBlock, Sheet, TextArea, TextInput, cx } from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';
import { CameraIcon, MoreHorizontalIcon, PlusIcon } from '@/ui/icons';
import { useToast } from '@/ui/Toast';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { readCompanyPublishDefaults } from './publishDefaults';
import { productStatusLine, auditLine } from './productStatusSummary';
import { readCatalogFieldMemory, writeCatalogFieldMemory } from './catalogFieldMemory';
import {
  emptyPublishAudienceState,
  publishAudienceCanSubmit,
  publishAudienceDtoFields,
  PublishAudienceFields,
  restorePublishAudienceState,
  selectCreatedGroup,
  type PublishAudienceState,
} from './PublishAudienceFields';

function parseList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function ProductEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const moreAnchorRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  /** Successful save/navigate must not trip the discard sheet. */
  const leaveBypassRef = useRef(false);
  const phone = isPhoneLike();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState({ top: 0, right: 8 });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<boolean | 'gallery'>(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const memory = readCatalogFieldMemory();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    rate: '',
    moq: '',
    unit: editing ? '' : memory.unit,
    description: '',
    categories: editing ? '' : memory.category,
  });
  const [publishAudience, setPublishAudience] = useState<PublishAudienceState>(() =>
    emptyPublishAudienceState(),
  );
  const [consent, setConsent] = useState(false);
  const savedSnapshotRef = useRef<string | null>(null);

  const existing = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductView>(`/products/${id}`),
    enabled: editing,
  });
  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: marketOpen,
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled: editing || (marketOpen && publishAudience.audience === PublishAudience.Selected),
  });
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: marketOpen,
  });

  const canPublishAlready = Boolean(company.data?.capabilities.publish);
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');
  const onMarket = Boolean(existing.data?.postedToMarketAt);
  const isDraft = existing.data?.status === ProductStatus.Draft;
  const isPublished = existing.data?.status === ProductStatus.Published;
  const isArchived = existing.data?.status === ProductStatus.Archived;
  const statusLine = existing.data
    ? productStatusLine(existing.data, broadcastLists.data ?? [])
    : null;
  const hasExtraDetails = Boolean(
    form.sku.trim() ||
      form.categories.trim() ||
      form.description.trim() ||
      existing.data?.sku,
  );

  useEffect(() => {
    if (existing.data) {
      setForm({
        name: existing.data.name,
        sku: existing.data.sku ?? '',
        rate: existing.data.rate === null ? '' : String(existing.data.rate),
        moq:
          existing.data.moq === null || existing.data.moq === undefined
            ? ''
            : String(existing.data.moq),
        unit: existing.data.unit ?? '',
        description: existing.data.description ?? '',
        categories: existing.data.categories.join(', '),
      });
      setImageUrls(existing.data.images);
      setDetailsOpen(
        Boolean(
          existing.data.sku ||
            existing.data.categories.length ||
            existing.data.description?.trim(),
        ),
      );
      setPublishAudience(
        restorePublishAudienceState({
          audience: existing.data.audience || PublishAudience.Followers,
          audienceCompanyIds: existing.data.audienceCompanyIds ?? [],
          audienceGroupIds: existing.data.audienceGroupIds ?? [],
          rateVisibility: existing.data.rateVisibility,
          allowForward: existing.data.allowForward !== false,
        }),
      );
      savedSnapshotRef.current = JSON.stringify({
        name: existing.data.name,
        sku: existing.data.sku ?? '',
        rate: existing.data.rate === null ? '' : String(existing.data.rate),
        moq:
          existing.data.moq === null || existing.data.moq === undefined
            ? ''
            : String(existing.data.moq),
        unit: existing.data.unit ?? '',
        description: existing.data.description ?? '',
        categories: existing.data.categories.join(', '),
        images: existing.data.images,
      });
    }
  }, [existing.data]);

  useEffect(() => {
    if (!marketOpen || !settings.data) return;
    if (existing.data?.postedToMarketAt) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    setPublishAudience((prev) => ({
      ...prev,
      rateVisibility: usual.rateVisibility,
      allowForward: usual.allowForward,
      policyHint: null,
    }));
  }, [marketOpen, settings.data, existing.data?.postedToMarketAt]);

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

  const openPicker = () => {
    if (phone) {
      setPickerOpen(true);
      return;
    }
    setCaptureMode('gallery');
    queueMicrotask(() => fileRef.current?.click());
  };

  const pick = (mode: 'camera' | 'gallery') => {
    setPickerOpen(false);
    setCaptureMode(mode === 'camera' ? true : 'gallery');
    queueMicrotask(() => fileRef.current?.click());
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of [...fileList]) {
        const url = await uploadImage(file);
        setImageUrls((prev) => [...prev, url]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['product', id] });
    void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    void queryClient.invalidateQueries({ queryKey: ['explore', 'feed'] });
    void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
  };

  const save = useMutation({
    mutationFn: () => {
      const dto: CreateProductDto = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        rate: form.rate.trim() ? Number(form.rate) : null,
        moq: form.moq.trim() ? Number(form.moq) : null,
        unit: form.unit ? (form.unit as (typeof unitValues)[number]) : undefined,
        description: form.description.trim() || undefined,
        categories: parseList(form.categories),
        images: imageUrls,
      };
      return editing
        ? api.patch<ProductView>(`/products/${id}`, dto)
        : api.post<ProductView>('/products', dto);
    },
    onSuccess: (product) => {
      if (!editing) {
        writeCatalogFieldMemory(form.categories, form.unit);
      }
      invalidate();
      showToast(editing ? 'Updated' : 'Design saved');
      leaveBypassRef.current = true;
      navigate(`/catalog/products/${product.id}`, { replace: true });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not save the design.';
      setError(message);
      showToast(message, 'danger');
    },
  });

  const postToMarket = useMutation({
    mutationFn: () => {
      const dto: PostProductToMarketDto = {
        audience: publishAudience.audience as PostProductToMarketDto['audience'],
        rateVisibility: publishAudience.rateVisibility as PostProductToMarketDto['rateVisibility'],
        allowForward: publishAudience.allowForward,
        ...publishAudienceDtoFields(publishAudience),
        ...(canPublishAlready ? {} : { consentToSell: true }),
      };
      return api.post<ProductView>(`/products/${id}/post-to-market`, dto);
    },
    onSuccess: () => {
      setMarketOpen(false);
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      const firstPublish = !isPublished;
      if (!publishAudience.allowForward) {
        showToast('Buyers can’t forward this.');
      } else {
        showToast(onMarket || isPublished ? 'Visibility updated' : 'Published');
      }
      if (firstPublish) {
        leaveBypassRef.current = true;
        navigate('/catalog?tab=products', {
          replace: true,
          state: { productFilter: 'published' },
        });
      }
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not publish.';
      setError(message);
      showToast(message, 'danger');
    },
  });

  const unpublish = useMutation({
    mutationFn: () => api.post<ProductView>(`/products/${id}/unpublish`, {}),
    onSuccess: () => {
      setMoreOpen(false);
      invalidate();
      showToast('Hidden · draft');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not hide.', 'danger');
    },
  });

  const archive = useMutation({
    mutationFn: () => api.post<ProductView>(`/products/${id}/archive`, {}),
    onSuccess: () => {
      setMoreOpen(false);
      invalidate();
      showToast('Archived');
      leaveBypassRef.current = true;
      navigate('/catalog?tab=products');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not archive.', 'danger');
    },
  });

  const restore = useMutation({
    mutationFn: () => api.post<ProductView>(`/products/${id}/unarchive`, {}),
    onSuccess: () => {
      setMoreOpen(false);
      invalidate();
      showToast('Restored to draft');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not restore.', 'danger');
    },
  });

  const canSubmitMarket =
    (canPublishAlready || consent) && publishAudienceCanSubmit(publishAudience);
  const showLifecycleMenu = editing && Boolean(existing.data);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        name: form.name,
        sku: form.sku,
        rate: form.rate,
        moq: form.moq,
        unit: form.unit,
        description: form.description,
        categories: form.categories,
        images: imageUrls,
      }),
    [form, imageUrls],
  );
  const productDirty = useMemo(
    () =>
      editing
        ? savedSnapshotRef.current !== null && formSnapshot !== savedSnapshotRef.current
        : Boolean(
            form.name.trim() ||
              form.sku.trim() ||
              form.rate.trim() ||
              form.moq.trim() ||
              form.description.trim() ||
              form.categories.trim() ||
              imageUrls.length > 0 ||
              uploading,
          ),
    [editing, formSnapshot, form, imageUrls.length, uploading],
  );
  const discard = useDiscardGuard(productDirty, leaveBypassRef);

  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading design…" />;
  }

  return (
    <div className={cx('flex flex-col gap-4', editing ? 'pb-44' : 'pb-8')}>
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title={editing ? 'Edit design' : 'Upload a design'}
        onBack={() => discard.tryLeave(() => navigate(-1))}
        action={
          showLifecycleMenu ? (
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
          ) : undefined
        }
      />

      {editing && statusLine ? (
        <div className="-mt-2">
          {isPublished ? (
            <button
              type="button"
              onClick={() => setMarketOpen(true)}
              className="text-left text-sm text-muted"
            >
              {statusLine}
            </button>
          ) : (
            <p className="text-sm text-muted">{statusLine}</p>
          )}
          {existing.data ? (
            <p className="mt-0.5 text-xs text-muted">{auditLine(existing.data)}</p>
          ) : null}
        </div>
      ) : null}

      {imageUrls.length === 0 ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam text-muted"
        >
          <CameraIcon width={32} height={32} />
          <span className="text-sm font-medium text-ink">
            {uploading ? 'Uploading…' : 'Add photo · camera or gallery'}
          </span>
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url) => (
            <div
              key={url}
              className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl bg-foam"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-sm text-white"
                onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="flex h-36 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-muted"
          >
            <PlusIcon width={20} height={20} />
            <span className="text-xs">{uploading ? '…' : 'Add'}</span>
          </button>
        </div>
      )}

      <Field label="Name" error={error && !detailsOpen ? error : undefined}>
        <TextInput
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Blue georgette saree"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate" hint="Blank = on request">
          <TextInput
            type="number"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            placeholder="1200"
          />
        </Field>
        <Field label="Unit">
          <select
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-accent"
          >
            <option value="">—</option>
            {unitValues.map((unit) => (
              <option key={unit} value={unit}>
                {unit === Unit.Metre ? 'metre' : unit}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Minimum order" hint="Pieces · blank if no minimum">
        <TextInput
          type="number"
          min={1}
          inputMode="numeric"
          value={form.moq}
          onChange={(e) => setForm({ ...form, moq: e.target.value })}
          placeholder="100"
        />
      </Field>

      {detailsOpen || hasExtraDetails ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-sm font-medium text-accent"
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {detailsOpen ? 'Hide details' : 'More details'}
          </button>
          {detailsOpen ? (
            <>
              <Field
                label="Reference / SKU"
                hint={
                  existing.data?.sku
                    ? 'Locked for this design.'
                    : 'Optional — Ekum assigns one if you leave this blank.'
                }
              >
                <TextInput
                  value={form.sku || existing.data?.sku || ''}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  disabled={Boolean(existing.data?.sku)}
                  placeholder="Leave blank to auto-assign"
                />
              </Field>
              <Field label="Categories" hint="Comma-separated.">
                <SuggestInput
                  kind="category"
                  mode="list"
                  value={form.categories}
                  onChange={(categories) => setForm({ ...form, categories })}
                  placeholder="sarees, party wear"
                />
              </Field>
              <Field
                label="Notes"
                hint="Fabric, size, width — anything buyers should know."
                error={error}
              >
                <TextArea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 44 inch, cotton, queen size"
                />
              </Field>
            </>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="self-start text-sm font-medium text-accent"
          onClick={() => setDetailsOpen(true)}
        >
          More details
        </button>
      )}

      {editing && existing.data
        ? createPortal(
            <div className="fixed inset-x-0 bottom-[4.75rem] z-30 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md">
              <div className="mx-auto flex max-w-md gap-2">
                <Button
                  variant="secondary"
                  className="min-w-0 flex-1"
                  disabled={!form.name.trim() || save.isPending || uploading}
                  onClick={() => save.mutate()}
                >
                  {save.isPending ? 'Updating…' : 'Update'}
                </Button>
                {isArchived ? (
                  <Button
                    className="min-w-0 flex-1"
                    disabled={restore.isPending}
                    onClick={() => restore.mutate()}
                  >
                    {restore.isPending ? 'Restoring…' : 'Restore'}
                  </Button>
                ) : isDraft ? (
                  <Button
                    className="min-w-0 flex-1"
                    disabled={imageUrls.length < 1}
                    onClick={() => setMarketOpen(true)}
                  >
                    Publish
                  </Button>
                ) : (
                  <Button className="min-w-0 flex-1" onClick={() => setMarketOpen(true)}>
                    Visibility
                  </Button>
                )}
              </div>
            </div>,
            document.body,
          )
        : (
          <Button
            fullWidth
            disabled={!form.name.trim() || save.isPending || uploading}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Saving…' : 'Save design'}
          </Button>
        )}

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
                    disabled={restore.isPending}
                    className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                    onClick={() => restore.mutate()}
                  >
                    Restore to draft
                  </button>
                ) : (
                  <>
                    {isPublished ? (
                      <button
                        type="button"
                        role="menuitem"
                        disabled={unpublish.isPending}
                        className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                        onClick={() => unpublish.mutate()}
                      >
                        Hide · back to draft
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      disabled={archive.isPending}
                      className={cx(
                        'flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-danger hover:bg-foam/70 disabled:opacity-40',
                        isPublished && 'border-t border-line/70',
                      )}
                      onClick={() => archive.mutate()}
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

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        capture={captureMode === true ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add photo">
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => pick('camera')}>
            Camera
          </Button>
          <Button variant="secondary" fullWidth onClick={() => pick('gallery')}>
            Gallery
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={marketOpen}
        onClose={() => setMarketOpen(false)}
        title={isPublished ? 'Visibility & rates' : 'Publish'}
        footer={
          <Button
            fullWidth
            disabled={!canSubmitMarket || postToMarket.isPending}
            onClick={() => postToMarket.mutate()}
          >
            {postToMarket.isPending
              ? 'Publishing…'
              : onMarket
                ? 'Update visibility'
                : 'Publish'}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {!isPublished ? (
            <p className="text-sm text-muted">
              Choose who can see this design and whether rates show.
            </p>
          ) : null}

          <PublishAudienceFields
            state={publishAudience}
            onChange={setPublishAudience}
            lists={broadcastLists.data ?? []}
            connections={activeConnections}
            connectionsLoading={connections.isLoading}
            tradeDefaults={settings.data?.tradeDefaults}
            isVisibilityUpdate={Boolean(onMarket)}
            showConsent={!canPublishAlready}
            consent={consent}
            onConsent={setConsent}
            consentLabel="Start selling — put this design on Explore?"
            onCreateGroup={() => setCreateGroupOpen(true)}
          />

          {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
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
