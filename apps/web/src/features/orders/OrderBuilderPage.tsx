import { useEffect, useId, useRef, useState } from 'react';
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
import { Avatar, Button, Card, Field, LoadingBlock, Sheet, TextArea, TextInput, cx } from '@/ui/kit';
import { CameraIcon, PlusIcon } from '@/ui/icons';

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

const QTY_PRESETS = ['1', '5', '10', '25'] as const;
const MAX_PHOTOS = 12;

function newPhotoId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OrderBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [captureMode, setCaptureMode] = useState<boolean | 'gallery'>(false);
  const phone = isPhoneLike();
  const fileInputId = useId();

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
          quantity: '1',
        })),
      );
    }
  }, [collection.data, productIds.join(',')]);

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
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not place the order.'),
  });

  const openPicker = () => {
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    if (phone) {
      setPickerOpen(true);
      return;
    }
    setCaptureMode(false);
    queueMicrotask(() => fileInputRef.current?.click());
  };

  const pickFromSheet = (mode: 'camera' | 'gallery') => {
    setPickerOpen(false);
    setCaptureMode(mode === 'camera' ? true : 'gallery');
    queueMicrotask(() => fileInputRef.current?.click());
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }
    setError(null);
    const remaining = MAX_PHOTOS - photos.length;
    const files = [...fileList].slice(0, remaining);
    setUploading(true);
    try {
      for (const file of files) {
        const id = newPhotoId();
        const previewUrl = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          { id, previewUrl, imageUrl: '', quantity: '1', uploading: true },
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
      photos.every((line) => line.imageUrl && !line.uploading) &&
      !uploading;

  if (connections.isLoading || (isStandard && collection.isLoading)) {
    return <LoadingBlock label="Loading…" />;
  }

  const sellers = (connections.data ?? []).filter((connection) => connection.status === 'active');
  const captureAttr =
    captureMode === true ? ('environment' as const) : undefined;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader title={isStandard ? 'Order designs' : 'Photo order'} />

      {!isStandard ? (
        <p className="text-sm text-muted">
          {phone
            ? 'Capture photos. Add rough quantity if you know it.'
            : 'Select photos. Add rough quantity if you know it.'}
        </p>
      ) : null}

      {!sellerFromUrl ? (
        isStandard ? (
          <Field label="Supplier">
            <select
              value={sellerId}
              onChange={(event) => setSellerId(event.target.value)}
              className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-accent"
            >
              <option value="">Select a connected business…</option>
              {sellers.map((connection) => (
                <option key={connection.company.id} value={connection.company.id}>
                  {connection.company.name} · {connection.company.city}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Supplier</p>
            {sellers.length === 0 ? (
              <p className="text-sm text-muted">Connect with a business first, then place an order.</p>
            ) : (
              sellers.map((connection) => (
                <button
                  key={connection.company.id}
                  type="button"
                  onClick={() => setSellerId(connection.company.id)}
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border px-3 py-3 text-left',
                    sellerId === connection.company.id
                      ? 'border-accent bg-accent/5'
                      : 'border-line bg-surface',
                  )}
                >
                  <Avatar name={connection.company.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{connection.company.name}</p>
                    <p className="truncate text-xs text-muted">{connection.company.city}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )
      ) : null}

      {isStandard ? (
        <div className="flex flex-col gap-3">
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
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">Quantity</p>
                <div className="flex flex-wrap gap-2">
                  {QTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setStandardLines((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, quantity: preset } : item)),
                        )
                      }
                      className={cx(
                        'rounded-full px-3 py-1 text-sm font-medium',
                        line.quantity === preset ? 'bg-accent text-white' : 'bg-foam text-muted',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                  <TextInput
                    type="number"
                    min={1}
                    className="w-20"
                    value={line.quantity}
                    onChange={(event) =>
                      setStandardLines((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, quantity: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="flex flex-col gap-1">
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
                <div className="flex flex-wrap gap-1">
                  {QTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setPhotos((prev) =>
                          prev.map((item) =>
                            item.id === photo.id ? { ...item, quantity: preset } : item,
                          ),
                        )
                      }
                      className={cx(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        photo.quantity === preset ? 'bg-accent text-white' : 'bg-foam text-muted',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <button
                type="button"
                onClick={openPicker}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface text-muted hover:border-accent hover:text-accent"
              >
                {phone ? <CameraIcon width={22} height={22} /> : <PlusIcon width={22} height={22} />}
                <span className="text-xs font-semibold">{phone ? 'Add photo' : 'Select photo'}</span>
              </button>
            ) : null}
          </div>
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture={captureAttr}
            multiple={!phone}
            className="hidden"
            onChange={(event) => void onFiles(event.target.files)}
          />
        </div>
      )}

      <Field label="Note">
        <TextArea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            isStandard
              ? 'Delivery timeline, packing…'
              : 'Need closest matching designs and rate.'
          }
        />
      </Field>

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}

      <Button fullWidth disabled={!canSubmit || create.isPending} onClick={() => create.mutate()}>
        {create.isPending
          ? 'Sending…'
          : isStandard
            ? 'Send order request'
            : 'Send photo order'}
      </Button>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add photo">
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => pickFromSheet('camera')}>
            Take photo
          </Button>
          <Button variant="secondary" fullWidth onClick={() => pickFromSheet('gallery')}>
            Choose from gallery
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
