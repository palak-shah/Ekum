import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProductDto, ProductView } from '@ekum/domain-types';
import { Unit, unitValues } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Field, Sheet, TextInput, cx } from '@/ui/kit';
import { CameraIcon, PlusIcon } from '@/ui/icons';

type Draft = {
  id: string;
  previewUrl: string;
  imageUrl: string;
  name: string;
  uploading: boolean;
};

const MAX = 24;

/**
 * PDF 11 + 11a: pick photos (camera/gallery) → draft review with Apply-to-all
 * → save each as a design. Name is required per design; shared fields once.
 */
export function DesignBatchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const phone = isPhoneLike();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<boolean | 'gallery'>(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Apply-to-all shared fields
  const [sharedCategory, setSharedCategory] = useState('');
  const [sharedRate, setSharedRate] = useState('');
  const [sharedUnit, setSharedUnit] = useState<string>('');

  const openPicker = () => {
    if (drafts.length >= MAX) {
      setError(`You can add up to ${MAX} designs at once.`);
      return;
    }
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
    const files = [...fileList].slice(0, MAX - drafts.length);
    setUploading(true);
    try {
      for (const file of files) {
        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        setDrafts((prev) => [
          ...prev,
          { id, previewUrl, imageUrl: '', name: '', uploading: true },
        ]);
        try {
          const imageUrl = await uploadImage(file);
          setDrafts((prev) =>
            prev.map((d) => (d.id === id ? { ...d, imageUrl, uploading: false } : d)),
          );
        } catch (err) {
          setDrafts((prev) => prev.filter((d) => d.id !== id));
          URL.revokeObjectURL(previewUrl);
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = (id: string) => {
    setDrafts((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((d) => d.id !== id);
    });
  };

  const setName = (id: string, name: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  };

  const saveAll = useMutation({
    mutationFn: async () => {
      const ready = drafts.filter((d) => d.imageUrl && d.name.trim());
      if (ready.length === 0) {
        throw new ApiError({
          statusCode: 400,
          code: 'VALIDATION',
          message: 'Name each design before saving.',
          details: null,
        });
      }
      const categories = sharedCategory
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const rate = sharedRate.trim() ? Number(sharedRate) : null;
      const unit = sharedUnit || undefined;
      const created: ProductView[] = [];
      for (const draft of ready) {
        const dto: CreateProductDto = {
          name: draft.name.trim(),
          rate,
          unit: unit as CreateProductDto['unit'],
          categories,
          images: [draft.imageUrl],
        };
        created.push(await api.post<ProductView>('/products', dto));
      }
      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      navigate('/catalog', { replace: true });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not save designs.'),
  });

  const readyCount = drafts.filter((d) => d.imageUrl && d.name.trim() && !d.uploading).length;
  const allUploaded = drafts.length > 0 && drafts.every((d) => d.imageUrl && !d.uploading);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Add designs" subtitle="Camera or gallery · name each one" />

      {drafts.length === 0 ? (
        <button
          type="button"
          onClick={openPicker}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-foam px-6 py-16 text-muted"
        >
          <CameraIcon width={32} height={32} />
          <span className="text-sm font-medium text-ink">Add photos</span>
          <span className="text-xs">Camera or gallery — then name each design</span>
        </button>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface p-3.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Apply to all
            </p>
            <div className="flex flex-col gap-3">
              <Field label="Category" hint="Optional · comma-separated">
                <TextInput
                  value={sharedCategory}
                  onChange={(e) => setSharedCategory(e.target.value)}
                  placeholder="Sarees"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rate" hint="Blank = on request">
                  <TextInput
                    type="number"
                    value={sharedRate}
                    onChange={(e) => setSharedRate(e.target.value)}
                    placeholder="1200"
                  />
                </Field>
                <Field label="Unit">
                  <select
                    value={sharedUnit}
                    onChange={(e) => setSharedUnit(e.target.value)}
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
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {drafts.map((draft, index) => (
              <div
                key={draft.id}
                className="flex gap-3 rounded-2xl border border-line bg-surface p-2.5"
              >
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-foam">
                  <img src={draft.previewUrl} alt="" className="h-full w-full object-cover" />
                  {draft.uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-[10px] font-bold text-white">
                      …
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[11px] font-medium text-muted">Design {index + 1}</p>
                  <TextInput
                    value={draft.name}
                    onChange={(e) => setName(draft.id, e.target.value)}
                    placeholder="Name (required)"
                    disabled={draft.uploading}
                  />
                  <button
                    type="button"
                    className="mt-1.5 text-xs font-medium text-danger"
                    onClick={() => remove(draft.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={openPicker}
            disabled={uploading || drafts.length >= MAX}
            className={cx(
              'flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm font-medium text-muted',
              'hover:border-accent hover:text-accent disabled:opacity-40',
            )}
          >
            <PlusIcon width={18} height={18} />
            Add more photos
          </button>
        </>
      )}

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

      {drafts.length > 0 ? (
        <Button
          fullWidth
          disabled={!allUploaded || readyCount === 0 || saveAll.isPending}
          onClick={() => saveAll.mutate()}
        >
          {saveAll.isPending
            ? 'Saving…'
            : `Save ${readyCount || ''} design${readyCount === 1 ? '' : 's'}`}
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

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add photos">
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
