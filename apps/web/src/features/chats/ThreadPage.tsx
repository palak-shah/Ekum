import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CollectionView,
  CreateProductDto,
  CursorPage,
  MessageReference,
  MessageView,
  ProductView,
  ThreadDetail,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import { Button, ErrorState, LoadingBlock, Sheet, cx } from '@/ui/kit';
import { PlusIcon, SendIcon } from '@/ui/icons';

export function ThreadPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRefs, setSavedRefs] = useState<Set<string>>(() => new Set());

  const thread = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get<ThreadDetail>(`/threads/${id}`),
  });
  const messages = useQuery({
    queryKey: ['thread', id, 'messages'],
    queryFn: () => api.get<CursorPage<MessageView>>(`/threads/${id}/messages`, { limit: 50 }),
    refetchInterval: 15_000,
  });
  const myCollections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: attachOpen,
  });
  const myProducts = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: attachOpen,
  });

  useEffect(() => {
    if (thread.data && thread.data.state === 'active') {
      void api.post(`/threads/${id}/read`, {}).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      });
    }
  }, [thread.data, id, queryClient]);

  const refreshMessages = () => {
    void queryClient.invalidateQueries({ queryKey: ['thread', id, 'messages'] });
    void queryClient.invalidateQueries({ queryKey: ['thread', id] });
  };

  const send = useMutation({
    mutationFn: (payload: { type: string; body?: string; referenceId?: string }) =>
      api.post<MessageView>(`/threads/${id}/messages`, payload),
    onSuccess: () => {
      setDraft('');
      setAttachOpen(false);
      setError(null);
      refreshMessages();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send.'),
  });

  const decide = useMutation({
    mutationFn: (action: 'accept' | 'decline') => api.post(`/threads/${id}/${action}`, {}),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['thread', id] }),
  });

  const acceptQuote = useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/accept-quote`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not accept quote.'),
  });

  const curate = useMutation({
    mutationFn: (reference: MessageReference) => {
      const dto: CreateProductDto = {
        name: (reference.name ?? 'Saved design').trim() || 'Saved design',
        images: reference.image ? [reference.image] : [],
        categories: [],
      };
      return api.post<ProductView>('/products', dto).then((product) => ({ product, reference }));
    },
    onSuccess: ({ reference }) => {
      setSavedRefs((prev) => new Set(prev).add(reference.id));
      void queryClient.invalidateQueries({ queryKey: ['my-products'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not save to your catalogue.'),
  });

  if (thread.isLoading) {
    return <LoadingBlock label="Opening chat…" />;
  }
  if (thread.isError || !thread.data) {
    return (
      <>
        <PageHeader title="Chat" />
        <ErrorState message="This conversation isn't available." />
      </>
    );
  }

  const detail = thread.data;
  const title = detail.title ?? detail.counterpart?.name ?? 'Conversation';
  const ordered = [...(messages.data?.results ?? [])].reverse();
  const canCompose = detail.state === 'active';

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <PageHeader
        title={title}
        subtitle={detail.type === 'group' ? `${detail.participantCount} businesses` : detail.counterpart?.city}
      />

      {detail.state === 'pending' ? (
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">This is a message request. Accept to start chatting.</p>
          <div className="flex gap-2">
            <Button onClick={() => decide.mutate('accept')} disabled={decide.isPending}>
              Accept
            </Button>
            <Button variant="secondary" onClick={() => decide.mutate('decline')} disabled={decide.isPending}>
              Decline
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-2 pb-3">
        {messages.isLoading ? (
          <LoadingBlock />
        ) : ordered.length > 0 ? (
          ordered.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onAcceptQuote={(orderId) => acceptQuote.mutate(orderId)}
              accepting={acceptQuote.isPending}
              onOpenOrder={(orderId) => navigate(`/orders/${orderId}`)}
              onCurate={(reference) => curate.mutate(reference)}
              curating={curate.isPending}
              curated={Boolean(message.reference && savedRefs.has(message.reference.id))}
            />
          ))
        ) : (
          <p className="py-10 text-center text-sm text-muted">No messages yet. Say hello.</p>
        )}
      </div>

      {error ? <p className="mb-2 text-center text-xs text-danger">{error}</p> : null}

      {canCompose ? (
        <form
          className="sticky bottom-20 flex items-center gap-1 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) {
              send.mutate({ type: 'text', body: draft.trim() });
            }
          }}
        >
          <button
            type="button"
            aria-label="Attach"
            onClick={() => setAttachOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-foam"
          >
            <PlusIcon width={20} height={20} />
          </button>
          <input
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-ink shadow-none outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
            placeholder="Message…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || send.isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-40"
          >
            <SendIcon width={18} height={18} />
          </button>
        </form>
      ) : null}

      <Sheet open={attachOpen} onClose={() => setAttachOpen(false)} title="Share in chat">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">My collections</p>
            {myCollections.isLoading ? (
              <LoadingBlock />
            ) : myCollections.data && myCollections.data.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {myCollections.data.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    disabled={send.isPending}
                    onClick={() =>
                      send.mutate({
                        type: 'collection_card',
                        referenceId: collection.id,
                        body: collection.name,
                      })
                    }
                    className="rounded-xl border border-line px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam"
                  >
                    {collection.name}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {collection.productCount} designs
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No collections yet.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">My designs</p>
            {myProducts.isLoading ? (
              <LoadingBlock />
            ) : myProducts.data && myProducts.data.length > 0 ? (
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                {myProducts.data.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={send.isPending}
                    onClick={() =>
                      send.mutate({
                        type: 'product_card',
                        referenceId: product.id,
                        body: product.name,
                      })
                    }
                    className="rounded-xl border border-line px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No designs yet.</p>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function MessageBubble({
  message,
  onAcceptQuote,
  accepting,
  onOpenOrder,
  onCurate,
  curating,
  curated,
}: {
  message: MessageView;
  onAcceptQuote: (orderId: string) => void;
  accepting: boolean;
  onOpenOrder: (orderId: string) => void;
  onCurate: (reference: MessageReference) => void;
  curating: boolean;
  curated: boolean;
}) {
  const ref = message.reference;
  const isCard =
    message.type === 'order_card' ||
    message.type === 'rate' ||
    message.type === 'collection_card' ||
    message.type === 'product_card';

  return (
    <div className={cx('flex', message.mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm',
          isCard
            ? 'border border-line bg-surface text-ink'
            : message.mine
              ? 'bg-accent text-white'
              : 'border border-line bg-surface text-ink',
        )}
      >
        {message.type === 'order_card' && ref ? (
          <OrderCardBody
            reference={ref}
            body={message.body}
            mine={message.mine}
            onOpen={() => ref.available && onOpenOrder(ref.id)}
          />
        ) : null}
        {message.type === 'rate' && ref ? (
          <RateCardBody
            reference={ref}
            body={message.body}
            mine={message.mine}
            onAccept={() => onAcceptQuote(ref.id)}
            accepting={accepting}
            onOpen={() => ref.available && onOpenOrder(ref.id)}
          />
        ) : null}
        {message.type === 'collection_card' && ref ? (
          <ShareCardBody
            label="Collection"
            reference={ref}
            to={ref.available ? `/collections/${ref.id}` : undefined}
          />
        ) : null}
        {message.type === 'product_card' && ref ? (
          <ShareCardBody
            label="Design"
            reference={ref}
            to={ref.available ? `/products/${ref.id}` : undefined}
            onCurate={!message.mine && ref.available ? () => onCurate(ref) : undefined}
            curating={curating}
            curated={curated}
          />
        ) : null}
        {!isCard && message.body ? (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        ) : null}
        <p
          className={cx(
            'mt-0.5 text-right text-[10px]',
            !isCard && message.mine ? 'text-white/70' : 'text-muted',
          )}
        >
          {timeAgo(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function OrderCardBody({
  reference,
  body,
  mine,
  onOpen,
}: {
  reference: NonNullable<MessageView['reference']>;
  body: string | null;
  mine: boolean;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Order request</p>
      <p className="mt-0.5 font-semibold text-ink">{reference.name ?? 'Order'}</p>
      <p className="text-xs text-muted">
        {reference.itemCount ?? 0} item{(reference.itemCount ?? 0) === 1 ? '' : 's'}
        {reference.status ? ` · ${reference.status}` : ''}
      </p>
      {body ? <p className="mt-1 text-xs text-muted">{body}</p> : null}
      {!mine ? <p className="mt-2 text-xs font-medium text-accent">View order</p> : null}
    </button>
  );
}

function RateCardBody({
  reference,
  body,
  mine,
  onAccept,
  accepting,
  onOpen,
}: {
  reference: NonNullable<MessageView['reference']>;
  body: string | null;
  mine: boolean;
  onAccept: () => void;
  accepting: boolean;
  onOpen: () => void;
}) {
  const stillOpen = reference.status === 'requested';
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Quote</p>
        <p className="mt-0.5 font-semibold text-ink">{reference.totalLabel ?? reference.name ?? 'Rate card'}</p>
        <p className="text-xs text-muted">
          {reference.itemCount ?? 0} line{(reference.itemCount ?? 0) === 1 ? '' : 's'}
          {reference.status ? ` · ${reference.status}` : ''}
        </p>
        {body ? <p className="mt-1 text-xs text-muted">{body}</p> : null}
      </button>
      {mine ? (
        <p className="text-xs font-medium text-muted">Quoted</p>
      ) : stillOpen ? (
        <Button fullWidth onClick={onAccept} disabled={accepting}>
          {accepting ? 'Accepting…' : 'Accept quote'}
        </Button>
      ) : (
        <p className="text-xs font-medium text-muted">Accepted</p>
      )}
    </div>
  );
}

function ShareCardBody({
  label,
  reference,
  to,
  onCurate,
  curating,
  curated,
}: {
  label: string;
  reference: NonNullable<MessageView['reference']>;
  to?: string;
  onCurate?: () => void;
  curating?: boolean;
  curated?: boolean;
}) {
  const inner = (
    <>
      {reference.image ? (
        <img src={reference.image} alt="" className="mb-2 h-28 w-full rounded-xl object-cover" />
      ) : null}
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-semibold text-ink">
        {reference.available ? (reference.name ?? label) : 'Unavailable'}
      </p>
    </>
  );
  return (
    <div className="flex flex-col gap-2">
      {to && reference.available ? (
        <Link to={to} className="block">
          {inner}
        </Link>
      ) : (
        <div>{inner}</div>
      )}
      {onCurate ? (
        curated ? (
          <p className="text-xs font-medium text-muted">Saved to catalogue</p>
        ) : (
          <button
            type="button"
            disabled={curating}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onCurate();
            }}
            className="text-left text-xs font-medium text-accent disabled:opacity-50"
          >
            {curating ? 'Saving…' : 'Save to my catalogue'}
          </button>
        )
      ) : null}
    </div>
  );
}
