import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderIntent,
  OrderKind,
  type AccessRequestView,
  type CollectionPreviewView,
  type OrderView,
  type ProductView,
  type ThreadSummary,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { PageHeader } from '@/ui/PageHeader';
import { CompanyRow } from '@/ui/cards';
import {
  Button,
  Card,
  ErrorState,
  Field,
  LoadingBlock,
  Sheet,
  StatusPill,
  TextArea,
  cx,
} from '@/ui/kit';
import { CheckIcon, LockIcon } from '@/ui/icons';

/** Long-press; swallows the click that usually follows so activate does not fire. */
function useLongPress(onLongPress?: () => void, ms = 420) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return {
    onPointerDown: () => {
      if (!onLongPress) return;
      fired.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        fired.current = true;
        onLongPress();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (event: MouseEvent) => {
      if (!onLongPress) return;
      event.preventDefault();
      fired.current = true;
      onLongPress();
    },
    onClickCapture: (event: MouseEvent) => {
      if (!fired.current) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}

type Layout = 'feed' | 'grid';

function shortlistKey(collectionId: string) {
  return `ekum:shortlist:${collectionId}`;
}

function readShortlist(collectionId: string): Set<string> {
  if (!collectionId || typeof sessionStorage === 'undefined') {
    return new Set();
  }
  try {
    const raw = sessionStorage.getItem(shortlistKey(collectionId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((id) => typeof id === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function writeShortlist(collectionId: string, ids: Set<string>) {
  if (!collectionId || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(shortlistKey(collectionId), JSON.stringify([...ids]));
  } catch {
    // Ignore quota / private-mode failures — shortlist stays in memory.
  }
}

export function CollectionViewerPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [layout, setLayout] = useState<Layout>('grid');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => readShortlist(id));
  const [gateOpen, setGateOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [viewerProduct, setViewerProduct] = useState<ProductView | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(readShortlist(id));
    setSelectMode(false);
    setQtyOpen(false);
  }, [id]);

  useEffect(() => {
    writeShortlist(id, selected);
  }, [id, selected]);

  useEffect(() => {
    if (selected.size > 0 && !selectMode) {
      setSelectMode(true);
    }
  }, [selected.size, selectMode]);

  const collection = useQuery({
    queryKey: ['collection-preview', id],
    queryFn: () => api.get<CollectionPreviewView>(`/explore/collections/${id}`),
  });
  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });

  const products = collection.data?.products ?? [];
  const selectedProducts = useMemo(
    () => products.filter((product) => selected.has(product.id)),
    [products, selected],
  );
  const selectedCount = selected.size;
  const companyId = collection.data?.company.id ?? '';
  const accessPending =
    Boolean(companyId) &&
    (outgoing.data?.some((item) => item.company.id === companyId && item.status === 'pending') ??
      false);

  const requestAccess = useMutation({
    mutationFn: () =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: companyId,
        note: note || undefined,
      }),
    onSuccess: () => {
      setGateOpen(false);
      setNote('');
      setActionError(null);
      setSuccessNote('Request sent — they will see it in chat.');
      void queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not send request.'),
  });

  const startChat = useMutation({
    mutationFn: () => api.post<ThreadSummary>('/threads/direct', { companyId }),
    onSuccess: (thread) => navigate(`/chats/${thread.id}`),
    onError: (error) =>
      setActionError(error instanceof ApiError ? error.message : 'Could not open chat.'),
  });

  const createOrder = useMutation({
    mutationFn: (lines: Array<{ productId: string; quantity: number }>) =>
      api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId: companyId,
        kind: OrderKind.Standard,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
        })),
      }),
    onSuccess: (order) => {
      setQtyOpen(false);
      const empty = new Set<string>();
      writeShortlist(id, empty);
      setSelected(empty);
      setSelectMode(false);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (order.threadId) {
        navigate(`/chats/${order.threadId}`, { replace: true });
      } else {
        navigate(`/orders/${order.id}`, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not place the order.'),
  });

  const askRates = useMutation({
    mutationFn: (lines: Array<{ productId: string; quantity: number }>) =>
      api.post<OrderView & { threadId?: string | null }>('/orders', {
        sellerCompanyId: companyId,
        kind: OrderKind.Standard,
        intent: OrderIntent.Inquiry,
        note: collection.data?.name
          ? `Rates for designs from ${collection.data.name}`
          : undefined,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          images: [],
        })),
      }),
    onSuccess: (order) => {
      setQtyOpen(false);
      const empty = new Set<string>();
      writeShortlist(id, empty);
      setSelected(empty);
      setSelectMode(false);
      setOrderError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (order.threadId) {
        navigate(`/chats/${order.threadId}`, { replace: true });
      } else {
        navigate(`/orders/${order.id}`, { replace: true });
      }
    },
    onError: (error) =>
      setOrderError(error instanceof ApiError ? error.message : 'Could not ask for rates.'),
  });

  const toggle = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const openViewer = (product: ProductView, index = 0) => {
    setViewerProduct(product);
    setViewerIndex(index);
  };

  const onDesignActivate = (product: ProductView) => {
    if (collection.data?.connected && selectMode) {
      toggle(product.id);
      return;
    }
    openViewer(product, 0);
  };

  const onDesignLongSelect = (productId: string) => {
    setSelectMode(true);
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  };

  if (collection.isLoading) {
    return <LoadingBlock label="Loading collection…" />;
  }
  if (collection.isError || !collection.data) {
    return (
      <>
        <PageHeader title="Collection" />
        <ErrorState message="This collection isn't available." />
      </>
    );
  }

  const data = collection.data;

  return (
    <div className={cx('flex flex-col gap-4', selectedCount > 0 && 'pb-24')}>
      <PageHeader
        title={data.name}
        subtitle={`${data.productCount} designs`}
        action={
          data.products ? (
            <div className="flex items-center gap-1">
              {data.connected ? (
                <button
                  type="button"
                  className={cx(
                    'rounded-full px-3 py-1.5 text-xs font-bold tracking-tight',
                    selectMode ? 'bg-accent text-white' : 'text-accent hover:bg-accent/5',
                  )}
                  onClick={() => {
                    if (selectMode && selectedCount === 0) {
                      setSelectMode(false);
                    } else {
                      setSelectMode(true);
                    }
                  }}
                >
                  {selectMode ? 'Selecting' : 'Select'}
                </button>
              ) : null}
              <button
                type="button"
                aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
                onClick={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
              >
                {layout === 'feed' ? 'Grid' : 'Feed'}
              </button>
            </div>
          ) : null
        }
      />

      {data.coverImage && layout === 'feed' ? (
        <img src={data.coverImage} alt={data.name} className="h-44 w-full rounded-2xl object-cover" />
      ) : null}

      <CompanyRow company={data.company} to={`/company/${data.company.id}`} />

      {data.products ? (
        layout === 'feed' ? (
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <DesignTile
                key={product.id}
                variant="feed"
                product={product}
                selected={selected.has(product.id)}
                selectMode={selectMode && data.connected}
                onActivate={() => onDesignActivate(product)}
                onLongSelect={
                  data.connected ? () => onDesignLongSelect(product.id) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <DesignTile
                key={product.id}
                variant="grid"
                product={product}
                selected={selected.has(product.id)}
                selectMode={selectMode && data.connected}
                onActivate={() => onDesignActivate(product)}
                onLongSelect={
                  data.connected ? () => onDesignLongSelect(product.id) : undefined
                }
              />
            ))}
          </div>
        )
      ) : accessPending ? (
        <AccessPendingCard
          companyName={data.company.name}
          onOpenChat={() => startChat.mutate()}
          opening={startChat.isPending}
        />
      ) : (
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
            <LockIcon />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Ask to see designs and rates</p>
            <p className="text-xs text-muted">
              Request access from {data.company.name} to see all {data.productCount} designs.
            </p>
          </div>
          <Button onClick={() => setGateOpen(true)}>Request access</Button>
        </Card>
      )}

      {data.products && !data.connected ? (
        accessPending ? (
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Waiting for them</p>
                <p className="text-xs text-muted">You can browse; ordering unlocks after they accept.</p>
              </div>
              <StatusPill status="pending" />
            </div>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => startChat.mutate()}
              disabled={startChat.isPending}
            >
              {startChat.isPending ? 'Opening…' : 'Open chat'}
            </Button>
          </Card>
        ) : (
          <Card className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">Ask to order</p>
            <p className="text-xs text-muted">You can browse designs; request access to place an order.</p>
            <Button fullWidth onClick={() => setGateOpen(true)}>
              Request access
            </Button>
          </Card>
        )
      ) : null}

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      {data.products && data.connected && selectMode ? (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            className="font-bold text-accent"
            onClick={() => setSelected(new Set(products.map((product) => product.id)))}
          >
            Select all
          </button>
          <button
            type="button"
            className="font-bold text-accent"
            onClick={() => {
              setSelected(new Set());
              setSelectMode(false);
            }}
          >
            Clear
          </button>
          <span className="text-muted">
            {selectedCount} design{selectedCount === 1 ? '' : 's'} selected
          </span>
        </div>
      ) : null}

      {selectedCount > 0 && data.connected ? (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          <p className="flex-1 text-sm font-bold tracking-tight text-ink">
            {selectedCount} selected
          </p>
          <Button
            onClick={() => {
              setOrderError(null);
              setQtyOpen(true);
            }}
          >
            Order
          </Button>
        </div>
      ) : null}

      <HowManyEachSheet
        open={qtyOpen}
        onClose={() => setQtyOpen(false)}
        sellerId={companyId}
        products={selectedProducts}
        submitting={createOrder.isPending}
        asking={askRates.isPending}
        error={orderError}
        onSendOrder={(lines) => {
          setOrderError(null);
          createOrder.mutate(lines);
        }}
        onAskRates={(lines) => {
          setOrderError(null);
          askRates.mutate(lines);
        }}
      />

      <ProductPhotosSheet
        product={viewerProduct}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerProduct(null)}
        selectable={Boolean(data.connected)}
        selected={viewerProduct ? selected.has(viewerProduct.id) : false}
        onToggleSelect={() => {
          if (viewerProduct && data.connected) {
            setSelectMode(true);
            toggle(viewerProduct.id);
          }
        }}
      />

      <Sheet
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        title={`Request access · ${data.company.name}`}
      >
        <div className="flex flex-col gap-3">
          <Field
            label="Add a note"
            hint="Introduce your business and what you're looking for."
            error={actionError}
          >
            <TextArea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Hi, we run a retail store in Jaipur…"
            />
          </Field>
          <Button fullWidth onClick={() => requestAccess.mutate()} disabled={requestAccess.isPending}>
            {requestAccess.isPending ? 'Sending…' : 'Send request'}
          </Button>
          <Link to={`/company/${data.company.id}`} className="text-center text-xs font-medium text-accent">
            View business
          </Link>
        </div>
      </Sheet>
    </div>
  );
}

