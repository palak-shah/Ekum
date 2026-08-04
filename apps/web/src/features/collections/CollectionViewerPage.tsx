import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccessRequestView,
  CollectionPreviewView,
  ProductView,
  ThreadSummary,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
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
  const [layout, setLayout] = useState<Layout>('feed');
  const [selected, setSelected] = useState<Set<string>>(() => readShortlist(id));
  const [gateOpen, setGateOpen] = useState(false);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  useEffect(() => {
    setSelected(readShortlist(id));
  }, [id]);

  useEffect(() => {
    writeShortlist(id, selected);
  }, [id, selected]);

  const collection = useQuery({
    queryKey: ['collection-preview', id],
    queryFn: () => api.get<CollectionPreviewView>(`/explore/collections/${id}`),
  });
  const outgoing = useQuery({
    queryKey: ['access-requests', 'outgoing'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/outgoing'),
  });

  const products = collection.data?.products ?? [];
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

  const continueOrder = () => {
    if (!collection.data || selectedCount === 0) {
      return;
    }
    const ids = [...selected].join(',');
    navigate(
      `/orders/new?seller=${collection.data.company.id}&collection=${collection.data.id}&products=${ids}`,
    );
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
    <div className={cx('flex flex-col gap-4', selectedCount > 0 && 'pb-20')}>
      <PageHeader
        title={data.name}
        subtitle={`${data.productCount} designs`}
        action={
          data.products ? (
            <button
              type="button"
              aria-label={layout === 'feed' ? 'Grid view' : 'Feed view'}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/5"
              onClick={() => setLayout((prev) => (prev === 'feed' ? 'grid' : 'feed'))}
            >
              {layout === 'feed' ? 'Grid' : 'Feed'}
            </button>
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
              <FeedDesign
                key={product.id}
                product={product}
                selected={selected.has(product.id)}
                selectable={data.connected}
                onToggle={() => data.connected && toggle(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <GridDesign
                key={product.id}
                product={product}
                selected={selected.has(product.id)}
                selectable={data.connected}
                onToggle={() => data.connected && toggle(product.id)}
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

      {selectedCount > 0 && data.connected ? (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          <p className="flex-1 text-sm font-medium text-ink">
            {selectedCount} design{selectedCount === 1 ? '' : 's'} selected
          </p>
          <Button onClick={continueOrder}>Continue</Button>
        </div>
      ) : null}

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

function FeedDesign({
  product,
  selected,
  selectable,
  onToggle,
}: {
  product: ProductView;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  const image = product.images[0] ?? null;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!selectable}
      className={cx(
        'overflow-hidden rounded-2xl border text-left transition-colors',
        selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
        !selectable && 'opacity-95',
      )}
    >
      {image ? (
        <img src={image} alt={product.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-foam text-4xl font-bold text-muted">
          {product.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
          <p className="text-xs text-muted">{formatRate(product.rate, product.unit)}</p>
        </div>
        {selectable ? <SelectMark selected={selected} /> : null}
      </div>
    </button>
  );
}

function GridDesign({
  product,
  selected,
  selectable,
  onToggle,
}: {
  product: ProductView;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  const image = product.images[0] ?? null;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!selectable}
      className={cx(
        'overflow-hidden rounded-2xl border text-left',
        selected ? 'border-accent' : 'border-line',
      )}
    >
      <div className="relative">
        {image ? (
          <img src={image} alt={product.name} className="h-36 w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-foam text-2xl font-bold text-muted">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        {selectable ? (
          <span className="absolute right-2 top-2">
            <SelectMark selected={selected} />
          </span>
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
        <p className="text-xs text-muted">{formatRate(product.rate, product.unit)}</p>
      </div>
    </button>
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
