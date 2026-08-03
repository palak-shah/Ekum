import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductDto, ProductView } from '@ekum/domain-types';
import { Unit, unitValues } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Field, LoadingBlock, Sheet, TextArea, TextInput } from '@/ui/kit';
import { CameraIcon, PlusIcon } from '@/ui/icons';

function parseList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function ProductEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const phone = isPhoneLike();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<boolean | 'gallery'>(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    rate: '',
    unit: '' as string,
    description: '',
    categories: '',
  });

  const existing = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductView>(`/products/${id}`),
    enabled: editing,
  });

  useEffect(() => {
    if (existing.data) {
      setForm({
        name: existing.data.name,
        sku: existing.data.sku ?? '',
        rate: existing.data.rate === null ? '' : String(existing.data.rate),
        unit: existing.data.unit ?? '',
        description: existing.data.description ?? '',
        categories: existing.data.categories.join(', '),
      });
      setImageUrls(existing.data.images);
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
      for (const file of [...fileList].slice(0, 12 - imageUrls.length)) {
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

  const save = useMutation({
    mutationFn: () => {
      const dto: CreateProductDto = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        rate: form.rate.trim() ? Number(form.rate) : null,
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
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      navigate(`/products/${product.id}`, { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save the design.'),
  });

  const publish = useMutation({
    mutationFn: () => api.post<ProductView>(`/products/${id}/publish`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', id] });
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not publish.'),
  });

  if (editing && existing.isLoading) {
    return <LoadingBlock label="Loading design…" />;
  }

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
          {imageUrls.length < 12 ? (
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted"
            >
              <PlusIcon width={18} height={18} />
              <span className="text-[10px]">{uploading ? '…' : 'Add'}</span>
            </button>
          ) : null}
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
      <Field label="Reference / SKU" hint="Optional.">
        <TextInput value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
      </Field>
      <Field label="Categories" hint="Comma-separated.">
        <TextInput value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="sarees, party wear" />
      </Field>
      <Field label="Description" error={error}>
        <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>

      <Button fullWidth disabled={!form.name.trim() || save.isPending || uploading} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save design'}
      </Button>
      {editing && existing.data?.status === 'draft' ? (
        <Button variant="secondary" fullWidth disabled={publish.isPending} onClick={() => publish.mutate()}>
          {publish.isPending ? 'Publishing…' : 'Publish'}
        </Button>
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
    </div>
  );
}
