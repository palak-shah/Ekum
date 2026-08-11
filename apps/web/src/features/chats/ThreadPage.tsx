import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CollectionView,
  CreateProductDto,
  CursorPage,
  MessageReference,
  MessageView,
  OrderView,
  ProductView,
  ThreadDetail,
  ThreadSummary,
} from '@ekum/domain-types';
import { photoUrlsFromMessage } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { uploadImage } from '@/lib/mediaUpload';
import { statusLabel } from '@/lib/status';
import { PageHeader } from '@/ui/PageHeader';
import { Avatar, Button, ErrorState, LoadingBlock, Sheet, cx } from '@/ui/kit';
import {
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  CollectionIcon,
  OrdersIcon,
  PinIcon,
  PlusIcon,
  ProductIcon,
  SendIcon,
} from '@/ui/icons';
import {
  canForwardMessage,
  canReplyToMessage,
  forwardPayload,
  replyComposerLabel,
} from './chatMessageActions';
import { buildOrderCardCopy } from './orderCardCopy';
import { chatTypeMeta } from './messagePreview';
import { PhotoAlbum } from './PhotoAlbum';

type AttachStep =
  | 'menu'
  | 'product'
  | 'collection'
  | 'order'
  | 'photo';

export function ThreadPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachStep, setAttachStep] = useState<AttachStep>('menu');
  const [error, setError] = useState<string | null>(null);
  const [savedRefs, setSavedRefs] = useState<Set<string>>(() => new Set());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [forwardQueue, setForwardQueue] = useState<MessageView[]>([]);
  const [forwardDoneTo, setForwardDoneTo] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageView | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [forwardProgress, setForwardProgress] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);

  const thread = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get<ThreadDetail>(`/threads/${id}`),
  });
  const messages = useQuery({
    queryKey: ['thread', id, 'messages'],
    queryFn: () => api.get<CursorPage<MessageView>>(`/threads/${id}/messages`, { limit: 80 }),
    staleTime: 0,
    refetchInterval: 2_000,
    refetchOnWindowFocus: true,
  });
  const myCollections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: attachOpen && attachStep === 'collection',
  });
  const myProducts = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: attachOpen && attachStep === 'product',
  });
  const myOrders = useQuery({
    queryKey: ['orders', { chatAttach: true, counterpart: thread.data?.counterpart?.id }],
    queryFn: () => api.get<CursorPage<OrderView>>('/orders', { limit: 40 }),
    enabled: attachOpen && attachStep === 'order',
  });
  const forwardThreads = useQuery({
    queryKey: ['threads', { forwardPicker: true }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', { limit: 40, state: 'active' }),
    enabled: forwardQueue.length > 0,
  });

  useEffect(() => {
    if (thread.data && thread.data.state === 'active') {
      void api.post(`/threads/${id}/read`, {}).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
        void queryClient.invalidateQueries({ queryKey: ['threads'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      });
    }
  }, [thread.data, id, queryClient]);

  const ordered = [...(messages.data?.results ?? [])].reverse();

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [ordered.length, id]);

  const refreshMessages = () => {
    void queryClient.invalidateQueries({ queryKey: ['thread', id, 'messages'] });
    void queryClient.invalidateQueries({ queryKey: ['thread', id] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
    void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
  };

  const insertMessage = (message: MessageView) => {
    queryClient.setQueryData<CursorPage<MessageView>>(['thread', id, 'messages'], (prev) => {
      if (!prev) {
        return { results: [message], nextCursor: null };
      }
      if (prev.results.some((row) => row.id === message.id)) {
        return prev;
      }
      return { ...prev, results: [message, ...prev.results] };
    });
  };

  const send = useMutation({
    mutationFn: (payload: {
      type: string;
      body?: string;
      referenceId?: string;
      metadata?: Record<string, unknown>;
      replyToMessageId?: string;
    }) => api.post<MessageView>(`/threads/${id}/messages`, payload),
    onSuccess: (message) => {
      insertMessage(message);
      setDraft('');
      setReplyTo(null);
      setAttachOpen(false);
      setAttachStep('menu');
      setError(null);
      refreshMessages();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not send.'),
  });

  const decide = useMutation({
    mutationFn: (action: 'accept' | 'decline') => api.post(`/threads/${id}/${action}`, {}),
    onSuccess: (_data, action) => {
      void queryClient.invalidateQueries({ queryKey: ['thread', id] });
      void queryClient.invalidateQueries({ queryKey: ['thread', id, 'messages'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (action === 'decline') {
        navigate('/chats');
      }
    },
  });

  const acceptQuote = useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/accept-quote`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not accept quote.'),
  });

  const pinThread = useMutation({
    mutationFn: (pinned: boolean) => api.patch<ThreadDetail>(`/threads/${id}/pin`, { pinned }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['thread', id] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update pin.'),
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

  const forward = useMutation({
    mutationFn: async (threadId: string) => {
      if (forwardQueue.length === 0) {
        throw new Error('Nothing to forward');
      }
      for (let i = 0; i < forwardQueue.length; i += 1) {
        const message = forwardQueue[i];
        if (!message) continue;
        setForwardProgress(`Forwarding ${i + 1}/${forwardQueue.length}…`);
        await api.post<MessageView>(`/threads/${threadId}/messages`, forwardPayload(message));
      }
      return { threadId };
    },
    onSuccess: ({ threadId }) => {
      const title =
        forwardThreads.data?.results.find((row) => row.id === threadId)?.title ??
        forwardThreads.data?.results.find((row) => row.id === threadId)?.counterpart?.name ??
        'chat';
      setForwardQueue([]);
      setSelecting(false);
      setSelectedIds(new Set());
      setForwardProgress(null);
      setForwardDoneTo(title);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      window.setTimeout(() => setForwardDoneTo(null), 2500);
    },
    onError: (err) => {
      setForwardProgress(null);
      setError(err instanceof ApiError ? err.message : 'Could not forward.');
    },
  });

  const openAttach = () => {
    setAttachStep('menu');
    setAttachOpen(true);
  };

  const startReply = (message: MessageView) => {
    setReplyTo(message);
    queueMicrotask(() => draftInputRef.current?.focus());
  };

  const jumpToMessage = (messageId: string) => {
    const root = listRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!target) {
      setError('That message is not loaded in this chat view.');
      return;
    }
    setError(null);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlightTimer.current != null) {
      window.clearTimeout(highlightTimer.current);
    }
    setHighlightId(messageId);
    highlightTimer.current = window.setTimeout(() => {
      setHighlightId(null);
      highlightTimer.current = null;
    }, 1600);
  };

  const startForwardOne = (message: MessageView) => {
    setForwardQueue([message]);
  };

  const startSelect = (message: MessageView) => {
    setSelecting(true);
    setSelectedIds(new Set([message.id]));
  };

  const toggleSelected = (messageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const openMultiForward = () => {
    const queue = ordered.filter((message) => selectedIds.has(message.id) && canForwardMessage(message));
    if (queue.length === 0) return;
    setForwardQueue(queue);
  };

  const onPhotoPicked = async (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!file) continue;
        setUploadProgress(`Uploading ${i + 1}/${files.length}…`);
        urls.push(await uploadImage(file));
      }
      const first = urls[0];
      if (!first) return;
      setUploadProgress('Sending…');
      await send.mutateAsync({
        type: 'photo',
        body: first,
        metadata: { urls },
        replyToMessageId: replyTo?.id,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(null);
      if (photoRef.current) photoRef.current.value = '';
    }
  };

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
  const canCompose = detail.state === 'active';
  const counterpartId = detail.counterpart?.id;
  const headerSubtitle =
    detail.type === 'group'
      ? `${detail.participantCount} businesses`
      : detail.counterpart?.city || undefined;

  const attachTitle =
    attachStep === 'menu'
      ? 'Share in chat'
      : attachStep === 'product'
        ? 'Share a design'
        : attachStep === 'collection'
          ? 'Share a collection'
          : attachStep === 'order'
            ? 'Share an order'
            : 'Share a photo';

  const counterpartOrders = (myOrders.data?.results ?? []).filter((order) =>
    counterpartId ? order.counterpart.id === counterpartId : true,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
      <PageHeader
        title={title}
        subtitle={headerSubtitle || undefined}
        titleTo={counterpartId ? `/company/${counterpartId}` : undefined}
        onBack={() => navigate('/chats')}
        action={
          <button
            type="button"
            aria-label={detail.pinned ? 'Unpin chat' : 'Pin chat'}
            disabled={pinThread.isPending}
            onClick={() => pinThread.mutate(!detail.pinned)}
            className={cx(
              'rounded-full p-2',
              detail.pinned ? 'text-accent' : 'text-muted hover:bg-foam hover:text-ink',
            )}
          >
            <PinIcon width={20} height={20} />
          </button>
        }
      />

      {detail.state === 'pending' ? (
        <div className="mt-0 flex shrink-0 flex-col gap-3 rounded-2xl border border-warning-soft bg-warning-soft p-3.5">
          <p className="text-sm font-medium text-warning-ink">
            They can’t see your replies until you open this chat.
          </p>
          <div className="flex gap-2">
            <Button fullWidth onClick={() => decide.mutate('accept')} disabled={decide.isPending}>
              Open chat
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => decide.mutate('decline')}
              disabled={decide.isPending}
            >
              Ignore
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={listRef}
        className={cx(
          'ekum-no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain',
          canCompose ? 'pb-3' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]',
        )}
      >
        {messages.isLoading ? (
          <LoadingBlock />
        ) : messages.isError ? (
          <p className="py-10 text-center text-sm text-danger">
            Could not load messages.{' '}
            <button
              type="button"
              className="font-semibold text-accent underline"
              onClick={() => void messages.refetch()}
            >
              Retry
            </button>
          </p>
        ) : ordered.length > 0 ? (
          <>
            {ordered.map((message) => (
              <TimelineItem
                key={message.id}
                message={message}
                senderLabel={
                  message.mine
                    ? 'You'
                    : (detail.participants.find((row) => row.companyId === message.senderCompanyId)
                        ?.company.name ??
                      detail.counterpart?.name ??
                      'Business')
                }
                onAcceptQuote={(orderId) => acceptQuote.mutate(orderId)}
                accepting={acceptQuote.isPending}
                onOpenOrder={(orderId) => navigate(`/orders/${orderId}`)}
                onCurate={(reference) => curate.mutate(reference)}
                curating={curate.isPending}
                curated={Boolean(message.reference && savedRefs.has(message.reference.id))}
                selecting={selecting}
                selected={selectedIds.has(message.id)}
                highlighted={highlightId === message.id}
                onJumpToReply={
                  message.replyTo?.available !== false && message.replyTo?.id
                    ? () => jumpToMessage(message.replyTo!.id)
                    : undefined
                }
                onToggleSelect={
                  selecting && canForwardMessage(message)
                    ? () => toggleSelected(message.id)
                    : undefined
                }
                actions={
                  canCompose && !selecting
                    ? {
                        onReply: canReplyToMessage(message)
                          ? () => startReply(message)
                          : undefined,
                        onForward: canForwardMessage(message)
                          ? () => startForwardOne(message)
                          : undefined,
                        onSelect: canForwardMessage(message)
                          ? () => startSelect(message)
                          : undefined,
                      }
                    : undefined
                }
              />
            ))}
            <div ref={bottomRef} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted">No messages yet. Say hello.</p>
        )}
      </div>

      {error ? (
        <p className="shrink-0 px-1 pb-1 text-center text-xs text-danger">{error}</p>
      ) : null}
      {uploadProgress ? (
        <p className="shrink-0 px-1 pb-1 text-center text-xs text-muted">{uploadProgress}</p>
      ) : null}
      {forwardDoneTo ? (
        <p className="shrink-0 px-1 pb-1 text-center text-xs text-success-ink">
          Forwarded to {forwardDoneTo}
        </p>
      ) : null}
      {forwardProgress ? (
        <p className="shrink-0 px-1 pb-1 text-center text-xs text-muted">{forwardProgress}</p>
      ) : null}

      {selecting ? (
        <div className="mb-[calc(4.25rem+env(safe-area-inset-bottom))] flex shrink-0 items-center gap-3 border-t border-line bg-surface px-1 py-2.5">
          <button
            type="button"
            className="text-sm font-semibold text-muted"
            onClick={() => {
              setSelecting(false);
              setSelectedIds(new Set());
            }}
          >
            Cancel
          </button>
          <span className="flex-1 text-center text-sm font-medium text-ink">
            {selectedIds.size} selected
          </span>
          <Button
            disabled={selectedIds.size === 0 || forward.isPending}
            onClick={openMultiForward}
          >
            Forward
          </Button>
        </div>
      ) : null}

      {canCompose && !selecting ? (
        <form
          className="flex shrink-0 flex-col gap-1.5 border-t border-line/70 bg-canvas px-0 py-2 mb-[calc(4.25rem+env(safe-area-inset-bottom))]"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim() && !send.isPending) {
              send.mutate({
                type: 'text',
                body: draft.trim(),
                replyToMessageId: replyTo?.id,
              });
            }
          }}
        >
          {replyTo ? (
            <div className="flex items-start gap-2 rounded-xl bg-foam px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-accent">Replying to</p>
                <p className="truncate text-sm text-ink">{replyComposerLabel(replyTo)}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-muted"
                onClick={() => setReplyTo(null)}
              >
                Clear
              </button>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-surface px-2 py-1.5">
            <button
              type="button"
              aria-label="Attach"
              onClick={openAttach}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent hover:bg-foam"
            >
              <PlusIcon width={20} height={20} />
            </button>
            <input
              data-testid="chat-composer"
              ref={draftInputRef}
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-ink shadow-none outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
              placeholder="Message…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="submit"
              aria-label="Send"
              data-testid="chat-send"
              disabled={!draft.trim() || send.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40"
            >
              <SendIcon width={18} height={18} />
            </button>
          </div>
        </form>
      ) : null}

      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => void onPhotoPicked(e.target.files)}
      />

      <Sheet
        open={attachOpen}
        onClose={() => {
          setAttachOpen(false);
          setAttachStep('menu');
        }}
        title={attachTitle}
      >
        {attachStep === 'menu' ? (
          <div className="flex flex-col gap-1">
            {(
              [
                {
                  step: 'product' as const,
                  label: 'Design',
                  subtitle: 'Share a design',
                  Icon: ProductIcon,
                  iconClass: 'bg-foam text-accent',
                },
                {
                  step: 'collection' as const,
                  label: 'Collection',
                  subtitle: 'Share a collection',
                  Icon: CollectionIcon,
                  iconClass: 'bg-linen text-slate',
                },
                {
                  step: 'photo' as const,
                  label: 'Photos',
                  subtitle: 'Send photos',
                  Icon: CameraIcon,
                  iconClass: 'bg-warning-soft text-warning-ink',
                },
                {
                  step: 'order' as const,
                  label: 'Order',
                  subtitle: 'Share an order',
                  Icon: OrdersIcon,
                  iconClass: 'bg-ink/5 text-ink',
                },
              ] as const
            ).map(({ step, label, subtitle, Icon, iconClass }) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (step === 'photo') {
                    setAttachOpen(false);
                    queueMicrotask(() => photoRef.current?.click());
                    return;
                  }
                  setAttachStep(step);
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-foam/70 active:bg-foam"
              >
                <span
                  className={cx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    iconClass,
                  )}
                >
                  <Icon width={18} height={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight text-ink">{label}</span>
                  <span className="block text-sm leading-tight text-muted">{subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {attachStep === 'product' ? (
          <AttachList
            loading={myProducts.isPending || myProducts.isFetching}
            empty="No designs yet."
            isEmpty={(myProducts.data ?? []).length === 0}
            onBack={() => setAttachStep('menu')}
          >
            {(myProducts.data ?? []).map((product) => (
              <button
                key={product.id}
                type="button"
                disabled={send.isPending}
                onClick={() =>
                  send.mutate({
                    type: 'product_card',
                    referenceId: product.id,
                    body: product.name,
                    replyToMessageId: replyTo?.id,
                  })
                }
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left hover:bg-foam"
              >
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foam text-accent">
                    <ProductIcon width={20} height={20} />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {product.name}
                </span>
              </button>
            ))}
          </AttachList>
        ) : null}

        {attachStep === 'collection' ? (
          <AttachList
            loading={myCollections.isPending || myCollections.isFetching}
            empty="No collections yet."
            isEmpty={(myCollections.data ?? []).length === 0}
            onBack={() => setAttachStep('menu')}
          >
            {(myCollections.data ?? []).map((collection) => (
              <button
                key={collection.id}
                type="button"
                disabled={send.isPending}
                onClick={() =>
                  send.mutate({
                    type: 'collection_card',
                    referenceId: collection.id,
                    body: collection.name,
                    replyToMessageId: replyTo?.id,
                  })
                }
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left hover:bg-foam"
              >
                {collection.coverImage ? (
                  <img
                    src={collection.coverImage}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linen text-slate">
                    <CollectionIcon width={20} height={20} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {collection.name}
                  </span>
                  <span className="block text-sm text-muted">
                    {collection.productCount} design{collection.productCount === 1 ? '' : 's'}
                  </span>
                </span>
              </button>
            ))}
          </AttachList>
        ) : null}

        {attachStep === 'order' ? (
          <AttachList
            loading={myOrders.isPending || myOrders.isFetching}
            empty={
              counterpartId
                ? 'No shared orders with this business yet.'
                : 'No orders to share yet.'
            }
            isEmpty={counterpartOrders.length === 0}
            onBack={() => setAttachStep('menu')}
          >
            {counterpartOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                disabled={send.isPending}
                onClick={() =>
                  send.mutate({
                    type: 'order_card',
                    referenceId: order.id,
                    body: order.counterpart.name,
                    replyToMessageId: replyTo?.id,
                  })
                }
                className="rounded-xl border border-line px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam"
              >
                <span className="font-semibold">
                  Order #{order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-muted">
                  {order.counterpart.name} · {statusLabel(order.status)} · {order.items.length}{' '}
                  item{order.items.length === 1 ? '' : 's'}
                </span>
              </button>
            ))}
          </AttachList>
        ) : null}

        {uploadingPhoto || send.isPending ? (
          <p className="mt-3 text-center text-xs text-muted">
            {uploadProgress ?? (uploadingPhoto ? 'Uploading…' : 'Sending…')}
          </p>
        ) : null}
      </Sheet>

      <Sheet
        open={forwardQueue.length > 0}
        onClose={() => {
          if (!forward.isPending) setForwardQueue([]);
        }}
        title={forwardQueue.length > 1 ? `Forward ${forwardQueue.length}…` : 'Forward to…'}
      >
        {forwardThreads.isLoading ? (
          <LoadingBlock />
        ) : (
          <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
            {(forwardThreads.data?.results ?? [])
              .filter((row) => row.id !== id)
              .map((row) => {
                const chatTitle = row.title ?? row.counterpart?.name ?? 'Conversation';
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={forward.isPending}
                    onClick={() => forward.mutate(row.id)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-foam active:bg-foam disabled:opacity-50"
                  >
                    <Avatar name={chatTitle} imageUrl={row.counterpart?.logoUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {chatTitle}
                      </span>
                      {row.counterpart?.city ? (
                        <span className="block truncate text-[11px] text-muted">
                          {row.counterpart.city}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            {(forwardThreads.data?.results ?? []).filter((row) => row.id !== id).length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted">No other chats to forward to yet.</p>
            ) : null}
          </div>
        )}
        {forward.isPending ? (
          <p className="mt-2 text-center text-xs text-muted">
            {forwardProgress ?? 'Forwarding…'}
          </p>
        ) : null}
      </Sheet>
    </div>
  );
}

function AttachList({
  loading,
  empty,
  onBack,
  children,
  isEmpty,
}: {
  loading: boolean;
  empty: string;
  onBack: () => void;
  children: ReactNode;
  isEmpty: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-bold text-accent"
      >
        ← Back
      </button>
      {loading ? (
        <LoadingBlock />
      ) : isEmpty ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">{children}</div>
      )}
    </div>
  );
}

function useLongPress(onLongPress?: () => void, ms = 420) {
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return {
    onPointerDown: () => {
      if (!onLongPress) return;
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onLongPress();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (event: MouseEvent) => {
      if (!onLongPress) return;
      event.preventDefault();
      onLongPress();
    },
  };
}

function ReplyQuote({
  preview,
  mine,
  onJump,
}: {
  preview: NonNullable<MessageView['replyTo']>;
  mine: boolean;
  onJump?: () => void;
}) {
  const className = cx(
    'mb-1.5 w-full rounded-lg border-l-2 px-2 py-1.5 text-left text-sm',
    mine ? 'border-white/50 bg-white/10 text-white/85' : 'border-accent bg-surface/80 text-muted',
    onJump && (mine ? 'hover:bg-white/20 active:bg-white/25' : 'hover:bg-surface active:bg-foam'),
  );
  const body = (
    <>
      <p className={cx('font-bold', mine ? 'text-white' : 'text-accent')}>Reply</p>
      <p className="truncate">{preview.bodyPreview ?? 'Message'}</p>
    </>
  );
  if (!onJump) {
    return <div className={className}>{body}</div>;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        onJump();
      }}
    >
      {body}
    </button>
  );
}

type MessageActions = {
  onReply?: () => void;
  onForward?: () => void;
  onSelect?: () => void;
};

function MessageChrome({
  messageId,
  mine,
  selecting,
  selected,
  highlighted = false,
  onToggleSelect,
  actions,
  children,
  className,
}: {
  messageId: string;
  mine: boolean;
  selecting: boolean;
  selected: boolean;
  highlighted?: boolean;
  onToggleSelect?: () => void;
  actions?: MessageActions;
  children: ReactNode;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasActions = Boolean(actions?.onReply || actions?.onForward || actions?.onSelect);
  // WhatsApp-style: long-press selects; chevron opens Reply/Forward/Select menu.
  const longPress = useLongPress(
    selecting
      ? onToggleSelect
      : actions?.onSelect
        ? () => {
            setMenuOpen(false);
            actions.onSelect?.();
          }
        : undefined,
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [menuOpen]);

  const run = (fn?: () => void) => {
    setMenuOpen(false);
    fn?.();
  };

  return (
    <div
      className={cx(
        'flex w-full items-end gap-2 rounded-2xl',
        mine ? 'justify-end' : 'justify-start',
        highlighted && 'ekum-msg-flash',
      )}
    >
      {selecting ? (
        <button
          type="button"
          aria-label={selected ? 'Deselect' : 'Select'}
          onClick={onToggleSelect}
          className={cx(
            'mb-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
            selected
              ? 'border-accent bg-accent text-white'
              : 'border-line bg-surface text-transparent',
          )}
        >
          <CheckIcon width={14} height={14} />
        </button>
      ) : null}
      <div
        ref={rootRef}
        data-message-id={messageId}
        className={cx('relative', className)}
        {...longPress}
        onClick={selecting && onToggleSelect ? () => onToggleSelect() : undefined}
      >
        {hasActions && !selecting ? (
          <button
            type="button"
            aria-label="Message actions"
            aria-expanded={menuOpen}
            data-card-action
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className={cx(
              'absolute right-1.5 top-1 z-10 flex h-6 w-6 items-center justify-center bg-transparent',
              mine ? 'text-white/55 hover:text-white/80' : 'text-muted/60 hover:text-muted',
            )}
          >
            <ChevronDownIcon width={16} height={16} />
          </button>
        ) : null}
        {children}
        {hasActions && !selecting && menuOpen ? (
          <div
            role="menu"
            className="absolute right-1 top-8 z-20 min-w-[8.5rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-soft"
          >
            {actions?.onReply ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onReply);
                }}
              >
                Reply
              </button>
            ) : null}
            {actions?.onForward ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onForward);
                }}
              >
                Forward
              </button>
            ) : null}
            {actions?.onSelect ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onSelect);
                }}
              >
                Select
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TimelineItem({
  message,
  senderLabel,
  onAcceptQuote,
  accepting,
  onOpenOrder,
  onCurate,
  curating,
  curated,
  selecting,
  selected,
  highlighted = false,
  onJumpToReply,
  onToggleSelect,
  actions,
}: {
  message: MessageView;
  senderLabel: string;
  onAcceptQuote: (orderId: string) => void;
  accepting: boolean;
  onOpenOrder: (orderId: string) => void;
  onCurate: (reference: MessageReference) => void;
  curating: boolean;
  curated: boolean;
  selecting: boolean;
  selected: boolean;
  highlighted?: boolean;
  onJumpToReply?: () => void;
  onToggleSelect?: () => void;
  actions?: MessageActions;
}) {
  const ref = message.reference;
  const meta =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  /** Legacy line-decision notices were stored as system; treat as order cards when resolved. */
  const isLegacyOrderNotice =
    message.type === 'system' &&
    Boolean(ref?.id) &&
    (ref?.kind === 'order' || meta?.kind === 'order_lines');
  const isCard =
    message.type === 'order_card' ||
    message.type === 'rate' ||
    message.type === 'collection_card' ||
    message.type === 'product_card' ||
    isLegacyOrderNotice;
  const isOrderLikeCard =
    message.type === 'order_card' || message.type === 'rate' || isLegacyOrderNotice;
  const orderCopy = isOrderLikeCard
    ? buildOrderCardCopy(message, ref, { partyName: senderLabel })
    : null;
  const typeMeta = chatTypeMeta(isLegacyOrderNotice ? 'order_card' : message.type);
  const TypeIcon = typeMeta.Icon;
  const reply = message.replyTo;

  const photoUrls = message.type === 'photo' ? photoUrlsFromMessage(message) : [];
  if (message.type === 'photo' && photoUrls.length > 0) {
    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={actions}
        className="max-w-[85%]"
      >
        <div className="flex flex-col gap-0.5">
          <p
            className={cx(
              'px-1 text-sm font-semibold text-muted',
              message.mine ? 'text-right' : 'text-left',
            )}
          >
            {message.mine ? 'You' : senderLabel}
          </p>
          <div
            className={cx(
              'overflow-hidden rounded-2xl border border-line bg-surface',
              message.mine ? 'rounded-br-md' : 'rounded-bl-md',
            )}
          >
            {reply ? (
              <div className="px-3 pt-2">
                <ReplyQuote preview={reply} mine={false} onJump={onJumpToReply} />
              </div>
            ) : null}
            <PhotoAlbum urls={photoUrls} />
            <p className="px-3 py-1.5 text-right text-xs text-muted">
              {timeAgo(message.createdAt)}
            </p>
          </div>
        </div>
      </MessageChrome>
    );
  }

  if (!isCard) {
    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={actions}
        className="max-w-[85%]"
      >
        <div className="flex flex-col gap-0.5">
          {!message.mine ? (
            <p className="px-1 text-sm font-semibold text-muted">{senderLabel}</p>
          ) : null}
          <div
            className={cx(
              'rounded-2xl px-3.5 py-2 text-sm',
              message.mine
                ? 'rounded-br-md bg-accent text-white'
                : 'rounded-bl-md border border-line bg-foam text-ink',
            )}
          >
            {reply ? (
              <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
            ) : null}
            <p className="whitespace-pre-wrap break-words">
              {message.body?.trim() ? message.body : 'Message'}
            </p>
            <p
              className={cx(
                'mt-0.5 text-right text-xs',
                message.mine ? 'text-white/70' : 'text-muted',
              )}
            >
              {timeAgo(message.createdAt)}
            </p>
          </div>
        </div>
      </MessageChrome>
    );
  }

  const openOrder =
    isOrderLikeCard && ref?.available && ref.id ? () => onOpenOrder(ref.id) : undefined;
  const quoteAccept =
    message.type === 'rate' &&
    !message.mine &&
    ref?.canAcceptQuote &&
    ref.available
      ? () => onAcceptQuote(ref.id)
      : undefined;

  return (
    <MessageChrome
      messageId={message.id}
      mine={message.mine}
      selecting={selecting}
      selected={selected}
      highlighted={highlighted}
      onToggleSelect={onToggleSelect}
      actions={actions}
      className="w-[min(100%,20rem)] min-w-[14rem]"
    >
      <div
        role={openOrder && !selecting ? 'button' : undefined}
        tabIndex={openOrder && !selecting ? 0 : undefined}
        onClick={
          openOrder && !selecting
            ? (event) => {
                // Primary Accept quote button stops propagation itself.
                if ((event.target as HTMLElement).closest('[data-card-action]')) return;
                openOrder();
              }
            : undefined
        }
        onKeyDown={
          openOrder && !selecting
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openOrder();
                }
              }
            : undefined
        }
        className={cx(
          'overflow-hidden rounded-2xl border text-sm shadow-sm',
          message.mine
            ? 'rounded-br-md border-accent/35 bg-accent text-white'
            : 'rounded-bl-md border-line bg-foam text-ink',
          openOrder && !selecting && 'cursor-pointer',
        )}
      >
        <div
          className={cx(
            'flex items-center gap-2 px-3 py-2.5',
            message.mine ? 'border-b border-white/20' : 'border-b border-line/70',
          )}
        >
          <TypeIcon
            width={18}
            height={18}
            className={cx('shrink-0', message.mine ? 'text-white' : 'text-accent')}
            aria-hidden
          />
          <p
            className={cx(
              'min-w-0 flex-1 truncate text-sm font-bold tracking-tight',
              message.mine ? 'text-white' : 'text-ink',
              isOrderLikeCard && 'whitespace-nowrap',
            )}
          >
            {orderCopy ? orderCopy.title : typeMeta.label}
          </p>
        </div>
        <div className="px-3.5 py-3">
          {reply ? (
            <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
          ) : null}
          {message.type === 'order_card' || isLegacyOrderNotice ? (
            <TimelineCard
              mine={message.mine}
              title={orderCopy?.headline ?? ref?.name ?? 'Order'}
              image={ref?.image}
              images={ref?.images}
              imageOverflow={
                ref?.itemCount != null && ref.images?.length
                  ? Math.max(0, ref.itemCount - ref.images.length)
                  : 0
              }
              lines={orderCopy?.lines ?? []}
              actionLabel={ref?.available ? 'View order →' : undefined}
              onAction={openOrder}
              actionStyle="link"
              createdAt={message.createdAt}
            />
          ) : null}

          {message.type === 'rate' ? (
            <TimelineCard
              mine={message.mine}
              title={orderCopy?.headline ?? ref?.totalLabel ?? 'Quote'}
              image={ref?.image}
              images={ref?.images}
              imageOverflow={
                ref?.itemCount != null && ref.images?.length
                  ? Math.max(0, ref.itemCount - ref.images.length)
                  : 0
              }
              lines={orderCopy?.lines ?? []}
              actionLabel={
                quoteAccept
                  ? accepting
                    ? 'Accepting…'
                    : 'Accept quote'
                  : ref?.available
                    ? 'View order →'
                    : undefined
              }
              onAction={quoteAccept ?? openOrder}
              actionStyle={quoteAccept ? 'primary' : 'link'}
              createdAt={message.createdAt}
            />
          ) : null}

          {message.type === 'collection_card' ? (
            <div className="flex flex-col gap-0.5">
              <p
                className={cx(
                  'px-1 text-sm font-semibold text-muted',
                  message.mine ? 'text-right' : 'text-left',
                )}
              >
                {message.mine ? 'You' : senderLabel}
              </p>
              <TimelineCard
                mine={message.mine}
                title={
                  ref?.available
                    ? (ref.name ?? message.body ?? 'Collection')
                    : ref
                      ? 'Unavailable'
                      : (message.body?.trim() || 'Collection')
                }
                image={ref?.image}
                images={ref?.images}
                imageOverflow={
                  ref?.itemCount != null && ref.images?.length
                    ? Math.max(0, ref.itemCount - ref.images.length)
                    : 0
                }
                lines={[
                  ref?.ownerCompanyName ? `from ${ref.ownerCompanyName}` : null,
                  ref?.itemCount != null
                    ? `${ref.itemCount} design${ref.itemCount === 1 ? '' : 's'}`
                    : null,
                ]}
                actionLabel={ref?.available ? 'View collection →' : undefined}
                actionTo={ref?.available ? `/collections/${ref.id}` : undefined}
                actionStyle="link"
                createdAt={message.createdAt}
              />
            </div>
          ) : null}

          {message.type === 'product_card' ? (
            <div className="flex flex-col gap-0.5">
              <p
                className={cx(
                  'px-1 text-sm font-semibold text-muted',
                  message.mine ? 'text-right' : 'text-left',
                )}
              >
                {message.mine ? 'You' : senderLabel}
              </p>
              <TimelineCard
                mine={message.mine}
                title={
                  ref?.available
                    ? (ref.name ?? message.body ?? 'Design')
                    : ref
                      ? 'Unavailable'
                      : (message.body?.trim() || 'Design')
                }
                image={ref?.image}
                images={ref?.images}
                lines={ref?.ownerCompanyName ? [`from ${ref.ownerCompanyName}`] : []}
                actionLabel={ref?.available ? 'View design →' : undefined}
                actionTo={ref?.available ? `/explore/products/${ref.id}` : undefined}
                actionStyle="link"
                secondaryAction={
                  !message.mine && ref?.available
                    ? curated
                      ? 'Saved to my designs'
                      : curating
                        ? 'Saving…'
                        : 'Save to my designs'
                    : undefined
                }
                onSecondaryAction={
                  !message.mine && ref?.available && !curated && !curating
                    ? () => onCurate(ref)
                    : undefined
                }
                createdAt={message.createdAt}
              />
            </div>
          ) : null}

          {!isLegacyOrderNotice &&
          !['order_card', 'rate', 'collection_card', 'product_card'].includes(message.type) ? (
            <TimelineCard
              mine={message.mine}
              title={message.body?.trim() || 'Shared attachment'}
              createdAt={message.createdAt}
            />
          ) : null}
        </div>
      </div>
    </MessageChrome>
  );
}

function TimelineCard({
  title,
  lines = [],
  image,
  images,
  imageOverflow = 0,
  actionLabel,
  actionTo,
  onAction,
  actionStyle = 'link',
  secondaryAction,
  onSecondaryAction,
  createdAt,
  mine = false,
}: {
  title: string;
  lines?: Array<string | null | undefined>;
  image?: string | null;
  images?: string[] | null;
  imageOverflow?: number;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  /** primary = high-stakes (Accept quote); solid = full-width secondary CTA; link = text. */
  actionStyle?: 'primary' | 'solid' | 'link';
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  createdAt: string;
  mine?: boolean;
}) {
  const visibleLines = lines.filter((line): line is string => Boolean(line?.trim()));
  const muted = mine ? 'text-white/75' : 'text-muted';
  const ink = mine ? 'text-white' : 'text-ink';
  const linkAction = mine ? 'text-white underline decoration-white/50' : 'text-accent';
  const gallery = images && images.length > 0 ? images : image ? [image] : [];

  const solidClass = mine
    ? 'mt-2 w-full rounded-xl border border-white/40 bg-white/15 px-3 py-2.5 text-center text-sm font-bold text-white'
    : 'mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-center text-sm font-bold text-ink';
  const primaryClass =
    'mt-2 w-full rounded-xl bg-accent px-3 py-2.5 text-center text-sm font-bold text-white';

  const renderAction = () => {
    if (!actionLabel) return null;
    if (actionStyle === 'primary' && onAction) {
      return (
        <button
          type="button"
          data-card-action
          onClick={(event) => {
            event.stopPropagation();
            onAction();
          }}
          className={primaryClass}
        >
          {actionLabel}
        </button>
      );
    }
    if (actionStyle === 'solid') {
      if (actionTo) {
        return (
          <Link
            to={actionTo}
            data-card-action
            onClick={(event) => event.stopPropagation()}
            className={solidClass}
          >
            {actionLabel}
          </Link>
        );
      }
      if (onAction) {
        return (
          <button
            type="button"
            data-card-action
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            className={solidClass}
          >
            {actionLabel}
          </button>
        );
      }
    }
    if (actionTo) {
      return (
        <Link
          to={actionTo}
          data-card-action
          onClick={(event) => event.stopPropagation()}
          className={cx('mt-1 text-sm font-bold', linkAction)}
        >
          {actionLabel}
        </Link>
      );
    }
    if (onAction) {
      return (
        <button
          type="button"
          data-card-action
          onClick={(event) => {
            event.stopPropagation();
            onAction();
          }}
          className={cx('mt-1 self-start text-sm font-bold', linkAction)}
        >
          {actionLabel}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-1">
      {gallery.length > 0 ? (
        <div className="mb-1 -mx-0.5">
          <PhotoAlbum urls={gallery} overflowCount={imageOverflow} />
        </div>
      ) : null}
      <p className={cx('text-sm font-semibold tracking-tight', ink)}>{title}</p>
      {visibleLines.map((line) => (
        <p key={line} className={cx('text-sm font-medium', muted)}>
          {line}
        </p>
      ))}
      {renderAction()}
      {secondaryAction ? (
        onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className={cx('mt-1 self-start text-sm font-medium', linkAction)}
          >
            {secondaryAction}
          </button>
        ) : (
          <p className={cx('mt-1 text-sm font-medium', muted)}>{secondaryAction}</p>
        )
      ) : null}
      <p className={cx('mt-1 text-right text-xs', muted)}>{timeAgo(createdAt)}</p>
    </div>
  );
}
