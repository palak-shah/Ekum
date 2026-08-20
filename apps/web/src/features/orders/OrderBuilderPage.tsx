import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  CollectionPreviewView,
  ConnectionView,
  CreateOrderDto,
  OrderView,
} from '@ekum/domain-types';
import { OrderKind } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { isPhoneLike, uploadImage } from '@/lib/mediaUpload';
import { PageHeader } from '@/ui/PageHeader';
import { ConnectionPicker } from '@/ui/ConnectionPicker';
import { Button, Card, Field, InlineNotice, LoadingBlock, TextArea, TextInput, cx } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { CameraIcon } from '@/ui/icons';
import { ContinuousCamera } from '@/ui/ContinuousCamera';

interface PhotoLine {
  id: string;
  previewUrl: string;
  imageUrl: string;
  quantity: string;
  uploading: boolean;
}

interface StandardLine {
  productId: string;
  name: string;
  image: string | null;
  rate: number | null;
  unit: string | null;
  quantity: string;
}

/** Wholesale-scale presets — traders usually think in 50s / 100s, not singles. */
const QTY_PRESETS = ['50', '100', '200', '500', '1000'] as const;
const DEFAULT_QTY = '100';
const MAX_PHOTOS = 12;

function isQtyPreset(value: string): boolean {
  return (QTY_PRESETS as readonly string[]).includes(value);
}

