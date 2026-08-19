import { useEffect, useMemo, useState } from 'react';
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
import {
  DEFAULT_ACCESS_REQUEST_NOTE,
  resolveAccessRequestNote,
} from '@/lib/accessRequestNote';
import { formatRate } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import type { BrowseShortlistEntry } from '@/features/browse/browseShortlist';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { SAVED_QUERY_KEY, useSaveToggle } from '@/features/saved/useSaveToggle';
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
import { useToast } from '@/ui/Toast';
import { useLongPress } from '@/ui/useLongPress';

type Layout = 'feed' | 'grid';

function toShortlistEntry(
  product: ProductView,
  companyName: string,
): BrowseShortlistEntry {
  return {
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.companyId,
    companyName,
    allowForward: product.allowForward,
  };
}

export function CollectionViewerPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useMyCompany();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const [layout, setLayout] = useState<Layout>('grid');
  const [gateOpen, setGateOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [viewerProduct, setViewerProduct] = useState<ProductView | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [note, setNote] = useState(DEFAULT_ACCESS_REQUEST_NOTE);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [curateOpen, setCurateOpen] = useState(false);

  useEffect(() => {
    setQtyOpen(false);
  }, [id]);

  const clearSelection = () => {
    shortlist.clear();
  };

  const collection = useQuery({
    queryKey: ['collection-preview', id],
    queryFn: () => api.get<CollectionPreviewView>(`/explore/collections/${id}`),
  });
  const save = useSaveToggle({ collectionId: id });
  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });

  const products = collection.data?.products ?? [];
  const selectedProducts = useMemo(
    () => products.filter((product) => shortlist.productIds.has(product.id)),
    [products, shortlist.productIds],
  );
  const selectedCount = shortlist.count;
  const selectMode = shortlist.selectMode;
  const companyId = collection.data?.company.id ?? '';
  const isOwner = Boolean(me.data?.id && companyId && me.data.id === companyId);
  /** Order when designs are visible and pack is single-supplier; connection not required for open audiences. */
  const isCuratedPack = useMemo(() => {
    const ownerId = collection.data?.company.id;
    if (!ownerId || products.length === 0) return false;
    return products.some((product) => product.companyId !== ownerId);
  }, [collection.data?.company.id, products]);
  const canOrderFromPack = products.length > 0 && !isCuratedPack && !isOwner;
  const canSelectDesigns = products.length > 0;
  const companyName = collection.data?.company.name ?? '';
  const canCurate =
    shortlist.count > 0 &&
    shortlist.entries.every((entry) => entry.allowForward !== false) &&
    !isOwner;

  const selectAllDesigns = () => {
    shortlist.addMany(products.map((product) => toShortlistEntry(product, companyName)));
  };

  const saveSelected = useMutation({
    mutationFn: async (productIds: string[]) => {
      const results = await Promise.allSettled(
        productIds.map((productId) => api.post('/saved', { productId })),
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      const saved = results.length - failed;
      return { saved, failed, productIds };
    },
    onSuccess: ({ saved, failed, productIds }) => {
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
      if (saved > 0) shortlist.removeIds(productIds);
      if (saved > 0 && failed === 0) {
        showToast(saved === 1 ? 'Saved' : `${saved} designs saved`);
      } else if (saved > 0) {
        showToast(`${saved} saved · ${failed} could not be saved`, 'danger');
      } else {
        showToast('Could not save designs.', 'danger');
      }
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not save designs.', 'danger'),
  });
  const accessPending =
    Boolean(companyId) &&
    (outgoing.data?.some((item) => item.company.id === companyId && item.status === 'pending') ??
      false);

  const requestAccess = useMutation({
    mutationFn: () =>
      api.post<AccessRequestView>('/access-requests', {
        targetCompanyId: companyId,
        note: resolveAccessRequestNote(note),
      }),
    onSuccess: () => {
      setGateOpen(false);
      setNote(DEFAULT_ACCESS_REQUEST_NOTE);
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
    onSuccess: (order, lines) => {
      setQtyOpen(false);
      shortlist.removeIds(lines.map((line) => line.productId));
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
    onSuccess: (order, lines) => {
      setQtyOpen(false);
      shortlist.removeIds(lines.map((line) => line.productId));
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

  const toggleProduct = (product: ProductView) => {
    shortlist.toggle(toShortlistEntry(product, companyName));
  };

  const openViewer = (product: ProductView, index = 0) => {
    setViewerProduct(product);
    setViewerIndex(index);
  };

  const onDesignActivate = (product: ProductView) => {
    if (selectMode) {
      toggleProduct(product);
      return;
    }
    openViewer(product, 0);
  };

  const onDesignLongSelect = (product: ProductView) => {
    shortlist.toggle(toShortlistEntry(product, companyName));
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
    <div
      className={cx(
        'flex flex-col gap-4',
        /* Clear fixed select bar (bottom-20) + bar height above bottom nav. */
        selectedCount > 0 && 'pb-[calc(5rem+5.5rem)]',
      )}
    >
      <PageHeader
        title={data.name}
        subtitle={`${data.productCount} designs`}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5 disabled:opacity-45"
              disabled={!id || save.isPending}
              onClick={() => save.toggle()}
            >
              {save.isSaved ? 'Saved' : 'Save'}
            </button>
            {isOwner ? (
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5"
                onClick={() => navigate(`/catalog/collections/${id}`)}
              >
                Edit
              </button>
            ) : null}
            {canSelectDesigns ? (
              <button
                type="button"
                data-testid="collection-select"
                className={cx(
                  'rounded-full px-3 py-1.5 text-xs font-bold tracking-tight',
                  selectMode ? 'bg-accent text-white' : 'text-accent hover:bg-accent/5',
                )}
                onClick={() => {
                  if (selectMode && selectedCount === 0) {
                    shortlist.setSelectMode(false);
                  } else {
                    shortlist.setSelectMode(true);
                  }
                }}
              >
                {selectMode ? 'Selecting' : 'Select'}
              </button>
            ) : null}
            {data.products ? (
              <button
                type="button"
                aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
                onClick={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
              >
                {layout === 'feed' ? 'Grid' : 'Feed'}
              </button>
            ) : null}
          </div>
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
                selected={shortlist.productIds.has(product.id)}
                selectMode={selectMode}
                onActivate={() => onDesignActivate(product)}
                onLongSelect={() => onDesignLongSelect(product)}
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
                selected={shortlist.productIds.has(product.id)}
                selectMode={selectMode}
                onActivate={() => onDesignActivate(product)}
                onLongSelect={() => onDesignLongSelect(product)}
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
          <Button
            onClick={() => {
              setNote(DEFAULT_ACCESS_REQUEST_NOTE);
              setGateOpen(true);
            }}
          >
            Request access
          </Button>
        </Card>
      )}

      {data.products && isCuratedPack && !isOwner ? (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">Message to order these designs</p>
          <p className="text-xs text-muted">
            This pack mixes designs from more than one business. Chat to place an order.
          </p>
          <Button
            fullWidth
            onClick={() => startChat.mutate()}
            disabled={startChat.isPending}
          >
            {startChat.isPending ? 'Opening…' : 'Open chat'}
          </Button>
        </Card>
      ) : null}

      {!data.products && !isOwner ? (
        accessPending ? (
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Waiting for them</p>
                <p className="text-xs text-muted">
                  Designs unlock after they accept your access request.
                </p>
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
            <p className="text-sm font-semibold text-ink">Ask to see designs and order</p>
            <p className="text-xs text-muted">
              This album is limited to their network. Request access to browse and order.
            </p>
            <Button
              fullWidth
              onClick={() => {
                setNote(DEFAULT_ACCESS_REQUEST_NOTE);
                setGateOpen(true);
              }}
            >
              Request access
            </Button>
          </Card>
        )
      ) : null}

      {successNote ? <p className="text-center text-xs text-accent">{successNote}</p> : null}
      {actionError ? <p className="text-center text-xs text-danger">{actionError}</p> : null}

      {data.products && selectMode ? (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button type="button" className="font-bold text-accent" onClick={selectAllDesigns}>
            Select all
          </button>
          <button type="button" className="font-bold text-accent" onClick={clearSelection}>
            Clear all
          </button>
          <span className="text-muted">
            {selectedCount} design{selectedCount === 1 ? '' : 's'} selected
          </span>
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md flex-col gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm font-bold tracking-tight text-ink">
              {selectedCount} selected
            </p>
            <button
              type="button"
              className="text-xs font-bold text-accent"
              onClick={selectAllDesigns}
            >
              Select all
            </button>
            <button
              type="button"
              className="text-xs font-bold text-muted"
              onClick={clearSelection}
            >
              Clear all
            </button>
            <Button
              variant="secondary"
              disabled={saveSelected.isPending || selectedProducts.length === 0}
              onClick={() => saveSelected.mutate(selectedProducts.map((product) => product.id))}
            >
              {saveSelected.isPending
                ? 'Saving…'
                : selectedProducts.length === 1
                  ? 'Save design'
                  : 'Save designs'}
            </Button>
            {canCurate ? (
              <Button variant="secondary" onClick={() => setCurateOpen(true)}>
                Curate
              </Button>
            ) : null}
            {canOrderFromPack && selectedProducts.length > 0 ? (
              <Button
                onClick={() => {
                  setOrderError(null);
                  setQtyOpen(true);
                }}
              >
                Order
              </Button>
            ) : null}
          </div>
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
        selectable={canSelectDesigns}
        selected={viewerProduct ? shortlist.productIds.has(viewerProduct.id) : false}
        onToggleSelect={() => {
          if (viewerProduct) {
            toggleProduct(viewerProduct);
          }
        }}
      />

      <Sheet
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setNote(DEFAULT_ACCESS_REQUEST_NOTE);
        }}
        title={`Request access · ${data.company.name}`}
      >
        <div className="flex flex-col gap-3">
          <Field
            label="Add a note"
            hint="Tap to write your own. Leave empty to send the default."
            error={actionError}
          >
            <TextArea
              value={note}
              onFocus={() => {
                if (note === DEFAULT_ACCESS_REQUEST_NOTE) setNote('');
              }}
              onChange={(event) => setNote(event.target.value)}
              placeholder={DEFAULT_ACCESS_REQUEST_NOTE}
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
        <ProductSaveButton productId={product.id} />
        {selectable ? (
          <Button variant={selected ? 'secondary' : 'primary'} fullWidth onClick={onToggleSelect}>
            {selected ? 'Selected' : 'Select design'}
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}

function ProductSaveButton({ productId }: { productId: string }) {
  const save = useSaveToggle({ productId });
  return (
    <Button
      variant="secondary"
      fullWidth
      disabled={save.isPending}
      onClick={() => save.toggle()}
    >
      {save.isPending ? 'Updating…' : save.isSaved ? 'Saved' : 'Save'}
    </Button>
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
