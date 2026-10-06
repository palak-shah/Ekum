import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ComplaintView, CursorPage, MessageView, OrderView } from '@ekum/domain-types';
import {
  complaintOrderHaystack,
  complaintOrderThumb,
  complaintOrderTitle,
  orderWhen,
} from '@/features/chats/complaintOrderCue';
import { api, ApiError } from '@/lib/apiClient';
import { uploadImage } from '@/lib/mediaUpload';
import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';
import { statusLabel } from '@/lib/status';
import { useToast } from '@/ui/Toast';
import {
  Button,
  Field,
  InlineNotice,
  SearchInput,
  Sheet,
  TextArea,
  TextInput,
  cx,
} from '@/ui/kit';

const MAX_PHOTOS = 9;
const QUIET_LINK =
  'self-start text-[15px] font-semibold text-accent disabled:cursor-not-allowed disabled:opacity-45';
/** Stable empty defaults — inline `= []` would re-fire the open reset effect forever. */
const EMPTY_IMAGES: string[] = [];
const EMPTY_SUPPLIER_ALTERNATIVES: Array<{
  companyId: string;
  name: string;
  orderId: string;
}> = [];

function OrderThumb({ order, title }: { order: OrderView; title: string }) {
  const src = complaintOrderThumb(order);
  if (src) {
    return (
      <img
        src={toAbsoluteMediaUrl(src)}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-sm font-bold text-muted">
      {title.charAt(0)}
    </span>
  );
}

export function ChatComplaintSheet({
  open,
  onClose,
  threadId,
  againstCompanyId,
  againstCompanyName = null,
  initialOrderId = null,
  initialSubject = '',
  initialDetail = '',
  initialImages = EMPTY_IMAGES,
  forwardedFromComplaintId = null,
  supplierAlternatives = EMPTY_SUPPLIER_ALTERNATIVES,
  onChangeSupplier,
}: {
  open: boolean;
  onClose: () => void;
  threadId: string;
  againstCompanyId: string;
  againstCompanyName?: string | null;
  initialOrderId?: string | null;
  initialSubject?: string;
  initialDetail?: string;
  initialImages?: string[];
  forwardedFromComplaintId?: string | null;
  /** Other mills on a multi-supplier ticket — Change stays quiet until needed. */
  supplierAlternatives?: Array<{ companyId: string; name: string; orderId: string }>;
  onChangeSupplier?: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const photoRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderPickOpen, setOrderPickOpen] = useState(false);
  const [orderQuery, setOrderQuery] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['orders', { complaintShop: againstCompanyId }],
    queryFn: () => api.get<CursorPage<OrderView>>('/orders', { limit: 40 }),
    enabled: open,
  });
  const shopOrders = useMemo(
    () =>
      (ordersQuery.data?.results ?? []).filter((row) => row.counterpart.id === againstCompanyId),
    [ordersQuery.data?.results, againstCompanyId],
  );
  const selectedOrder = shopOrders.find((row) => row.id === orderId) ?? null;
  const filteredOrders = useMemo(() => {
    const needle = orderQuery.trim().toLowerCase();
    if (!needle) return shopOrders;
    return shopOrders.filter((order) =>
      complaintOrderHaystack(order, statusLabel(order.status), orderWhen(order.createdAt)).includes(
        needle,
      ),
    );
  }, [shopOrders, orderQuery]);

  useEffect(() => {
    if (!open) return;
    setSubject(initialSubject);
    setDetail(initialDetail);
    setOrderId(initialOrderId);
    setImages(initialImages);
    setError(null);
    setUploading(false);
    setOrderPickOpen(false);
    setOrderQuery('');
  }, [open, initialOrderId, initialSubject, initialDetail, initialImages]);

  const addFiles = async (files: File[]) => {
    const room = MAX_PHOTOS - images.length;
    const take = files.slice(0, room);
    if (take.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of take) {
        urls.push(await uploadImage(file));
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add photo.');
    } finally {
      setUploading(false);
    }
  };

  /** Gallery in this tap — never mount ContinuousCamera first (black flash). */
  const openPhotos = () => {
    if (images.length >= MAX_PHOTOS) return;
    photoRef.current?.click();
  };

  const send = useMutation({
    mutationFn: async () => {
      const trimmed = subject.trim();
      if (!trimmed) throw new Error('Say what went wrong.');
      const complaint = await api.post<ComplaintView>('/complaints', {
        againstCompanyId,
        subject: trimmed,
        ...(detail.trim() ? { detail: detail.trim() } : {}),
        ...(orderId ? { orderId } : {}),
        ...(images.length > 0 ? { images } : {}),
        ...(forwardedFromComplaintId
          ? { forwardedFromComplaintId }
          : {}),
      });
      const orderLine = selectedOrder
        ? `${complaintOrderTitle(selectedOrder)} · ${orderWhen(selectedOrder.createdAt)}`
        : null;
      const orderThumbs = selectedOrder
        ? selectedOrder.items
            .flatMap((item) => [item.image, ...(item.images ?? [])].filter(Boolean) as string[])
        : [];
      const thumbs = [...images];
      for (const url of orderThumbs) {
        if (!thumbs.includes(url)) thumbs.push(url);
      }
      const productIds = selectedOrder
        ? selectedOrder.items
            .map((item) => item.productId)
            .filter((id): id is string => Boolean(id?.trim()))
        : [];
      await api.post<MessageView>(`/threads/${threadId}/messages`, {
        type: 'complaint',
        referenceId: complaint.id,
        body: trimmed,
        metadata: {
          ...(detail.trim() ? { detail: detail.trim() } : {}),
          ...(orderLine ? { orderLabel: orderLine } : {}),
          ...(orderId ? { orderId } : {}),
          ...(thumbs.length > 0 ? { images: thumbs } : {}),
          ...(productIds.length > 0 ? { productIds } : {}),
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['thread', threadId, 'messages'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      showToast('Complaint sent');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not send the complaint.');
    },
  });

  const busy = send.isPending || uploading;
  const canSend = subject.trim().length > 0 && !busy;

  return (
    <>
      <Sheet
        open={open}
        onClose={() => {
          if (!busy && !orderPickOpen) onClose();
        }}
        title="Complaint"
        footer={
          <Button
            fullWidth
            disabled={!canSend}
            data-testid="complaint-send"
            onClick={() => send.mutate()}
          >
            {send.isPending ? 'Sending…' : 'Send'}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-8">
          {forwardedFromComplaintId && againstCompanyName ? (
            <div
              className="flex items-center justify-between gap-2 rounded-xl border border-line bg-foam/50 px-3 py-2"
              data-testid="complaint-escalate-supplier"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{againstCompanyName}</p>
                <p className="text-xs text-muted">Supplier · in your shop’s name</p>
              </div>
              {supplierAlternatives.length > 0 && onChangeSupplier ? (
                <button
                  type="button"
                  disabled={busy}
                  data-testid="complaint-change-supplier"
                  className={QUIET_LINK}
                  onClick={onChangeSupplier}
                >
                  Change
                </button>
              ) : null}
            </div>
          ) : null}
          <Field label="What's wrong" required>
            <TextInput
              data-testid="complaint-subject"
              value={subject}
              disabled={busy}
              maxLength={160}
              onChange={(event) => setSubject(event.target.value)}
            />
          </Field>
          <div className="flex flex-col gap-2">
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {images.map((url) => (
                  <div key={url} className="relative h-12 w-12 shrink-0">
                    <img
                      src={toAbsoluteMediaUrl(url)}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      aria-label="Remove photo"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-white"
                      onClick={() => setImages((prev) => prev.filter((item) => item !== url))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {images.length < MAX_PHOTOS ? (
              <button
                type="button"
                disabled={busy}
                data-testid="complaint-add-photos"
                className={QUIET_LINK}
                onClick={openPhotos}
              >
                {uploading ? 'Adding…' : 'Add photos'}
              </button>
            ) : null}
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                const list = event.target.files ? [...event.target.files] : [];
                event.target.value = '';
                void addFiles(list);
              }}
            />
          </div>
          <Field label="More">
            <TextArea
              data-testid="complaint-detail"
              value={detail}
              disabled={busy}
              maxLength={2000}
              placeholder="Qty, dates…"
              className="min-h-[5rem]"
              onChange={(event) => setDetail(event.target.value)}
            />
          </Field>
          {selectedOrder ? (
            <div className="flex items-stretch overflow-hidden rounded-xl border border-accent bg-accent/5">
              <button
                type="button"
                disabled={busy}
                data-testid="complaint-order-chosen"
                onClick={() => {
                  setOrderQuery('');
                  setOrderPickOpen(true);
                }}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
              >
                <OrderThumb order={selectedOrder} title={complaintOrderTitle(selectedOrder)} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {complaintOrderTitle(selectedOrder)}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">
                    {statusLabel(selectedOrder.status)} · {orderWhen(selectedOrder.createdAt)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                aria-label="Remove order"
                className="shrink-0 px-3 text-muted"
                onClick={() => setOrderId(null)}
              >
                ×
              </button>
            </div>
          ) : shopOrders.length > 0 ? (
            <button
              type="button"
              disabled={busy}
              data-testid="complaint-attach-order"
              className={QUIET_LINK}
              onClick={() => {
                setOrderQuery('');
                setOrderPickOpen(true);
              }}
            >
              Attach order
            </button>
          ) : null}
          {error ? <InlineNotice message={error} /> : null}
        </div>
      </Sheet>
      <Sheet
        open={open && orderPickOpen}
        onClose={() => setOrderPickOpen(false)}
        title="Order"
      >
        <div className="flex flex-col gap-2 pb-8">
          {shopOrders.length > 0 ? (
            <SearchInput
              data-testid="complaint-order-search"
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
              placeholder="Find by design…"
              aria-label="Find by design"
            />
          ) : null}
          {filteredOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No shared orders with this shop.</p>
          ) : (
            filteredOrders.map((order) => {
              const selected = orderId === order.id;
              const title = complaintOrderTitle(order);
              return (
                <button
                  key={order.id}
                  type="button"
                  data-testid="complaint-order-row"
                  onClick={() => {
                    setOrderId(order.id);
                    setOrderPickOpen(false);
                  }}
                  className={cx(
                    'flex items-center gap-3 rounded-xl border px-3 py-2 text-left',
                    selected
                      ? 'border-accent bg-accent/5 text-ink'
                      : 'border-line text-ink hover:bg-foam',
                  )}
                >
                  <OrderThumb order={order} title={title} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{title}</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {statusLabel(order.status)} · {orderWhen(order.createdAt)}
                      {order.items.length > 0
                        ? ` · ${order.items.length} design${order.items.length === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Sheet>
    </>
  );
}
