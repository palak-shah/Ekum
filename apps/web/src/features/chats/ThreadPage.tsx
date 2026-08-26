import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  CollectionView,
  CompanySettingsView,
  CreateProductDto,
  CursorPage,
  MessageReference,
  MessageView,
  OrderView,
  ProductView,
  ThreadDetail,
  ThreadSummary,
} from '@ekum/domain-types';
import { OrderPathPreference, photoUrlsFromMessage } from '@ekum/domain-types';
import { useCompanyId } from '@/lib/auth';
import { api, ApiError } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { uploadImage } from '@/lib/mediaUpload';
import { statusLabel } from '@/lib/status';
import { PageHeader } from '@/ui/PageHeader';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import { Avatar, Button, Chip, ErrorState, FilterRail, InlineNotice, LoadingBlock, Sheet, TextInput, cx } from '@/ui/kit';
import {
  BackIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CollectionIcon,
  OrdersIcon,
  PinIcon,
  PlusIcon,
  ProductIcon,
  SearchIcon,
  SendIcon,
} from '@/ui/icons';
import {
  canForwardMessage,
  canReplyToMessage,
  forwardPayload,
  replyComposerLabel,
} from './chatMessageActions';
import {
  resolveForwardFacilitator,
  withFacilitatorQuery,
  withOrderPathQuery,
  parseOrderPath,
  catalogShareSenderLabel,
  catalogOrderGoesToLine,
  rememberCatalogHandlerName,
} from '@/features/browse/forwardAttribution';
import { SelectAllFloat } from '@/features/browse/SelectAllFloat';
import { nextIdSet, selectAllState } from '@/features/browse/selectAllState';
import { resolveOrderPathPreference } from '@/features/browse/orderPathPreference';
import {
  buildOrderCardCopy,
  dedupeOrderThreadMessages,
  isRichOrderChatMessage,
  primaryAcceptQuoteMessageId,
} from './orderCardCopy';
import { chatTypeMeta, inCardSenderLine, outboundMessageLabel } from './messagePreview';
import { PhotoAlbum } from './PhotoAlbum';
import {
  highlightSearchText,
  searchHitIdsNewestFirst,
  type ThreadMessageViewScope,
} from './threadMessageSearch';
import { filterByAttachSearch } from './attachShareSearch';

type AttachStep =
  | 'menu'
  | 'product'
  | 'collection'
  | 'order'
  | 'photo';

function scrollListToBottom(list: HTMLDivElement) {
  requestAnimationFrame(() => {
    list.scrollTop = list.scrollHeight;
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight;
    });
  });
}

function isNearBottom(list: HTMLDivElement, threshold = 96): boolean {
  return list.scrollHeight - list.scrollTop - list.clientHeight < threshold;
}