function AccessPendingCard({
  companyName,
  onOpenChat,
  opening,
}: {
  companyName: string;
  onOpenChat: () => void;
  opening: boolean;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
        <LockIcon />
      </span>
      <div>
        <div className="mb-1 flex items-center justify-center gap-2">
          <p className="text-sm font-semibold text-ink">Waiting for them</p>
          <StatusPill status="pending" />
        </div>
        <p className="text-xs text-muted">
          Access requested from {companyName}. Designs unlock after they approve.
        </p>
      </div>
      <Button onClick={onOpenChat} disabled={opening}>
        {opening ? 'Opening…' : 'Open chat'}
      </Button>
    </Card>
  );
}

function DesignTile({
  product,
  selected,
  selectMode,
  variant,
  onActivate,
  onLongSelect,
}: {
  product: ProductView;
  selected: boolean;
  selectMode: boolean;
  variant: 'feed' | 'grid';
  onActivate: () => void;
  onLongSelect?: () => void;
}) {
  const image = product.images[0] ?? null;
  const extraPhotos = Math.max(0, product.images.length - 1);
  const meta = [product.sku, formatRate(product.rate, product.unit)].filter(Boolean).join(' · ');
  const longPress = useLongPress(onLongSelect);

  return (
    <div
      className={cx(
        'overflow-hidden rounded-2xl border text-left',
        selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
      )}
    >
      <button
        type="button"
        onClick={onActivate}
        className="relative block w-full"
        {...longPress}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className={cx(
              'w-full object-cover',
              variant === 'feed' ? 'aspect-[3/4]' : 'h-36',
            )}
            loading="lazy"
          />
        ) : (
          <div
            className={cx(
              'flex w-full items-center justify-center bg-foam font-bold text-muted',
              variant === 'feed' ? 'aspect-[3/4] text-4xl' : 'h-36 text-2xl',
            )}
          >
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        {extraPhotos > 0 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">
            +{extraPhotos}
          </span>
        ) : null}
        {selectMode ? (
          <span className="absolute right-2 top-2">
            <SelectMark selected={selected} />
          </span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={onActivate}
        className={cx('block w-full text-left', variant === 'feed' ? 'p-3' : 'p-2.5')}
        {...longPress}
      >
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
      </button>
    </div>
  );
}

function ProductPhotosSheet({
  product,
  index,
  onIndex,
  onClose,
  selectable,
  selected,
  onToggleSelect,
}: {
  product: ProductView | null;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  if (!product) return null;
  const urls = product.images;
  const safeIndex = urls.length > 0 ? Math.min(index, urls.length - 1) : 0;
  const current = urls[safeIndex] ?? null;

  return (
    <Sheet open={Boolean(product)} onClose={onClose} title={product.name}>
      <div className="flex flex-col gap-3">
        {product.sku ? <p className="text-xs font-medium text-muted">SKU {product.sku}</p> : null}
        {current ? (
          <img
            src={current}
            alt=""
            className="max-h-[50vh] w-full rounded-2xl object-contain bg-foam"
          />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-foam text-muted">
            No photos
          </div>
        )}
        {urls.length > 1 ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              disabled={safeIndex <= 0}
              onClick={() => onIndex(safeIndex - 1)}
            >
              Prev
            </Button>
            <p className="text-xs font-medium text-muted">
              {safeIndex + 1} / {urls.length}
            </p>
            <Button
              variant="ghost"
              disabled={safeIndex >= urls.length - 1}
              onClick={() => onIndex(safeIndex + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
        <p className="text-sm font-semibold text-ink">{formatRate(product.rate, product.unit)}</p>
        {product.moq != null && product.moq > 0 ? (
          <p className="text-sm font-medium text-ink">Minimum order · {product.moq} pcs</p>
        ) : null}
        {product.description?.trim() ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-ink">{product.description.trim()}</p>
          </div>
        ) : null}
        {selectable ? (
          <Button variant={selected ? 'secondary' : 'primary'} fullWidth onClick={onToggleSelect}>
            {selected ? 'Selected' : 'Select design'}
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function SelectMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={cx(
        'flex h-6 w-6 items-center justify-center rounded-full border',
        selected ? 'border-accent bg-accent text-white' : 'border-line bg-white/90 text-transparent',
      )}
    >
      <CheckIcon width={14} height={14} />
    </span>
  );
}
