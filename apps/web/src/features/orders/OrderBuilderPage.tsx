import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import { ListSquareButton } from '@/ui/ListSearchRow';
import { Button, Card, Field, InlineNotice, LoadingBlock, Sheet, TextArea, TextInput, cx } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { CameraIcon } from '@/ui/icons';
import { ContinuousCamera } from '@/ui/ContinuousCamera';
import { NoteVoiceField, type NoteVoiceValue } from '@/features/voice/NoteVoiceField';
import { orderBuilderPhotoDirty, orderBuilderStandardDirty } from './orderBuilderDirty';
import { navigateToOrderChat } from './navigateToOrderChat';

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
/** Matches API `createOrderSchema` items.max(200). */
const MAX_PHOTO_LINES = 200;
const CAMERA_BATCH = 30;

function isQtyPreset(value: string): boolean {
  return (QTY_PRESETS as readonly string[]).includes(value);
}

function newPhotoId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OrderBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [noteVoice, setNoteVoice] = useState<NoteVoiceValue>(null);
  const [photos, setPhotos] = useState<PhotoLine[]>([]);
  const [standardLines, setStandardLines] = useState<StandardLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkQty, setBulkQty] = useState(DEFAULT_QTY);
  const [bulkDraft, setBulkDraft] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null);
  const [sheetQty, setSheetQty] = useState('');
  const [initialQuantities, setInitialQuantities] = useState<Record<string, string>>({});

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const submitLeaveBypassRef = useRef(false);
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
      setInitialQuantities(Object.fromEntries(rows.map((product) => [product.id, DEFAULT_QTY])));
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

  const commitBulkDraft = () => {
    const cleaned = bulkDraft.trim().replace(/[^\d]/g, '');
    if (!cleaned || Number(cleaned) < 1) {
      setBulkDraft('');
      return;
    }
    applyQtyToAll(cleaned);
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
            noteVoiceMediaId: noteVoice?.mediaId,
            noteVoiceDurationMs: noteVoice?.durationMs,
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
            noteVoiceMediaId: noteVoice?.mediaId,
            noteVoiceDurationMs: noteVoice?.durationMs,
            items: photos.map((line, index) => ({
              name: `Photo ${index + 1}`,
              quantity: Number(line.quantity) || 1,
              images: [line.imageUrl],
            })),
          };
      return api.post<OrderView & { threadId?: string | null }>('/orders', dto);
    },
    onSuccess: (order) => {
      submitLeaveBypassRef.current = true;
      void navigateToOrderChat(navigate, queryClient, order, { replace: true });
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
    if (photos.length >= MAX_PHOTO_LINES) {
      setError(`You can add up to ${MAX_PHOTO_LINES} photos per order.`);
      return;
    }
    setError(null);
    galleryInputRef.current?.click();
  };

  const openAddPhotos = () => {
    if (photos.length >= MAX_PHOTO_LINES) {
      setError(`You can add up to ${MAX_PHOTO_LINES} photos per order.`);
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
    const incomingList = incoming instanceof FileList ? [...incoming] : [...incoming];
    const remaining = MAX_PHOTO_LINES - photos.length;
    const files = incomingList.slice(0, remaining);
    if (files.length === 0) {
      setError(`You can add up to ${MAX_PHOTO_LINES} photos per order.`);
      return;
    }
    if (incomingList.length > files.length) {
      showToast(
        `Added ${files.length} of ${incomingList.length} — max ${MAX_PHOTO_LINES} photos per order.`,
      );
    }

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
    if (editPhotoId === id) {
      setEditPhotoId(null);
    }
  };

  const openPhotoPieces = (id: string) => {
    const photo = photos.find((item) => item.id === id);
    if (!photo || photo.uploading) return;
    setSheetQty(photo.quantity);
    setEditPhotoId(id);
  };

  const applyPhotoPieces = () => {
    if (!editPhotoId) return;
    const cleaned = sheetQty.trim().replace(/[^\d]/g, '');
    if (!cleaned || Number(cleaned) < 1) return;
    setPhotos((prev) =>
      prev.map((item) =>
        item.id === editPhotoId ? { ...item, quantity: cleaned } : item,
      ),
    );
    setEditPhotoId(null);
  };

  const editPhoto = editPhotoId ? photos.find((item) => item.id === editPhotoId) : null;

  const canSubmit = isStandard
    ? sellerId &&
      standardLines.length > 0 &&
      standardLines.every((line) => Number(line.quantity) > 0)
    : sellerId &&
      photos.length > 0 &&
      photos.every((line) => line.imageUrl && !line.uploading && Number(line.quantity) > 0) &&
      !uploading;

  const discardActive = useMemo(
    () =>
      isStandard
        ? orderBuilderStandardDirty({
            uploading,
            note,
            sellerId,
            sellerFromUrl,
            lines: standardLines,
            initialQuantities,
          })
        : orderBuilderPhotoDirty({
            uploading,
            note,
            photosCount: photos.length,
            sellerId,
          }) || cameraOpen,
    [
      isStandard,
      uploading,
      note,
      sellerId,
      sellerFromUrl,
      standardLines,
      initialQuantities,
      photos.length,
      cameraOpen,
    ],
  );
  const discard = useDiscardGuard(discardActive, submitLeaveBypassRef);

  if (connections.isLoading || (isStandard && collection.isLoading)) {
    return <LoadingBlock label="Loading…" />;
  }

  const sellers = (connections.data ?? []).filter((connection) => connection.status === 'active');
  const atPhotoLimit = photos.length >= MAX_PHOTO_LINES;
  const cameraSlots = Math.min(CAMERA_BATCH, Math.max(0, MAX_PHOTO_LINES - photos.length));

  return (
    <div className="flex flex-col gap-4 pb-4">
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title={isStandard ? 'Order designs' : 'Photo order'}
        onBack={() => discard.tryLeave(() => navigate(-1))}
      />

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
            <button
              type="button"
              onClick={openAddPhotos}
              disabled={uploading}
              className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-foam text-muted hover:border-accent hover:text-accent"
            >
              <CameraIcon width={32} height={32} />
              <span className="text-sm font-semibold text-ink">Add photos</span>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold tracking-tight text-ink">
                  Photos · {photos.length}
                </p>
                {!atPhotoLimit ? (
                  <ListSquareButton
                    aria-label="Add photos"
                    disabled={uploading}
                    onClick={openAddPhotos}
                  >
                    <CameraIcon width={22} height={22} />
                  </ListSquareButton>
                ) : null}
              </div>
              {atPhotoLimit ? (
                <p className="text-xs text-muted">Up to {MAX_PHOTO_LINES} photos per order.</p>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-xl border border-line bg-foam"
                  >
                    <button
                      type="button"
                      onClick={() => openPhotoPieces(photo.id)}
                      disabled={photo.uploading}
                      className="absolute inset-0 disabled:opacity-60"
                      aria-label={`Photo · ${photo.quantity} pieces`}
                    >
                      <img
                        src={photo.previewUrl || photo.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                    {photo.uploading ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                        Uploading…
                      </div>
                    ) : null}
                    <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 text-[10px] font-bold tabular-nums text-white">
                      {photo.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold tracking-tight text-ink">Pieces for all</p>
                <div className="ekum-no-scrollbar flex flex-nowrap items-center gap-1.5 overflow-x-auto">
                  {QTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyQtyToAll(preset)}
                      className={cx(
                        'min-h-11 shrink-0 rounded-xl px-2.5 text-sm font-bold',
                        preset === '1000' ? 'min-w-[3.5rem]' : 'min-w-[3rem]',
                        bulkQty === preset ? 'bg-accent text-white' : 'bg-foam text-slate',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                  <TextInput
                    type="text"
                    inputMode="numeric"
                    placeholder="Custom"
                    className="min-h-11 w-[7rem] min-w-[7rem] shrink-0 px-2 text-sm placeholder:text-xs"
                    value={bulkDraft}
                    onChange={(event) =>
                      setBulkDraft(event.target.value.replace(/[^\d]/g, ''))
                    }
                    onBlur={() => commitBulkDraft()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitBulkDraft();
                        (event.target as HTMLInputElement).blur();
                      }
                    }}
                  />
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

      <NoteVoiceField
        label="Note"
        note={note}
        onNoteChange={setNote}
        voice={noteVoice}
        onVoiceChange={setNoteVoice}
      />

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
        onGallery={() => {
          setCameraOpen(false);
          openGallery();
        }}
        onDone={(files) => {
          setCameraOpen(false);
          void onFiles(files);
        }}
      />

      <Sheet
        open={Boolean(editPhoto)}
        onClose={() => setEditPhotoId(null)}
        title="Pieces for this photo"
        footer={
          editPhoto ? (
            <Button fullWidth onClick={applyPhotoPieces}>
              Done
            </Button>
          ) : null
        }
      >
        {editPhoto ? (
          <div className="flex flex-col gap-3">
            <div className="aspect-square max-w-[8rem] overflow-hidden rounded-xl border border-line bg-foam">
              <img
                src={editPhoto.previewUrl || editPhoto.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {QTY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSheetQty(preset)}
                  className={cx(
                    'min-h-11 min-w-[3.25rem] rounded-xl px-3 text-sm font-bold',
                    sheetQty === preset ? 'bg-accent text-white' : 'bg-foam text-slate',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Field label="Pieces">
              <TextInput
                type="number"
                min={1}
                inputMode="numeric"
                value={sheetQty}
                onChange={(event) => setSheetQty(event.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}