export function ThreadPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const refMessageId = searchParams.get('message');
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canForward = (message: MessageView) => canForwardMessage(message, companyId);
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachStep, setAttachStep] = useState<AttachStep>('menu');
  const [attachQuery, setAttachQuery] = useState('');
  const [attachSelectedIds, setAttachSelectedIds] = useState<Set<string>>(() => new Set());
  const [attachSending, setAttachSending] = useState(false);
  const [attachSendError, setAttachSendError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRefs, setSavedRefs] = useState<Set<string>>(() => new Set());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [forwardQueue, setForwardQueue] = useState<MessageView[]>([]);
  const [forwardPath, setForwardPath] = useState<'direct' | 'handle'>(
    OrderPathPreference.Direct,
  );
  const [forwardDoneTo, setForwardDoneTo] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageView | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [forwardProgress, setForwardProgress] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchView, setSearchView] = useState<ThreadMessageViewScope>('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [hitIndex, setHitIndex] = useState(0);
  const highlightTimer = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);

  const listView: ThreadMessageViewScope = searchOpen ? searchView : 'all';
  const listQ = searchOpen ? searchQ : '';
  const messagesQueryKey = ['thread', id, 'messages', listView, listQ] as const;

  const thread = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get<ThreadDetail>(`/threads/${id}`),
  });
  /** Search + All + empty query: prompt to type — don't re-list the whole thread. */
  const messagesEnabled =
    Boolean(id) && (!searchOpen || searchView !== 'all' || Boolean(listQ));

  const messages = useInfiniteQuery({
    queryKey: messagesQueryKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<MessageView>>(`/threads/${id}/messages`, {
        limit: 40,
        view: listView,
        ...(listQ ? { q: listQ } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor,
    enabled: messagesEnabled,
    staleTime: 0,
    refetchInterval: searchOpen || listView !== 'all' || listQ ? false : 3_000,
    refetchOnWindowFocus: !searchOpen,
  });

  useEffect(() => {
    const handle = window.setTimeout(() => setSearchQ(searchDraft.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

  useEffect(() => {
    if (searchOpen) {
      queueMicrotask(() => searchInputRef.current?.focus());
    }
  }, [searchOpen]);
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

  const ordered = useMemo(() => {
    const pages = messages.data?.pages ?? [];
    const chronological = [...pages]
      .reverse()
      .flatMap((page) => [...page.results].reverse());
    return dedupeOrderThreadMessages(chronological);
  }, [messages.data?.pages]);

  const primaryAcceptQuoteId = useMemo(
    () => primaryAcceptQuoteMessageId(ordered),
    [ordered],
  );

  const lastMessageId = ordered[ordered.length - 1]?.id ?? null;

  const searchHits = useMemo(
    () => (searchOpen && searchQ ? searchHitIdsNewestFirst(ordered, searchQ) : []),
    [searchOpen, searchQ, ordered],
  );

  useEffect(() => {
    setHitIndex(0);
  }, [searchQ, searchView, id]);

  useEffect(() => {
    stickToBottom.current = !refMessageId;
    setHighlightId(null);
    setSearchOpen(false);
    setSearchDraft('');
    setSearchQ('');
    setSearchView('all');
    setHitIndex(0);
  }, [id, refMessageId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !messages.isSuccess || refMessageId) return;

    // Normal chat: stick to bottom when near end.
    if (!searchOpen) {
      if (!stickToBottom.current) return;
      scrollListToBottom(list);
      return;
    }

    // Search open + typing: jumpToSearchHit(0) lands on newest match.
    if (searchQ) return;

    // Chip browse (Photos / Orders / …): start at newest (bottom), WhatsApp-style.
    if (searchView !== 'all' && stickToBottom.current) {
      scrollListToBottom(list);
    }
  }, [
    ordered.length,
    lastMessageId,
    id,
    searchOpen,
    searchQ,
    searchView,
    messages.isSuccess,
    refMessageId,
  ]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onScroll = () => {
      stickToBottom.current = isNearBottom(list);
    };
    list.addEventListener('scroll', onScroll, { passive: true });
    return () => list.removeEventListener('scroll', onScroll);
  }, [id]);

  const refreshMessages = () => {
    void queryClient.invalidateQueries({ queryKey: ['thread', id, 'messages'] });
    void queryClient.invalidateQueries({ queryKey: ['thread', id] });
    void queryClient.invalidateQueries({ queryKey: ['threads'] });
    void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
  };

  const insertMessage = (message: MessageView) => {
    queryClient.setQueryData<InfiniteData<CursorPage<MessageView>>>(
      ['thread', id, 'messages', 'all', ''],
      (prev) => {
        if (!prev) {
          return {
            pages: [{ results: [message], nextCursor: null }],
            pageParams: [null],
          };
        }
        if (prev.pages.some((page) => page.results.some((row) => row.id === message.id))) {
          return prev;
        }
        const [first, ...rest] = prev.pages;
        if (!first) {
          return {
            pages: [{ results: [message], nextCursor: null }],
            pageParams: prev.pageParams,
          };
        }
        return {
          ...prev,
          pages: [{ ...first, results: [message, ...first.results] }, ...rest],
        };
      },
    );
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
      stickToBottom.current = true;
      insertMessage(message);
      setDraft('');
      setReplyTo(null);
      setAttachOpen(false);
      setAttachStep('menu');
      setError(null);
      refreshMessages();
      const list = listRef.current;
      if (list) scrollListToBottom(list);
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

  const acceptLogged = useMutation({
    mutationFn: (orderId: string) => api.post(`/orders/${orderId}/accept`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not accept.'),
  });

  const payAct = useMutation({
    mutationFn: ({ askId, action }: { askId: string; action: 'paid' | 'received' }) =>
      api.post(`/payment-requests/${askId}/${action}`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not update payment.'),
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

  const catalogForward = forwardQueue.some(
    (message) => message.type === 'product_card' || message.type === 'collection_card',
  );
  const forwardSettings = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: catalogForward,
  });
  useEffect(() => {
    if (!catalogForward || !forwardSettings.data) return;
    setForwardPath(resolveOrderPathPreference(forwardSettings.data.tradeDefaults));
  }, [catalogForward, forwardSettings.data]);

  const forward = useMutation({
    mutationFn: async (threadId: string) => {
      if (forwardQueue.length === 0) {
        throw new Error('Nothing to forward');
      }
      for (let i = 0; i < forwardQueue.length; i += 1) {
        const message = forwardQueue[i];
        if (!message) continue;
        setForwardProgress(`Forwarding ${i + 1}/${forwardQueue.length}…`);
        const stampPath =
          message.type === 'product_card' || message.type === 'collection_card'
            ? forwardPath
            : undefined;
        await api.post<MessageView>(
          `/threads/${threadId}/messages`,
          forwardPayload(message, stampPath),
        );
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
    setAttachQuery('');
    setAttachSelectedIds(new Set());
    setAttachSendError(null);
    setAttachOpen(true);
  };

  const resetAttachPicker = () => {
    setAttachQuery('');
    setAttachSelectedIds(new Set());
    setAttachSendError(null);
  };

  const goAttachStep = (step: AttachStep) => {
    resetAttachPicker();
    setAttachStep(step);
  };

  const toggleAttachId = (itemId: string) => {
    setAttachSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const closeAttachSheet = () => {
    setAttachOpen(false);
    setAttachStep('menu');
    resetAttachPicker();
  };

  const sendAttachSelected = async () => {
    if (attachSelectedIds.size === 0 || attachSending) return;
    const orderedIds = [...attachSelectedIds];
    setAttachSending(true);
    setAttachSendError(null);
    const failed = new Set<string>();
    let first = true;
    const replyId = replyTo?.id;

    for (const refId of orderedIds) {
      try {
        let payload: {
          type: string;
          body?: string;
          referenceId?: string;
          replyToMessageId?: string;
        } | null = null;

        if (attachStep === 'product') {
          const product = (myProducts.data ?? []).find((row) => row.id === refId);
          if (!product) {
            failed.add(refId);
            continue;
          }
          payload = {
            type: 'product_card',
            referenceId: product.id,
            body: product.name,
            replyToMessageId: first ? replyId : undefined,
          };
        } else if (attachStep === 'collection') {
          const collection = (myCollections.data ?? []).find((row) => row.id === refId);
          if (!collection) {
            failed.add(refId);
            continue;
          }
          payload = {
            type: 'collection_card',
            referenceId: collection.id,
            body: collection.name,
            replyToMessageId: first ? replyId : undefined,
          };
        } else if (attachStep === 'order') {
          const order = counterpartOrders.find((row) => row.id === refId);
          if (!order) {
            failed.add(refId);
            continue;
          }
          payload = {
            type: 'order_card',
            referenceId: order.id,
            body: order.counterpart.name,
            replyToMessageId: first ? replyId : undefined,
          };
        }

        if (!payload) {
          failed.add(refId);
          continue;
        }

        const message = await api.post<MessageView>(`/threads/${id}/messages`, payload);
        insertMessage(message);
        first = false;
      } catch {
        failed.add(refId);
      }
    }

    setAttachSending(false);
    if (failed.size === 0) {
      stickToBottom.current = true;
      setReplyTo(null);
      setDraft('');
      closeAttachSheet();
      setError(null);
      refreshMessages();
      const list = listRef.current;
      if (list) scrollListToBottom(list);
      return;
    }

    setAttachSelectedIds(failed);
    setAttachSendError(
      failed.size === orderedIds.length
        ? 'Could not send. Try again.'
        : 'Could not send some items. Try again.',
    );
  };

  const startReply = (message: MessageView) => {
    setReplyTo(message);
    queueMicrotask(() => draftInputRef.current?.focus());
  };

  const highlightMessage = (messageId: string, persist = false) => {
    const root = listRef.current;
    if (!root) return false;
    const target = root.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!target) return false;
    stickToBottom.current = false;
    setError(null);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlightTimer.current != null) {
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = null;
    }
    setHighlightId(messageId);
    if (!persist) {
      highlightTimer.current = window.setTimeout(() => {
        setHighlightId(null);
        highlightTimer.current = null;
      }, 1600);
    }
    return true;
  };

  const ensureMessageHighlighted = async (messageId: string, persist = false) => {
    for (let attempt = 0; attempt < 15; attempt += 1) {
      if (highlightMessage(messageId, persist)) return true;
      if (attempt < 6) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        continue;
      }
      if (!messages.hasNextPage || messages.isFetchingNextPage) break;
      stickToBottom.current = false;
      await messages.fetchNextPage();
    }
    return highlightMessage(messageId, persist);
  };

  const jumpToMessage = async (messageId: string) => {
    stickToBottom.current = false;
    const ok = await ensureMessageHighlighted(messageId);
    if (!ok) setError('That message is not loaded in this chat view.');
  };

  const jumpToSearchHit = async (index: number) => {
    if (searchHits.length === 0) return;
    const next = ((index % searchHits.length) + searchHits.length) % searchHits.length;
    setHitIndex(next);
    const messageId = searchHits[next];
    if (!messageId) return;

    stickToBottom.current = false;
    const ok = await ensureMessageHighlighted(messageId, true);
    if (!ok) setError('That message is not loaded in this chat view.');
  };

  useEffect(() => {
    if (!refMessageId || !id) return;
    let cancelled = false;
    stickToBottom.current = false;

    void (async () => {
      await queryClient.invalidateQueries({ queryKey: ['thread', id, 'messages'] });
      await queryClient.refetchQueries({ queryKey: ['thread', id, 'messages', 'all', ''] });
      if (cancelled) return;
      const ok = await ensureMessageHighlighted(refMessageId, true);
      if (cancelled) return;
      if (!ok) {
        setError('That message is not loaded in this chat view.');
        return;
      }
      const next = new URLSearchParams(searchParams);
      next.delete('message');
      setSearchParams(next, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
    // Jump once when opening a referenced message — not on pagination refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [refMessageId, id]);

  useEffect(() => {
    if (!searchOpen || !searchQ || !messages.isSuccess) return;
    // Newest hit first (bottom of timeline); ↑ older / ↓ newer — WhatsApp.
    void jumpToSearchHit(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [searchOpen, searchQ, searchView, messages.isSuccess, messagesQueryKey.join('\0')]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchDraft('');
    setSearchQ('');
    setSearchView('all');
    setHitIndex(0);
    setHighlightId(null);
    stickToBottom.current = true;
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
    const queue = ordered.filter((message) => selectedIds.has(message.id) && canForward(message));
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

  const filteredAttachProducts = useMemo(
    () =>
      filterByAttachSearch(myProducts.data ?? [], attachQuery, (product) => product.name),
    [myProducts.data, attachQuery],
  );
  const filteredAttachCollections = useMemo(
    () =>
      filterByAttachSearch(
        myCollections.data ?? [],
        attachQuery,
        (collection) => collection.name,
      ),
    [myCollections.data, attachQuery],
  );
  const attachCounterpartId = thread.data?.counterpart?.id;
  const counterpartOrders = useMemo(() => {
    const rows = myOrders.data?.results ?? [];
    return rows.filter((order) =>
      attachCounterpartId ? order.counterpart.id === attachCounterpartId : true,
    );
  }, [myOrders.data?.results, attachCounterpartId]);
  const filteredAttachOrders = useMemo(
    () =>
      filterByAttachSearch(counterpartOrders, attachQuery, (order) => {
        const short = order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
        return `${short} ${order.counterpart.name} ${statusLabel(order.status)}`;
      }),
    [counterpartOrders, attachQuery],
  );

  const threadWipActive = useMemo(
    () =>
      Boolean(
        draft.trim() ||
          replyTo ||
          attachSelectedIds.size > 0 ||
          attachSending ||
          uploadingPhoto ||
          uploadProgress ||
          forwardQueue.length > 0 ||
          (selecting && selectedIds.size > 0),
      ),
    [
      draft,
      replyTo,
      attachSelectedIds.size,
      attachSending,
      uploadingPhoto,
      uploadProgress,
      forwardQueue.length,
      selecting,
      selectedIds.size,
    ],
  );
  const discard = useDiscardGuard(threadWipActive);

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

  const forwardableIds = ordered.filter((message) => canForward(message)).map((message) => message.id);
  const selectAll = selectAllState(forwardableIds, selectedIds);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <PageHeader
        title={title}
        subtitle={headerSubtitle || undefined}
        titleTo={counterpartId ? `/company/${counterpartId}` : undefined}
        onBack={() => discard.tryLeave(() => navigate('/chats'))}
        action={
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              data-testid="thread-search-toggle"
              aria-label={searchOpen ? 'Close search' : 'Search in chat'}
              onClick={() => {
                if (searchOpen) {
                  closeSearch();
                  return;
                }
                stickToBottom.current = true;
                setSearchOpen(true);
              }}
              className={cx(
                'rounded-full p-2',
                searchOpen ? 'text-accent' : 'text-muted hover:bg-foam hover:text-ink',
              )}
            >
              <SearchIcon width={20} height={20} />
            </button>
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
          </div>
        }
      />

      <SelectAllFloat
        open={selecting && forwardableIds.length > 0}
        count={selectedIds.size}
        action={selectAll.action}
        onAction={() => setSelectedIds(nextIdSet(forwardableIds, selectedIds))}
      />

      {searchOpen ? (
        <div
          data-testid="thread-search-band"
          className="mb-2 flex shrink-0 flex-col gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5"
        >
          <div className="flex items-center gap-1.5">
            <input
              ref={searchInputRef}
              data-testid="thread-search-input"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closeSearch();
                  return;
                }
                if (event.key === 'Enter' && searchHits.length > 0) {
                  event.preventDefault();
                  void jumpToSearchHit(event.shiftKey ? hitIndex + 1 : hitIndex - 1);
                }
              }}
              placeholder="Search in chat"
              className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
            />
            {searchQ ? (
              <>
                <button
                  type="button"
                  className="shrink-0 px-1 text-sm font-semibold text-muted"
                  onClick={() => {
                    setSearchDraft('');
                    setSearchQ('');
                    stickToBottom.current = true;
                  }}
                >
                  Clear
                </button>
                <span
                  data-testid="thread-search-hit-count"
                  className="shrink-0 text-xs font-semibold tabular-nums text-muted"
                >
                  {searchHits.length === 0 ? '0 of 0' : `${hitIndex + 1} of ${searchHits.length}`}
                </span>
                <button
                  type="button"
                  aria-label="Older match"
                  disabled={searchHits.length === 0}
                  className="shrink-0 rounded-full p-1 text-slate disabled:opacity-35"
                  onClick={() => void jumpToSearchHit(hitIndex + 1)}
                >
                  <ChevronUpIcon width={18} height={18} />
                </button>
                <button
                  type="button"
                  aria-label="Newer match"
                  disabled={searchHits.length === 0}
                  className="shrink-0 rounded-full p-1 text-slate disabled:opacity-35"
                  onClick={() => void jumpToSearchHit(hitIndex - 1)}
                >
                  <ChevronDownIcon width={18} height={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="shrink-0 px-1 text-sm font-semibold text-accent"
                onClick={closeSearch}
              >
                Done
              </button>
            )}
          </div>
          <FilterRail>
            {(
              [
                ['all', 'All'],
                ['photos', 'Photos'],
                ['collections', 'Collections'],
                ['designs', 'Designs'],
                ['orders', 'Orders'],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                active={searchView === value}
                onClick={() => {
                  setSearchView(value);
                  // Chip browse / search: start at newest (bottom), WhatsApp-style.
                  stickToBottom.current = true;
                }}
              >
                {label}
              </Chip>
            ))}
          </FilterRail>
        </div>
      ) : null}

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
            {messages.hasNextPage ? (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  disabled={messages.isFetchingNextPage}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent hover:bg-foam disabled:opacity-50"
                  onClick={() => {
                    stickToBottom.current = false;
                    void messages.fetchNextPage();
                  }}
                >
                  {messages.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            ) : null}
            {ordered.map((message) => (
              <TimelineItem
                key={message.id}
                message={message}
                primaryAcceptQuoteId={primaryAcceptQuoteId}
                viewerCompanyId={companyId}
                searchHighlight={searchOpen ? searchQ : ''}
                senderLabel={
                  message.mine
                    ? outboundMessageLabel(message)
                    : (detail.participants.find((row) => row.companyId === message.senderCompanyId)
                        ?.company.name ??
                      detail.counterpart?.name ??
                      'Business')
                }
                onAcceptQuote={(orderId) => acceptQuote.mutate(orderId)}
                onAcceptLogged={(orderId) => acceptLogged.mutate(orderId)}
                accepting={acceptQuote.isPending || acceptLogged.isPending}
                onPaymentAction={(askId, action) => payAct.mutate({ askId, action })}
                paymentActing={payAct.isPending}
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
                  selecting && canForward(message)
                    ? () => toggleSelected(message.id)
                    : undefined
                }
                actions={
                  canCompose && !selecting
                    ? {
                        onReply: canReplyToMessage(message)
                          ? () => startReply(message)
                          : undefined,
                        onForward: canForward(message)
                          ? () => startForwardOne(message)
                          : undefined,
                        onSelect: canForward(message)
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
          <p className="py-10 text-center text-sm text-muted">
            {searchOpen && searchQ
              ? 'No matches'
              : searchOpen && searchView === 'photos'
                ? 'No photos yet'
                : searchOpen && searchView === 'collections'
                  ? 'No collections in this chat'
                  : searchOpen && searchView === 'designs'
                    ? 'No designs in this chat'
                    : searchOpen && searchView === 'orders'
                      ? 'No orders in this chat'
                      : searchOpen && searchView === 'all'
                        ? 'Type to search this chat'
                        : 'No messages yet. Say hello.'}
          </p>
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
          <span className="flex-1" />
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
              data-testid="chat-attach"
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
        data-testid="chat-photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => void onPhotoPicked(e.target.files)}
      />

      <Sheet
        open={attachOpen}
        onClose={closeAttachSheet}
        title={attachTitle}
        footer={
          attachStep !== 'menu' && attachSelectedIds.size > 0 ? (
            <Button
              fullWidth
              disabled={attachSending || send.isPending}
              onClick={() => void sendAttachSelected()}
            >
              {attachSending ? 'Sending…' : `Send (${attachSelectedIds.size})`}
            </Button>
          ) : undefined
        }
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
                    closeAttachSheet();
                    queueMicrotask(() => photoRef.current?.click());
                    return;
                  }
                  goAttachStep(step);
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
            searchPlaceholder="Search designs…"
            searchValue={attachQuery}
            onSearchChange={setAttachQuery}
            filterEmpty={filteredAttachProducts.length === 0}
            visibleIds={filteredAttachProducts.map((product) => product.id)}
            selectedIds={attachSelectedIds}
            onSelectAllToggle={() =>
              setAttachSelectedIds(nextIdSet(
                filteredAttachProducts.map((product) => product.id),
                attachSelectedIds,
              ))
            }
            onBack={() => goAttachStep('menu')}
            error={attachSendError}
            listPadForSend={attachSelectedIds.size > 0}
          >
            {filteredAttachProducts.map((product) => {
              const selected = attachSelectedIds.has(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={attachSending}
                  data-testid="attach-design-row"
                  onClick={() => toggleAttachId(product.id)}
                  className={cx(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                    selected
                      ? 'border-accent bg-accent/5'
                      : 'border-line bg-surface hover:bg-foam',
                  )}
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
              );
            })}
          </AttachList>
        ) : null}

        {attachStep === 'collection' ? (
          <AttachList
            loading={myCollections.isPending || myCollections.isFetching}
            empty="No collections yet."
            isEmpty={(myCollections.data ?? []).length === 0}
            searchPlaceholder="Search collections…"
            searchValue={attachQuery}
            onSearchChange={setAttachQuery}
            filterEmpty={filteredAttachCollections.length === 0}
            visibleIds={filteredAttachCollections.map((collection) => collection.id)}
            selectedIds={attachSelectedIds}
            onSelectAllToggle={() =>
              setAttachSelectedIds(nextIdSet(
                filteredAttachCollections.map((collection) => collection.id),
                attachSelectedIds,
              ))
            }
            onBack={() => goAttachStep('menu')}
            error={attachSendError}
            listPadForSend={attachSelectedIds.size > 0}
          >
            {filteredAttachCollections.map((collection) => {
              const selected = attachSelectedIds.has(collection.id);
              return (
                <button
                  key={collection.id}
                  type="button"
                  disabled={attachSending}
                  data-testid="attach-collection-row"
                  onClick={() => toggleAttachId(collection.id)}
                  className={cx(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                    selected
                      ? 'border-accent bg-accent/5'
                      : 'border-line bg-surface hover:bg-foam',
                  )}
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
              );
            })}
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
            searchPlaceholder="Search orders…"
            searchValue={attachQuery}
            onSearchChange={setAttachQuery}
            filterEmpty={filteredAttachOrders.length === 0}
            visibleIds={filteredAttachOrders.map((order) => order.id)}
            selectedIds={attachSelectedIds}
            onSelectAllToggle={() =>
              setAttachSelectedIds(nextIdSet(
                filteredAttachOrders.map((order) => order.id),
                attachSelectedIds,
              ))
            }
            onBack={() => goAttachStep('menu')}
            error={attachSendError}
            listPadForSend={attachSelectedIds.size > 0}
          >
            {filteredAttachOrders.map((order) => {
              const selected = attachSelectedIds.has(order.id);
              const short = order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
              return (
                <button
                  key={order.id}
                  type="button"
                  disabled={attachSending}
                  data-testid="attach-order-row"
                  onClick={() => toggleAttachId(order.id)}
                  className={cx(
                    'rounded-xl border px-3 py-2.5 text-left text-sm font-medium',
                    selected
                      ? 'border-accent bg-accent/5 text-ink'
                      : 'border-line text-ink hover:bg-foam',
                  )}
                >
                  <span className="font-semibold">Order #{short}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">
                    {order.counterpart.name} · {statusLabel(order.status)} · {order.items.length}{' '}
                    item{order.items.length === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
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
        {catalogForward ? (
          <div className="mb-3 flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">When they order</p>
            {(
              [
                {
                  value: OrderPathPreference.Direct,
                  label: 'Direct',
                  hint: 'Buyers order from the design owners',
                },
                {
                  value: OrderPathPreference.Handle,
                  label: 'I handle',
                  hint: 'Buyers order from me',
                },
              ] as const
            ).map((option) => {
              const selected = forwardPath === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={forward.isPending}
                  onClick={() => setForwardPath(option.value)}
                  className={cx(
                    'rounded-xl px-3 py-2.5 text-left',
                    selected ? 'bg-accent/10 ring-1 ring-accent' : 'border border-line',
                  )}
                >
                  <p className="text-sm font-semibold text-ink">{option.label}</p>
                  <p className="text-xs text-muted">{option.hint}</p>
                </button>
              );
            })}
          </div>
        ) : null}
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
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterEmpty,
  visibleIds,
  selectedIds,
  onSelectAllToggle,
  error,
  listPadForSend,
}: {
  loading: boolean;
  empty: string;
  onBack: () => void;
  children: ReactNode;
  isEmpty: boolean;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterEmpty: boolean;
  visibleIds: string[];
  selectedIds: Set<string>;
  onSelectAllToggle: () => void;
  error: string | null;
  listPadForSend: boolean;
}) {
  const selectAll = selectAllState(visibleIds, selectedIds);
  const showSelectChrome = !loading && !isEmpty && !filterEmpty && visibleIds.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        data-testid="attach-back"
        className="self-start rounded-full p-1.5 text-accent hover:bg-foam"
      >
        <BackIcon width={20} height={20} />
      </button>
      {!isEmpty ? (
        <TextInput
          data-testid="attach-search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          autoComplete="off"
          className="w-full"
        />
      ) : null}
      {showSelectChrome ? (
        <div
          data-testid="attach-select-all"
          className="flex items-center justify-between gap-2 px-0.5"
        >
          <p className="text-sm font-semibold text-ink">{selectedIds.size} selected</p>
          <button
            type="button"
            data-testid="attach-select-all-action"
            className="text-xs font-bold text-accent"
            onClick={onSelectAllToggle}
          >
            {selectAll.action === 'clear' ? 'Clear' : 'Select all'}
          </button>
        </div>
      ) : null}
      {error ? <InlineNotice message={error} /> : null}
      {loading ? (
        <LoadingBlock />
      ) : isEmpty ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : filterEmpty ? (
        <p className="py-6 text-center text-sm text-muted">No matches</p>
      ) : (
        <div
          className={cx(
            'ekum-no-scrollbar flex max-h-72 flex-col gap-1.5 overflow-y-auto',
            listPadForSend ? 'pb-2' : undefined,
          )}
        >
          {children}
        </div>
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

function InCardActor({ message, label }: { message: MessageView; label: string }) {
  const line = inCardSenderLine(message, label);
  if (!line) return null;
  return (
    <p className={cx('text-[11px] leading-tight', message.mine ? 'text-white/55' : 'text-muted')}>
      {line}
    </p>
  );
}

/** Compact living order reference for status pulses (tap → order). */
function OrderActivityChip({
  title,
  subtitle,
  actorLine,
  mine,
  createdAt,
  onOpen,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actorLine?: string | null;
  mine: boolean;
  createdAt: string;
  onOpen?: () => void;
}) {
  const className = cx(
    'w-full rounded-lg border border-line border-l-[3px] px-2.5 py-2 text-left',
    mine ? 'border-l-white/70 bg-accent/15' : 'border-l-accent bg-surface/90',
    onOpen && (mine ? 'hover:bg-accent/25 active:bg-accent/30' : 'hover:bg-foam active:bg-linen'),
  );
  const body = (
    <>
      {actorLine ? (
        <p className={cx('text-[11px] leading-tight', mine ? 'text-white/55' : 'text-muted')}>
          {actorLine}
        </p>
      ) : null}
      <p className={cx('text-sm font-bold tracking-tight', mine ? 'text-accent-dark' : 'text-accent')}>
        {title}
      </p>
      {subtitle ? (
        <p className={cx('mt-0.5 truncate text-sm', mine ? 'text-slate' : 'text-muted')}>
          {subtitle}
        </p>
      ) : null}
      <p className={cx('mt-1 text-right text-xs', mine ? 'text-muted' : 'text-muted')}>
        {timeAgo(createdAt)}
      </p>
    </>
  );
  if (!onOpen) {
    return <div className={className}>{body}</div>;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      {body}
    </button>
  );
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
  primaryAcceptQuoteId,
  viewerCompanyId,
  searchHighlight = '',
  senderLabel,
  onAcceptQuote,
  onAcceptLogged,
  accepting,
  onPaymentAction,
  paymentActing,
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
  primaryAcceptQuoteId: string | null;
  viewerCompanyId: string | null;
  searchHighlight?: string;
  senderLabel: string;
  onAcceptQuote: (orderId: string) => void;
  onAcceptLogged: (orderId: string) => void;
  accepting: boolean;
  onPaymentAction: (askId: string, action: 'paid' | 'received') => void;
  paymentActing: boolean;
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
  const hl = (text: string) => highlightSearchText(text, searchHighlight);
  const ref = message.reference;
  const facilitator = resolveForwardFacilitator({
    senderCompanyId: message.senderCompanyId,
    viewerCompanyId,
    ownerCompanyId: ref?.ownerCompanyId,
  });
  const meta =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  const sharePath = parseOrderPath(
    typeof meta?.orderPathPreference === 'string' ? meta.orderPathPreference : undefined,
  );
  if (ref?.available && ref.id && sharePath === 'handle') {
    rememberCatalogHandlerName(
      message.type === 'collection_card' ? 'collection' : 'product',
      ref.id,
      senderLabel,
    );
  }
  const collectionPath =
    ref?.available && ref.id
      ? withOrderPathQuery(
          withFacilitatorQuery(`/collections/${ref.id}`, facilitator),
          sharePath,
        )
      : undefined;
  const productPath =
    ref?.available && ref.id
      ? withOrderPathQuery(
          withFacilitatorQuery(`/explore/products/${ref.id}`, facilitator),
          sharePath,
        )
      : undefined;
  const orderGoesTo = catalogOrderGoesToLine({
    path: sharePath,
    ownerName: ref?.ownerCompanyName,
    handlerName: senderLabel,
    mine: message.mine,
  });
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
    message.type === 'payment_card' ||
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
          <div
            className={cx(
              'overflow-hidden rounded-2xl border border-line bg-surface',
              message.mine ? 'rounded-br-md' : 'rounded-bl-md',
            )}
          >
            {inCardSenderLine(message, senderLabel) ? (
              <div className="px-3 pt-2">
                <InCardActor message={message} label={senderLabel} />
              </div>
            ) : null}
            {reply ? (
              <div className="px-3">
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

  if (message.type === 'payment_card') {
    const payMeta = (message.metadata ?? {}) as { orderId?: string; amount?: number; status?: string };
    const orderId = payMeta.orderId;
    const paid = (ref?.status ?? payMeta.status) === 'paid';
    const askId = ref?.id;
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
        <div
          className={cx(
            'w-full rounded-2xl border border-line bg-surface px-3 py-2.5 text-left',
            message.mine ? 'rounded-br-md' : 'rounded-bl-md',
          )}
        >
          <button
            type="button"
            className="w-full text-left"
            onClick={() => {
              if (orderId) onOpenOrder(orderId);
            }}
          >
            <p className="text-sm font-semibold text-ink">
              {paid ? 'Payment · Paid' : ref?.name ?? 'Payment'}
            </p>
            {ref?.totalLabel && !paid ? (
              <p className="text-xs text-muted">{ref.totalLabel}</p>
            ) : null}
            <p className="mt-1 text-xs font-medium text-accent">View order →</p>
          </button>
          {!paid && askId && ref?.available && !selecting ? (
            <Button
              className="mt-2"
              disabled={paymentActing}
              onClick={() => onPaymentAction(askId, message.mine ? 'received' : 'paid')}
            >
              {message.mine ? 'Mark received' : 'Paid'}
            </Button>
          ) : null}
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
        <div
          className={cx(
            'rounded-2xl px-3.5 py-2 text-sm',
            message.mine
              ? 'rounded-br-md bg-accent text-white'
              : 'rounded-bl-md border border-line bg-foam text-ink',
          )}
        >
          <InCardActor message={message} label={senderLabel} />
          {reply ? (
            <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
          ) : null}
            <p className="whitespace-pre-wrap break-words">
              {message.body?.trim() ? hl(message.body) : 'Message'}
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
      </MessageChrome>
    );
  }

  const openOrder =
    isOrderLikeCard && ref?.available && ref.id ? () => onOpenOrder(ref.id) : undefined;
  const quoteAccept =
    message.type === 'rate' &&
    !message.mine &&
    ref?.canAcceptQuote &&
    ref.available &&
    message.id === primaryAcceptQuoteId
      ? () => onAcceptQuote(ref.id)
      : undefined;
  const olderQuotedOrder =
    message.type === 'rate' &&
    !message.mine &&
    ref?.canAcceptQuote &&
    ref.available &&
    message.id !== primaryAcceptQuoteId;
  const loggedAccept =
    (message.type === 'order_card' || isLegacyOrderNotice) &&
    !message.mine &&
    ref?.canAcceptLogged &&
    ref.available
      ? () => onAcceptLogged(ref.id)
      : undefined;
  const richOrder = isOrderLikeCard && isRichOrderChatMessage(message, ref);
  const cardActorLine =
    inCardSenderLine(message, senderLabel) ||
    (() => {
      const share = catalogShareSenderLabel({
        mine: message.mine,
        senderLabel,
        ownerCompanyId: ref?.ownerCompanyId,
        senderCompanyId: message.senderCompanyId,
      });
      if (share.endsWith('forwarded')) return share;
      return !message.mine ? share : null;
    })();

  if (isOrderLikeCard && orderCopy && !richOrder) {
    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={actions}
        className="max-w-[92%]"
      >
        <div className="flex flex-col gap-0.5">
          {reply ? (
            <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
          ) : null}
          <OrderActivityChip
            title={hl(orderCopy.title)}
            subtitle={hl(orderCopy.headline)}
            actorLine={inCardSenderLine(message, senderLabel)}
            mine={message.mine}
            createdAt={message.createdAt}
            onOpen={openOrder && !selecting ? openOrder : undefined}
          />
        </div>
      </MessageChrome>
    );
  }

  return (
    <MessageChrome
      messageId={message.id}
      mine={message.mine}
      selecting={selecting}
      selected={selected}
      highlighted={highlighted}
      onToggleSelect={onToggleSelect}
      actions={actions}
      className="w-fit max-w-[min(100%,9.5rem)]"
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
            'flex items-center gap-1.5 px-1.5 py-1',
            message.mine ? 'border-b border-white/20' : 'border-b border-line/70',
          )}
        >
          <TypeIcon
            width={12}
            height={12}
            className={cx('shrink-0', message.mine ? 'text-white' : 'text-accent')}
            aria-hidden
          />
          <p
            className={cx(
              'min-w-0 flex-1 truncate text-xs font-bold tracking-tight',
              message.mine ? 'text-white' : 'text-ink',
              isOrderLikeCard && 'whitespace-nowrap',
            )}
          >
            {orderCopy ? hl(orderCopy.title) : typeMeta.label}
          </p>
        </div>
        <div className="px-1.5 py-1.5">
          <InCardActor message={message} label={senderLabel} />
          {reply ? (
            <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
          ) : null}
          {message.type === 'order_card' || isLegacyOrderNotice ? (
            <TimelineCard
              mine={message.mine}
              title={hl(orderCopy?.headline ?? ref?.name ?? 'Order')}
              image={ref?.image}
              images={ref?.images}
              imageOverflow={
                ref?.itemCount != null && ref.images?.length
                  ? Math.max(0, ref.itemCount - ref.images.length)
                  : 0
              }
              lines={(orderCopy?.lines ?? []).map((line) => hl(line))}
              actionLabel={
                loggedAccept
                  ? accepting
                    ? 'Accepting…'
                    : 'Accept'
                  : ref?.available
                    ? 'View order →'
                    : undefined
              }
              onAction={loggedAccept ?? openOrder}
              actionStyle={loggedAccept ? 'primary' : 'link'}
              createdAt={message.createdAt}
            />
          ) : null}

          {message.type === 'rate' ? (
            <TimelineCard
              mine={message.mine}
              orderId={ref?.id}
              title={hl(orderCopy?.headline ?? ref?.totalLabel ?? 'Quote')}
              image={ref?.image}
              images={ref?.images}
              imageOverflow={
                ref?.itemCount != null && ref.images?.length
                  ? Math.max(0, ref.itemCount - ref.images.length)
                  : 0
              }
              lines={(orderCopy?.lines ?? []).map((line) => hl(line))}
              actionLabel={
                quoteAccept
                  ? accepting
                    ? 'Accepting…'
                    : 'Accept quote'
                  : olderQuotedOrder || ref?.available
                    ? 'View order →'
                    : undefined
              }
              onAction={quoteAccept ?? openOrder}
              actionStyle={quoteAccept ? 'primary' : 'link'}
              createdAt={message.createdAt}
            />
          ) : null}

          {message.type === 'collection_card' ? (
            <TimelineCard
              mine={message.mine}
              actorLine={cardActorLine}
              title={hl(
                  ref?.available
                    ? (ref.name ?? message.body ?? 'Collection')
                    : ref
                      ? 'Unavailable'
                      : (message.body?.trim() || 'Collection'),
                )}
                image={ref?.image}
                images={ref?.images}
                imageOverflow={
                  ref?.itemCount != null && ref.images?.length
                    ? Math.max(0, ref.itemCount - ref.images.length)
                    : 0
                }
                lines={[
                  orderGoesTo,
                  ref?.itemCount != null
                    ? `${ref.itemCount} design${ref.itemCount === 1 ? '' : 's'}`
                    : null,
                ]}
                actionLabel={ref?.available ? 'View collection →' : undefined}
                actionTo={collectionPath}
                actionStyle="link"
                createdAt={message.createdAt}
              />
          ) : null}

          {message.type === 'product_card' ? (
            <TimelineCard
              mine={message.mine}
              actorLine={cardActorLine}
              title={hl(
                  ref?.available
                    ? (ref.name ?? message.body ?? 'Design')
                    : ref
                      ? 'Unavailable'
                      : (message.body?.trim() || 'Design'),
                )}
                image={ref?.image}
                images={ref?.images}
                lines={[orderGoesTo ? hl(orderGoesTo) : null].filter(Boolean) as string[]}
                actionLabel={ref?.available ? 'View design →' : undefined}
                actionTo={productPath}
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
          ) : null}

          {!isLegacyOrderNotice &&
          !['order_card', 'rate', 'collection_card', 'product_card'].includes(message.type) ? (
            <TimelineCard
              mine={message.mine}
              title={hl(message.body?.trim() || 'Shared attachment')}
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
  actorLine,
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
  orderId,
}: {
  title: ReactNode;
  lines?: Array<ReactNode | null | undefined>;
  actorLine?: string | null;
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
  orderId?: string;
}) {
  const visibleLines = lines.filter((line) => {
    if (line == null) return false;
    if (typeof line === 'string') return Boolean(line.trim());
    return true;
  });
  const muted = mine ? 'text-white/75' : 'text-muted';
  const ink = mine ? 'text-white' : 'text-ink';
  const linkAction = mine ? 'text-white underline decoration-white/50' : 'text-accent';
  const gallery = images && images.length > 0 ? images : image ? [image] : [];

  const solidClass = mine
    ? 'mt-1.5 w-full rounded-lg border border-white/40 bg-white/15 px-2 py-1.5 text-center text-xs font-bold text-white'
    : 'mt-1.5 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-xs font-bold text-ink';
  const primaryClass =
    'mt-1.5 w-full rounded-lg bg-accent px-2 py-1.5 text-center text-xs font-bold text-white';

  const renderAction = () => {
    if (!actionLabel) return null;
    if (actionStyle === 'primary' && onAction) {
      return (
        <button
          type="button"
          data-card-action
          data-testid={
            actionLabel === 'Accept quote' && orderId
              ? `accept-quote-${orderId}`
              : actionLabel === 'Accept quote'
                ? 'accept-quote'
                : undefined
          }
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
          className={cx('mt-0.5 text-xs font-bold', linkAction)}
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
          className={cx('mt-0.5 self-start text-xs font-bold', linkAction)}
        >
          {actionLabel}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex w-[120px] max-w-full flex-col gap-0.5">
      {gallery.length > 0 ? (
        <div className="mb-0.5">
          <PhotoAlbum urls={gallery} overflowCount={imageOverflow} size="compact" />
        </div>
      ) : null}
      {actorLine ? (
        <p className={cx('text-[10px] leading-tight', mine ? 'text-white/55' : 'text-muted')}>
          {actorLine}
        </p>
      ) : null}
      <p className={cx('text-xs font-semibold tracking-tight', ink)}>{title}</p>
      {visibleLines.map((line, index) => (
        <p key={index} className={cx('text-[11px] font-medium leading-snug', muted)}>
          {line}
        </p>
      ))}
      {renderAction()}
      {secondaryAction ? (
        onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className={cx('mt-0.5 self-start text-xs font-medium', linkAction)}
          >
            {secondaryAction}
          </button>
        ) : (
          <p className={cx('mt-0.5 text-xs font-medium', muted)}>{secondaryAction}</p>
        )
      ) : null}
      <p className={cx('mt-0.5 text-right text-[10px]', muted)}>{timeAgo(createdAt)}</p>
    </div>
  );
}
