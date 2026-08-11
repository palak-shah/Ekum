import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConnectionView,
  CreateProductDto,
  PostProductToMarketDto,
  ProductView,
} from '@ekum/domain-types';
import { PublishAudience, RateVisibility, Unit, unitValues } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Field, LoadingBlock, Sheet, TextArea, TextInput, cx } from '@/ui/kit';
import { SuggestInput } from '@/ui/SuggestInput';
import { CameraIcon, PlusIcon } from '@/ui/icons';

function parseList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function ProductEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useMyCompany();
  const fileRef = useRef<HTMLInputElement>(null);
  const phone = isPhoneLike();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<boolean | 'gallery'>(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    rate: '',
    moq: '',
    unit: '' as string,
    description: '',
    categories: '',
  });
  const [audience, setAudience] = useState<string>(PublishAudience.Connections);
  const [audienceCompanies, setAudienceCompanies] = useState<Set<string>>(new Set());
  const [rateVisibility, setRateVisibility] = useState<string>(RateVisibility.OnRequest);
  const [consent, setConsent] = useState(false);

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

  const canPublishAlready = Boolean(company.data?.capabilities.publish);
  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  useEffect(() => {
    if (existing.data) {
      setForm({
        name: existing.data.name,
        sku: existing.data.sku ?? '',
        rate: existing.data.rate === null ? '' : String(existing.data.rate),
        moq: existing.data.moq === null || existing.data.moq === undefined ? '' : String(existing.data.moq),
        unit: existing.data.unit ?? '',
        description: existing.data.description ?? '',
        categories: existing.data.categories.join(', '),
      });
      setImageUrls(existing.data.images);
      setAudience(existing.data.audience || PublishAudience.Connections);
      setAudienceCompanies(new Set(existing.data.audienceCompanyIds ?? []));
      setRateVisibility(existing.data.rateVisibility || RateVisibility.OnRequest);
    }
  }, [existing.data]);

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
      invalidate();
      navigate(`/catalog/products/${product.id}`, { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save the design.'),
  });

  const publishCatalog = useMutation({
    mutationFn: () =>
      api.post<ProductView>(`/products/${id}/publish`, {
        ...(canPublishAlready ? {} : { consentToSell: true }),
      }),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not publish.'),
  });

  const postToMarket = useMutation({
    mutationFn: () => {
      const dto: PostProductToMarketDto = {
        audience: audience as PostProductToMarketDto['audience'],
        rateVisibility: rateVisibility as PostProductToMarketDto['rateVisibility'],
        ...(audience === PublishAudience.Selected
          ? { companyIds: [...audienceCompanies] }
          : {}),
        ...(canPublishAlready ? {} : { consentToSell: true }),
      };
      return api.post<ProductView>(`/products/${id}/post-to-market`, dto);
    },
    onSuccess: () => {
      setMarketOpen(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not post to Explore.'),
  });

  const unpost = useMutation({
    mutationFn: () => api.post<ProductView>(`/products/${id}/unpost-from-market`, {}),
    onSuccess: () => {
      setMarketOpen(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not remove post.'),
  });

  const canSubmitMarket =
    (canPublishAlready || consent) &&
    (audience !== PublishAudience.Selected || audienceCompanies.size > 0);

  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading design…" />;
  }

  const onMarket = Boolean(existing.data?.postedToMarketAt);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={editing ? 'Edit design' : 'Upload a design'} />

      {imageUrls.length === 0 ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam text-muted"
        >
          <CameraIcon width={28} height={28} />
          <span className="text-xs font-medium text-ink">
            {uploading ? 'Uploading…' : 'Add photo · camera or gallery'}
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl bg-foam">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-ink/60 px-1.5 text-[10px] text-white"
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
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted"
          >
            <PlusIcon width={18} height={18} />
            <span className="text-[10px]">{uploading ? '…' : 'Add'}</span>
          </button>
        </div>
      )}

      <Field label="Name">
        <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Blue georgette saree" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate" hint="Blank = on request">
          <TextInput type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="1200" />
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

      <Button fullWidth disabled={!form.name.trim() || save.isPending || uploading} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save design'}
      </Button>

      {editing && existing.data ? (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          {existing.data.status === 'draft' ? (
            <>
              {!canPublishAlready ? (
                <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>Start selling — publish this design?</span>
                </label>
              ) : null}
              <Button
                fullWidth
                disabled={publishCatalog.isPending || (!canPublishAlready && !consent)}
                onClick={() => publishCatalog.mutate()}
              >
                {publishCatalog.isPending ? 'Publishing…' : 'Publish design'}
              </Button>
            </>
          ) : (
            <Button fullWidth onClick={() => setMarketOpen(true)}>
              {onMarket ? 'Visibility & rates' : 'Post to Explore'}
            </Button>
          )}
        </div>
      ) : null}

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

      <Sheet open={marketOpen} onClose={() => setMarketOpen(false)} title="Post design to Explore">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Publish design puts it on Explore for others. Use this sheet to set who can see it and rates.
          </p>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Who can see this?</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  [PublishAudience.Everyone, 'Everyone'],
                  [PublishAudience.Connections, 'My connections'],
                  [PublishAudience.Selected, 'Selected companies'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAudience(value)}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    audience === value ? 'border-accent bg-accent/5 font-medium text-ink' : 'border-line text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {audience === PublishAudience.Selected ? (
              <div className="mt-3">
                <p className="mb-2 text-xs text-muted">
                  {audienceCompanies.size} selected · only these businesses will see it
                </p>
                <ConnectionPicker
                  mode="multi"
                  embedded
                  label=""
                  loading={connections.isLoading}
                  connections={activeConnections}
                  value={[...audienceCompanies]}
                  onChange={(ids) => setAudienceCompanies(new Set(ids))}
                  emptyMessage="Approve a connection first, then pick them here."
                />
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Show rates?</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  [RateVisibility.OnRequest, 'On request'],
                  [RateVisibility.Visible, 'Visible'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRateVisibility(value)}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm',
                    rateVisibility === value
                      ? 'border-accent bg-accent/5 font-medium text-ink'
                      : 'border-line text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!canPublishAlready ? (
            <label className="flex items-start gap-2 rounded-xl border border-line px-3 py-3 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>Start selling — put this design on Explore?</span>
            </label>
          ) : null}

          {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

          <Button
            fullWidth
            disabled={!canSubmitMarket || postToMarket.isPending}
            onClick={() => postToMarket.mutate()}
          >
            {postToMarket.isPending ? 'Posting…' : onMarket ? 'Update Explore post' : 'Post to Explore'}
          </Button>
          {onMarket ? (
            <Button
              variant="secondary"
              fullWidth
              disabled={unpost.isPending}
              onClick={() => unpost.mutate()}
            >
              Remove from Explore
            </Button>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}