function newPhotoId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OrderBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const sellerFromUrl = params.get('seller') ?? '';
  const collectionId = params.get('collection') ?? '';
  const productIds = (params.get('products') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const isStandard = productIds.length > 0 && Boolean(collectionId);

  const [sellerId, setSellerId] = useState(sellerFromUrl);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<PhotoLine[]>([]);
  const [standardLines, setStandardLines] = useState<StandardLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkQty, setBulkQty] = useState(DEFAULT_QTY);
  const [bulkDraft, setBulkDraft] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const phone = isPhoneLike();
  const galleryInputId = useId();

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
  });

  const collection = useQuery({
    queryKey: ['collection-preview', collectionId],
    queryFn: () => api.get<CollectionPreviewView>(`/explore/collections/${collectionId}`),
    enabled: isStandard,
  });

  useEffect(() => {
    const selected = new Set(productIds);
    const rows = (collection.data?.products ?? []).filter((product) => selected.has(product.id));
    if (rows.length > 0) {
      setStandardLines(
        rows.map((product) => ({
          productId: product.id,
          name: product.name,
          image: product.images[0] ?? null,
          rate: product.rate,
          unit: product.unit,
          quantity: DEFAULT_QTY,
        })),
      );
      setBulkQty(DEFAULT_QTY);
      setBulkDraft('');
    }
  }, [collection.data, productIds.join(',')]);

  const applyQtyToAll = (qty: string) => {
    const cleaned = qty.trim().replace(/[^\d]/g, '');
    if (!cleaned || Number(cleaned) < 1) return;
    if (isStandard) {
      setStandardLines((prev) => prev.map((line) => ({ ...line, quantity: cleaned })));
    } else {
      setPhotos((prev) => prev.map((photo) => ({ ...photo, quantity: cleaned })));
    }
    setBulkQty(cleaned);
    setBulkDraft(isQtyPreset(cleaned) ? '' : cleaned);
  };

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        if (photo.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      }
    };
    // Only revoke on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useMutation({
    mutationFn: () => {
      const dto: CreateOrderDto = isStandard
        ? {
            sellerCompanyId: sellerId,
            kind: OrderKind.Standard,
            note: note || undefined,
            items: standardLines.map((line) => ({
              productId: line.productId,
              quantity: Number(line.quantity) || 1,
              images: [],
            })),
          }
        : {
            sellerCompanyId: sellerId,
            kind: OrderKind.Photo,
            note: note || undefined,
            items: photos.map((line, index) => ({
              name: `Photo ${index + 1}`,
              quantity: Number(line.quantity) || 1,
              images: [line.imageUrl],
            })),
          };
      return api.post<OrderView & { threadId?: string | null }>('/orders', dto);
    },
    onSuccess: (order) => {
      if (order.threadId) {
        navigate(`/chats/${order.threadId}`, { replace: true });
      } else {
        navigate(`/orders/${order.id}`, { replace: true });
      }
    },
    onError: (err) => {
      setError(null);
      showToast(
        err instanceof ApiError ? err.message : 'Could not place the order.',
        'danger',
      );
    },
  });

  const openGallery = () => {
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setError(null);
    galleryInputRef.current?.click();
  };

  const openAddPhotos = () => {
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setError(null);
    if (phone) {
      setCameraOpen(true);
      return;
    }
    openGallery();
  };

  const onCameraUnavailable = useCallback(() => {
    setCameraOpen(false);
    setError(null);
    queueMicrotask(() => galleryInputRef.current?.click());
  }, []);

  const onFiles = async (incoming: FileList | File[] | null) => {
    if (!incoming || (incoming instanceof FileList ? !incoming.length : incoming.length === 0)) {
      return;
    }
    setError(null);
    const remaining = MAX_PHOTOS - photos.length;
    const files = [...incoming].slice(0, remaining);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const id = newPhotoId();
        const previewUrl = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          {
            id,
            previewUrl,
            imageUrl: '',
            quantity: bulkQty || DEFAULT_QTY,
            uploading: true,
          },
        ]);
        try {
          const imageUrl = await uploadImage(file);
          setPhotos((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, imageUrl, uploading: false } : item,
            ),
          );
        } catch (err) {
          setPhotos((prev) => prev.filter((item) => item.id !== id));
          URL.revokeObjectURL(previewUrl);
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const canSubmit = isStandard
    ? sellerId &&
      standardLines.length > 0 &&
      standardLines.every((line) => Number(line.quantity) > 0)
    : sellerId &&
      photos.length > 0 &&
      photos.every((line) => line.imageUrl && !line.uploading && Number(line.quantity) > 0) &&
      !uploading;

  if (connections.isLoading || (isStandard && collection.isLoading)) {
    return <LoadingBlock label="Loading…" />;
  }

  const sellers = (connections.data ?? []).filter((connection) => connection.status === 'active');
  const atPhotoLimit = photos.length >= MAX_PHOTOS;
  const cameraSlots = Math.max(0, MAX_PHOTOS - photos.length);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader title={isStandard ? 'Order designs' : 'Photo order'} />

      {isStandard ? (
        <div className="flex flex-col gap-3">
          {!sellerFromUrl ? (
            <ConnectionPicker
              mode="single"
              label="Supplier"
              chooseLabel="Choose supplier"
              connections={sellers}
              value={sellerId || null}
              onChange={(id) => setSellerId(id ?? '')}
              emptyMessage="Connect with a business first, then place an order."
            />
          ) : null}
          <Card className="flex flex-col gap-2">
            <p className="text-sm font-bold tracking-tight text-ink">Same pieces for all</p>
            <p className="text-xs text-muted">Tap a number, or type your own and press Apply.</p>
            <div className="flex flex-wrap gap-2">
              {QTY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyQtyToAll(preset)}
                  className={cx(
                    'min-h-11 min-w-[3.25rem] rounded-xl px-3 text-sm font-bold',
                    bulkQty === preset ? 'bg-accent text-white' : 'bg-foam text-slate',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <TextInput
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="e.g. 150"
                className="min-h-11 flex-1"
                value={bulkDraft}
                onChange={(event) => setBulkDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyQtyToAll(bulkDraft);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 shrink-0 px-4"
                disabled={!bulkDraft.trim()}
                onClick={() => applyQtyToAll(bulkDraft)}
              >
                Apply
              </Button>
            </div>
          </Card>
          {standardLines.map((line, index) => (
            <Card key={line.productId} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {line.image ? (
                  <img src={line.image} alt={line.name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-foam text-lg font-bold text-muted">
                    {line.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{line.name}</p>
                  <p className="text-xs text-muted">{formatRate(line.rate, line.unit)}</p>
                </div>
              </div>
              <Field label="Pieces">
                <TextInput
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={line.quantity}
                  onChange={(event) =>
                    setStandardLines((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, quantity: event.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {photos.length === 0 ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={openAddPhotos}
                disabled={uploading}
                className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam text-muted hover:border-accent hover:text-accent"
              >
                <CameraIcon width={32} height={32} />
                <span className="text-sm font-semibold text-ink">Add photos</span>
              </button>
              <button
                type="button"
                onClick={openGallery}
                disabled={uploading}
                className="py-1 text-center text-sm font-medium text-accent"
              >
                Choose from gallery
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="flex flex-col gap-1.5">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-foam">
                      <img
                        src={photo.previewUrl || photo.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {photo.uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                          Uploading…
                        </div>
                      ) : null}
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                      >
                        ×
                      </button>
                    </div>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-muted">Pieces</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        aria-label="Pieces"
                        className="min-h-10 w-full rounded-xl border border-line bg-surface px-2 text-center text-sm font-bold text-ink outline-none focus:border-accent"
                        value={photo.quantity}
                        onChange={(event) =>
                          setPhotos((prev) =>
                            prev.map((item) =>
                              item.id === photo.id
                                ? { ...item, quantity: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                ))}
                {!atPhotoLimit ? (
                  <button
                    type="button"
                    onClick={openAddPhotos}
                    disabled={uploading}
                    className="flex aspect-square flex-col items-center justify-center gap-1 self-start rounded-xl border border-dashed border-line bg-surface text-muted hover:border-accent hover:text-accent"
                  >
                    <CameraIcon width={22} height={22} />
                    <span className="text-xs font-semibold">Add</span>
                  </button>
                ) : null}
              </div>
              {!atPhotoLimit ? (
                <button
                  type="button"
                  onClick={openGallery}
                  disabled={uploading}
                  className="text-left text-sm font-medium text-accent"
                >
                  Choose from gallery
                </button>
              ) : null}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold tracking-tight text-ink">Pieces for all</p>
                <div className="flex flex-wrap gap-2">
                  {QTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyQtyToAll(preset)}
                      className={cx(
                        'min-h-11 min-w-[3.25rem] rounded-xl px-3 text-sm font-bold',
                        bulkQty === preset ? 'bg-accent text-white' : 'bg-foam text-slate',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <input
            id={galleryInputId}
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            multiple
            className="hidden"
            onChange={(event) => void onFiles(event.target.files)}
          />

          {!sellerFromUrl ? (
            <ConnectionPicker
              mode="single"
              label="Supplier"
              chooseLabel="Choose supplier"
              connections={sellers}
              value={sellerId || null}
              onChange={(id) => setSellerId(id ?? '')}
              emptyMessage="Connect with a business first, then place an order."
            />
          ) : null}
        </div>
      )}

      <Field label="Note">
        <TextArea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            isStandard
              ? 'Delivery timeline, packing…'
              : 'Closest matching designs and rate…'
          }
        />
      </Field>

      {error ? <InlineNotice message={error} /> : null}

      <div className="border-t border-line pt-4">
        <Button fullWidth disabled={!canSubmit || create.isPending} onClick={() => create.mutate()}>
          {create.isPending
            ? 'Sending…'
            : isStandard
              ? 'Send order request'
              : 'Send photo order'}
        </Button>
      </div>

      <ContinuousCamera
        open={cameraOpen}
        maxShots={cameraSlots}
        onCancel={() => setCameraOpen(false)}
        onUnavailable={onCameraUnavailable}
        onDone={(files) => {
          setCameraOpen(false);
          void onFiles(files);
        }}
      />
    </div>
  );
}
