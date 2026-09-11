import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  CollectionView,
  CreateProductDto,
  CursorPage,
  MessageReference,
  MessageView,
  OrderView,
  ProductView,
  TeamMemberView,
  ThreadDetail,
  ThreadSummary,
} from '@ekum/domain-types';
import { photoUrlsFromMessage, voiceDurationMsFromMessage } from '@ekum/domain-types';
import { useCompanyId } from '@/lib/auth';
import { api, ApiError } from '@/lib/apiClient';
import { useTeamCaps } from '@/lib/teamCaps';
import { useToast } from '@/ui/Toast';
import { timeAgo } from '@/lib/format';
import { uploadAudio, uploadImage } from '@/lib/mediaUpload';
import { statusLabel } from '@/lib/status';
import { PageHeader } from '@/ui/PageHeader';
import { DiscardChangesSheet } from '@/ui/DiscardChangesSheet';
import { ConfirmActionSheet } from '@/ui/ConfirmActionSheet';
import { useDiscardGuard } from '@/ui/useDiscardGuard';
import { useLongPress } from '@/ui/useLongPress';
import { ThreadPeopleSheet } from '@/features/chats/ThreadPeopleSheet';
import { productImagesFromChatReference } from '@/features/chats/productImagesFromChatReference';
import { VoicePlayer } from '@/features/voice/VoicePlayer';
import {
  voiceHoldAfterRelease,
  voiceHoldAfterStart,
  voiceStageFromClip,
  type VoiceHoldPhase,
} from '@/features/voice/chatVoiceHold';
import { formatVoiceDuration, isUsableVoiceClip } from '@/features/voice/voiceCaps';
import { useVoiceRecorder } from '@/features/voice/useVoiceRecorder';
import type { VoiceRecording } from '@/features/voice/useVoiceRecorder';
import { stopAllVoicePlayback } from '@/features/voice/voicePlayback';
import { Avatar, Button, ErrorState, InlineNotice, LoadingBlock, Sheet, TextArea, TextInput, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import {
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CollectionIcon,
  FilterIcon,
  MicIcon,
  OrdersIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ProductIcon,
  SearchIcon,
  SendIcon,
} from '@/ui/icons';
import {
  MAX_FORWARD_BATCH,
  canCopyMessage,
  canDeleteForEveryone,
  canEditMessage,
  canForwardMessage,
  canReplyToMessage,
  copyTextForMessage,
  forwardPayload,
  replyComposerLabel,
} from './chatMessageActions';
import {
  resolveForwardFacilitator,
  withFacilitatorQuery,
  withOrderPathQuery,
  catalogOrderGoesToLine,
  rememberCatalogHandlerName,
} from '@/features/browse/forwardAttribution';
import { nextIdSet, selectAllState } from '@/features/browse/selectAllState';
import { ThreadForwardDock } from '@/features/chats/ThreadForwardDock';
import { ThreadSearchFilterMenu } from '@/features/chats/ThreadSearchFilterMenu';
import {
  dedupeOrderThreadMessages,
  isRichOrderChatMessage,
  primaryAcceptQuoteMessageId,
} from './orderCardCopy';
import { chatTypeMeta, inCardSenderLine, outboundMessageLabel } from './messagePreview';
import { threadVisibilityLabel, threadVisibilitySubtitle } from './threadVisibilityLabel';
import { PhotoAlbum } from './PhotoAlbum';
import { buildChatTradeCard, buildCollectionTradeCard, buildDesignTradeCard } from './chatTradeCard';
import { MSG_BUBBLE_CLASS, messageChromeBubblePad } from './messageChrome';
import { chatBubbleCorners } from './chatBubbleCorners';
import { paymentCardTitle } from './paymentCardCopy';
import { ChatTradeCard } from './ChatTradeCardView';
import {
  highlightSearchText,
  searchHitIdsNewestFirst,
  threadSearchScopeLabel,
  type ThreadMessageViewScope,
} from './threadMessageSearch';
import { filterByAttachSearch } from './attachShareSearch';
import { firstUnreadMessageId, unreadDividerLabel } from './threadOpenScroll';
import { createStickLatch, isNearBottom, scrollListToBottom } from './threadStickScroll';
import { chatComposerHeightPx } from './chatComposerHeight';

type AttachStep =
  | 'menu'
  | 'product'
  | 'collection'
  | 'order'
  | 'photo';

export function ThreadPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const refMessageId = searchParams.get('message');
  const companyId = useCompanyId();
  const { isOwner } = useTeamCaps();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canForward = (message: MessageView) => canForwardMessage(message);
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
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const pendingVoiceUrlRef = useRef<string | null>(null);
  const [pendingVoice, setPendingVoice] = useState<{
    blob: Blob;
    durationMs: number;
    previewUrl: string;
  } | null>(null);
  const stageVoiceClip = (clip: VoiceRecording | null, didRecord: boolean) => {
    const decision = voiceStageFromClip({
      clip: clip
        ? { durationMs: clip.durationMs, sizeBytes: clip.blob.size }
        : null,
      didRecord,
      isUsable: isUsableVoiceClip,
    });
    if (decision.kind === 'silent') return;
    if (decision.kind === 'too_short') {
      showToast('Hold longer to record.', 'danger');
      return;
    }
    if (decision.kind === 'failed') {
      showToast('Could not save voice. Try again.', 'danger');
      return;
    }
    if (!clip) return;
    setPendingVoice((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      const previewUrl = URL.createObjectURL(clip.blob);
      pendingVoiceUrlRef.current = previewUrl;
      return {
        blob: clip.blob,
        durationMs: clip.durationMs,
        previewUrl,
      };
    });
  };
  const discardPendingVoice = () => {
    stopAllVoicePlayback();
    setPendingVoice((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      pendingVoiceUrlRef.current = null;
      return null;
    });
  };
  const voiceRecorder = useVoiceRecorder({
    onMaxDuration: (clip) => stageVoiceClip(clip, true),
  });
  const voicePointerRef = useRef<{ x: number; y: number } | null>(null);
  const voiceHoldPhaseRef = useRef<VoiceHoldPhase>('idle');
  const voiceHoldingRef = useRef(false);
  const voiceCancelRequestedRef = useRef(false);
  const voiceDidRecordRef = useRef(false);
  useEffect(() => {
    return () => {
      if (pendingVoiceUrlRef.current) {
        URL.revokeObjectURL(pendingVoiceUrlRef.current);
        pendingVoiceUrlRef.current = null;
      }
    };
  }, []);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [forwardQueue, setForwardQueue] = useState<MessageView[]>([]);
  const [forwardDoneTo, setForwardDoneTo] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<MessageView | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MessageView | null>(null);
  const [replyTo, setReplyTo] = useState<MessageView | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [forwardProgress, setForwardProgress] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleClone, setPeopleClone] = useState<{ threadId: string; title: string | null } | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<'leave' | 'remove' | null>(null);
  const [morePos, setMorePos] = useState({ top: 0, right: 0 });
  const moreAnchorRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const searchFilterAnchorRef = useRef<HTMLButtonElement>(null);
  const [searchFilterOpen, setSearchFilterOpen] = useState(false);
  const [searchView, setSearchView] = useState<ThreadMessageViewScope>('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [hitIndex, setHitIndex] = useState(0);
  const highlightTimer = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stickLatch = useRef(createStickLatch(true)).current;
  const pendingBottomScroll = useRef<{ cancel: () => void } | null>(null);
  const openScrollDone = useRef(false);
  /** First paint of this thread visit — before mark-read clears unread. */
  const [openVisit, setOpenVisit] = useState<{
    threadId: string;
    lastReadAt: string | null;
    unreadCount: number;
  } | null>(null);

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
    // Background poll for new messages — not a hard reload every few seconds.
    staleTime: 10_000,
    refetchInterval: searchOpen || listView !== 'all' || listQ ? false : 10_000,
    refetchOnWindowFocus: !searchOpen,
    placeholderData: (previous) => previous,
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

  useLayoutEffect(() => {
    if (!moreOpen) return;
    const place = () => {
      const anchor = moreAnchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setMorePos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (morePanelRef.current?.contains(target)) return;
      if (moreAnchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', close, true);
    };
  }, [moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
  }, [id]);

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
    if (!thread.data || thread.data.id !== id || !companyId) return;
    setOpenVisit((prev) => {
      if (prev?.threadId === id) return prev;
      const mine = thread.data.participants.find((row) => row.companyId === companyId);
      return {
        threadId: id,
        lastReadAt: mine?.lastReadAt ?? null,
        unreadCount: thread.data.unreadCount,
      };
    });
  }, [thread.data, id, companyId]);

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

  const firstUnreadId = useMemo(() => {
    if (!openVisit || openVisit.threadId !== id || !companyId || openVisit.unreadCount <= 0) {
      return null;
    }
    return firstUnreadMessageId(ordered, {
      lastReadAt: openVisit.lastReadAt,
      viewerCompanyId: companyId,
    });
  }, [openVisit, ordered, companyId, id]);

  const searchHits = useMemo(
    () => (searchOpen && searchQ ? searchHitIdsNewestFirst(ordered, searchQ) : []),
    [searchOpen, searchQ, ordered],
  );

  useEffect(() => {
    setHitIndex(0);
  }, [searchQ, searchView, id]);

  useEffect(() => {
    openScrollDone.current = false;
    stickLatch.pin();
  }, [id, stickLatch]);

  useEffect(() => {
    if (refMessageId) stickLatch.unpin();
    else stickLatch.pin();
    setHighlightId(null);
    setSearchOpen(false);
    setSearchDraft('');
    setSearchQ('');
    setSearchView('all');
    setHitIndex(0);
  }, [id, refMessageId, stickLatch]);

  const pinToBottom = () => {
    const list = listRef.current;
    if (!list || !stickLatch.isStuck()) return;
    pendingBottomScroll.current?.cancel();
    stickLatch.beginProgrammatic();
    pendingBottomScroll.current = scrollListToBottom(list, {
      shouldStick: () => stickLatch.isStuck(),
    });
    // Release programmatic guard after both rAFs would have run.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stickLatch.endProgrammatic();
      });
    });
  };

  // One-shot open position (unread divider or newest). Independent of poll ticks.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !messages.isSuccess || refMessageId || openScrollDone.current) return;
    if (searchOpen) return;
    if (!openVisit || openVisit.threadId !== id) return;

    if (openVisit.unreadCount > 0 && firstUnreadId) {
      const divider = list.querySelector<HTMLElement>('[data-testid="unread-divider"]');
      const target =
        divider ??
        list.querySelector<HTMLElement>(`[data-message-id="${firstUnreadId}"]`);
      if (target) {
        stickLatch.unpin();
        pendingBottomScroll.current?.cancel();
        stickLatch.beginProgrammatic();
        target.scrollIntoView({ block: 'start' });
        requestAnimationFrame(() => stickLatch.endProgrammatic());
        openScrollDone.current = true;
        return;
      }
      if (messages.isFetching) return;
    }

    stickLatch.pin();
    pinToBottom();
    openScrollDone.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    refMessageId,
    searchOpen,
    openVisit,
    firstUnreadId,
    messages.isSuccess,
    messages.isFetching,
    ordered.length,
  ]);

  // Stick to newest while the trader is at the bottom; never on background poll alone.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !messages.isSuccess || refMessageId) return;

    if (searchOpen) {
      if (searchQ) return;
      if (searchView !== 'all' && stickLatch.isStuck()) {
        pinToBottom();
      }
      return;
    }

    if (!openScrollDone.current) return;
    if (!stickLatch.isStuck()) return;
    pinToBottom();
    // Only re-pin when the newest message changes (or search scope), not on every
    // page-length tweak from "load earlier" / background merge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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

    let lastScrollTop = list.scrollTop;
    let wheelArmed = false;

    const onWheel = () => {
      wheelArmed = true;
      stickLatch.setUserDriven(true);
    };
    const onTouchStart = () => stickLatch.setUserDriven(true);
    const onTouchEnd = () => stickLatch.setUserDriven(false);

    const onScroll = () => {
      const top = list.scrollTop;
      const goingUp = top < lastScrollTop - 1;
      lastScrollTop = top;

      // Any user scroll upward unpins immediately — don't wait for a large gap.
      if (goingUp && stickLatch.isStuck() && !stickLatch.isProgrammatic()) {
        stickLatch.unpin();
        pendingBottomScroll.current?.cancel();
        pendingBottomScroll.current = null;
      }

      const result = stickLatch.onScroll(isNearBottom(list));
      if (result === 'unpinned') {
        pendingBottomScroll.current?.cancel();
        pendingBottomScroll.current = null;
      }

      if (wheelArmed) {
        wheelArmed = false;
        stickLatch.setUserDriven(false);
      }
    };

    list.addEventListener('scroll', onScroll, { passive: true });
    list.addEventListener('wheel', onWheel, { passive: true });
    list.addEventListener('touchstart', onTouchStart, { passive: true });
    list.addEventListener('touchend', onTouchEnd, { passive: true });
    list.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      list.removeEventListener('scroll', onScroll);
      list.removeEventListener('wheel', onWheel);
      list.removeEventListener('touchstart', onTouchStart);
      list.removeEventListener('touchend', onTouchEnd);
      list.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [id, stickLatch]);

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
      stickLatch.pin();
      insertMessage(message);
      setDraft('');
      setReplyTo(null);
      setAttachOpen(false);
      setAttachStep('menu');
      setError(null);
      refreshMessages();
      pinToBottom();
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

  const viewRequestAllow = useMutation({
    mutationFn: (requestId: string) =>
      api.post(`/collection-view-requests/${requestId}/allow`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['collection-view-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['collection-view-grants'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not allow.'),
  });

  const viewRequestDeny = useMutation({
    mutationFn: (requestId: string) =>
      api.post(`/collection-view-requests/${requestId}/deny`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['collection-view-requests'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not deny.'),
  });

  const relistRequestAllow = useMutation({
    mutationFn: (requestId: string) => api.post(`/relist-requests/${requestId}/allow`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['relist-access'] });
      void queryClient.invalidateQueries({ queryKey: ['relist-grants'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not allow.'),
  });

  const relistRequestDeny = useMutation({
    mutationFn: (requestId: string) => api.post(`/relist-requests/${requestId}/deny`, {}),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['relist-access'] });
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not deny.'),
  });

  const starMessage = useMutation({
    mutationFn: ({ messageId, starred }: { messageId: string; starred: boolean }) =>
      starred
        ? api.post(`/messages/${messageId}/star`, {})
        : api.del(`/messages/${messageId}/star`),
    onSuccess: () => {
      refreshMessages();
      void queryClient.invalidateQueries({ queryKey: ['messages', 'starred'] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not update star.'),
  });

  const hideMessage = useMutation({
    mutationFn: (messageId: string) => api.post(`/threads/${id}/messages/${messageId}/hide`, {}),
    onSuccess: () => {
      refreshMessages();
      setDeleteTarget(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not delete.'),
  });

  const deleteEveryone = useMutation({
    mutationFn: (messageId: string) =>
      api.post(`/threads/${id}/messages/${messageId}/delete`, {}),
    onSuccess: () => {
      refreshMessages();
      setDeleteTarget(null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not delete.'),
  });

  const editMessage = useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api.patch(`/threads/${id}/messages/${messageId}`, { body }),
    onSuccess: () => {
      refreshMessages();
      setEditTarget(null);
      setEditDraft('');
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not edit.'),
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

  const setAlert = useMutation({
    mutationFn: (alertLevel: 'all' | 'muted') =>
      api.patch<ThreadDetail>(`/threads/${id}/alert`, { alertLevel }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['thread', id] });
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not mute.'),
  });

  const leaveThread = useMutation({
    mutationFn: () => api.post(`/threads/${id}/leave`, {}),
    onSuccess: () => {
      setConfirmAction(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate('/chats');
    },
    onError: (err) => {
      setConfirmAction(null);
      showToast(err instanceof ApiError ? err.message : 'Could not leave this chat.', 'danger');
    },
  });

  const archiveGroup = useMutation({
    mutationFn: () => api.post(`/threads/${id}/archive`, {}),
    onSuccess: () => {
      setConfirmAction(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate('/chats');
    },
    onError: (err) => {
      setConfirmAction(null);
      showToast(err instanceof ApiError ? err.message : 'Could not remove this group.', 'danger');
    },
  });

  const teamPeople = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<TeamMemberView[]>('/team/members'),
    enabled: peopleOpen && isOwner,
  });

  const onPeopleMutationError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.code === 'SAME_CHAT') {
      const details = err.details as { threadId?: string; title?: string | null } | undefined;
      if (details?.threadId) {
        setPeopleClone({ threadId: details.threadId, title: details.title ?? null });
        return;
      }
    }
    setPeopleClone(null);
    showToast(err instanceof ApiError ? err.message : fallback, 'danger');
  };

  const addMember = useMutation({
    mutationFn: (userId: string) => api.post<ThreadDetail>(`/threads/${id}/members`, { userIds: [userId] }),
    onSuccess: () => {
      setPeopleClone(null);
      void queryClient.invalidateQueries({ queryKey: ['thread', id] });
    },
    onError: (err) => onPeopleMutationError(err, 'Could not add them.'),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.post<ThreadDetail>(`/threads/${id}/members/remove`, { userIds: [userId] }),
    onSuccess: () => {
      setPeopleClone(null);
      void queryClient.invalidateQueries({ queryKey: ['thread', id] });
    },
    onError: (err) => onPeopleMutationError(err, 'Could not take them off.'),
  });

  const curate = useMutation({
    mutationFn: (reference: MessageReference) => {
      const images = productImagesFromChatReference(reference);
      const hadPhotoRef =
        Boolean(reference.image?.trim()) ||
        Boolean(reference.images?.some((url) => Boolean(url?.trim())));
      if (hadPhotoRef && images.length === 0) {
        throw new Error('Photo isn’t ready yet. Remove it and add it again.');
      }
      const dto: CreateProductDto = {
        name: (reference.name ?? 'Saved design').trim() || 'Saved design',
        images,
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
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save to your catalogue.',
      ),
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
      stickLatch.pin();
      setReplyTo(null);
      setDraft('');
      closeAttachSheet();
      setError(null);
      refreshMessages();
      pinToBottom();
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
    stickLatch.unpin();
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
      stickLatch.unpin();
      await messages.fetchNextPage();
    }
    return highlightMessage(messageId, persist);
  };

  const jumpToMessage = async (messageId: string) => {
    stickLatch.unpin();
    const ok = await ensureMessageHighlighted(messageId);
    if (!ok) setError('That message is not loaded in this chat view.');
  };

  const jumpToSearchHit = async (index: number) => {
    if (searchHits.length === 0) return;
    const next = ((index % searchHits.length) + searchHits.length) % searchHits.length;
    setHitIndex(next);
    const messageId = searchHits[next];
    if (!messageId) return;

    stickLatch.unpin();
    const ok = await ensureMessageHighlighted(messageId, true);
    if (!ok) setError('That message is not loaded in this chat view.');
  };

  useEffect(() => {
    if (!refMessageId || !id) return;
    let cancelled = false;
    stickLatch.unpin();

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
    setSearchFilterOpen(false);
    setSearchOpen(false);
    setSearchDraft('');
    setSearchQ('');
    setSearchView('all');
    setHitIndex(0);
    setHighlightId(null);
    stickLatch.pin();
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
      if (next.has(messageId)) {
        next.delete(messageId);
        if (next.size === 0) {
          setSelecting(false);
        }
        return next;
      }
      if (next.size >= MAX_FORWARD_BATCH) {
        showToast(`You can forward up to ${MAX_FORWARD_BATCH} at a time.`, 'danger');
        return prev;
      }
      next.add(messageId);
      return next;
    });
  };

  const cancelForwardSelect = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const openMultiForward = () => {
    const queue = ordered
      .filter((message) => selectedIds.has(message.id) && canForward(message))
      .slice(0, MAX_FORWARD_BATCH);
    if (queue.length === 0) return;
    setForwardQueue(queue);
    setSelecting(false);
    setSelectedIds(new Set());
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

  const sendPendingVoice = async () => {
    if (!pendingVoice) return;
    const clip = pendingVoice;
    stopAllVoicePlayback();
    setUploadingVoice(true);
    setUploadProgress('Sending voice…');
    try {
      const uploaded = await uploadAudio(clip.blob);
      await send.mutateAsync({
        type: 'voice',
        body: uploaded.url,
        metadata: { durationMs: clip.durationMs, mediaId: uploaded.mediaId },
        replyToMessageId: replyTo?.id,
      });
      discardPendingVoice();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send voice.');
    } finally {
      setUploadingVoice(false);
      setUploadProgress(null);
    }
  };

  const onVoicePointerDown = async (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pendingVoice || uploadingVoice || send.isPending) return;
    if (voiceHoldPhaseRef.current !== 'idle') return;
    voiceHoldingRef.current = true;
    voiceCancelRequestedRef.current = false;
    voiceDidRecordRef.current = false;
    voiceHoldPhaseRef.current = 'arming';
    voicePointerRef.current = { x: event.clientX, y: event.clientY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore — older browsers */
    }
    const err = await voiceRecorder.start();
    const next = voiceHoldAfterStart({
      stillHolding: voiceHoldingRef.current,
      startError: err,
      cancelRequested: voiceCancelRequestedRef.current,
    });
    if (next === 'error') {
      voiceHoldPhaseRef.current = 'idle';
      voiceHoldingRef.current = false;
      if (err) showToast(err, 'danger');
      return;
    }
    if (next === 'cancel') {
      voiceHoldPhaseRef.current = 'idle';
      voiceHoldingRef.current = false;
      await voiceRecorder.cancel();
      return;
    }
    voiceDidRecordRef.current = true;
    voiceHoldPhaseRef.current = 'recording';
    if (next === 'stop_now') {
      voiceHoldPhaseRef.current = 'stopping';
      const clip = await voiceRecorder.stopAndGet();
      voiceHoldPhaseRef.current = 'idle';
      stageVoiceClip(clip, true);
    }
  };

  const onVoicePointerUp = async (event: PointerEvent<HTMLButtonElement>) => {
    const start = voicePointerRef.current;
    voicePointerRef.current = null;
    voiceHoldingRef.current = false;
    const slideCancel = !!(start && start.x - event.clientX > 72);
    const action = voiceHoldAfterRelease({
      phase: voiceHoldPhaseRef.current,
      slideCancel,
    });
    if (action === 'noop' || action === 'defer_to_start') return;
    if (action === 'cancel') {
      voiceCancelRequestedRef.current = true;
      voiceHoldPhaseRef.current = 'idle';
      await voiceRecorder.cancel();
      return;
    }
    const didRecord = voiceDidRecordRef.current;
    // Mark stopping before await so a following pointercancel is a no-op.
    voiceHoldPhaseRef.current = 'stopping';
    const clip = await voiceRecorder.stopAndGet();
    voiceHoldPhaseRef.current = 'idle';
    stageVoiceClip(clip, didRecord);
  };

  const onVoicePointerCancel = async (event: PointerEvent<HTMLButtonElement>) => {
    // iOS often fires cancel after a normal release — same as up, not discard.
    const start = voicePointerRef.current;
    voicePointerRef.current = null;
    voiceHoldingRef.current = false;
    const slideCancel = !!(start && start.x - event.clientX > 72);
    const action = voiceHoldAfterRelease({
      phase: voiceHoldPhaseRef.current,
      slideCancel,
    });
    if (action === 'noop' || action === 'defer_to_start') return;
    if (action === 'cancel') {
      voiceCancelRequestedRef.current = true;
      voiceHoldPhaseRef.current = 'idle';
      await voiceRecorder.cancel();
      return;
    }
    const didRecord = voiceDidRecordRef.current;
    voiceHoldPhaseRef.current = 'stopping';
    const clip = await voiceRecorder.stopAndGet();
    voiceHoldPhaseRef.current = 'idle';
    stageVoiceClip(clip, didRecord);
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
          uploadingVoice ||
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

  useLayoutEffect(() => {
    const el = draftInputRef.current;
    if (!el) return;
    el.style.height = '0px';
    const measured = el.scrollHeight;
    const next = chatComposerHeightPx(measured);
    el.style.height = `${next}px`;
    // Keep scrollable when capped; chrome hidden via ekum-no-scrollbar.
    el.style.overflowY = measured > next ? 'auto' : 'hidden';
  }, [draft]);

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
  const counterpartId = detail.counterpart?.id;
  const title = detail.title ?? detail.counterpart?.name ?? 'Conversation';
  const canCompose = detail.state === 'active';
  const headerSubtitle =
    detail.type === 'group'
      ? `${detail.participantCount} businesses`
      : threadVisibilitySubtitle(
          threadVisibilityLabel(detail),
          detail.counterpart?.city,
        );

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
      <DiscardChangesSheet
        open={discard.confirmOpen}
        onCancel={discard.cancelLeave}
        onLeave={discard.confirmLeave}
      />
      <ConfirmActionSheet
        open={confirmAction === 'leave'}
        title="Leave this chat?"
        body="Off your inbox. Others stay."
        confirmLabel="Leave"
        testId="thread-leave-confirm"
        busy={leaveThread.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => leaveThread.mutate()}
      />
      <ConfirmActionSheet
        open={confirmAction === 'remove'}
        title="Remove this group?"
        body="Gone from your inbox. Other shops keep it."
        confirmLabel="Remove group"
        testId="thread-remove-confirm"
        busy={archiveGroup.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => archiveGroup.mutate()}
      />
      <Sheet
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit message"
        footer={
          <Button
            fullWidth
            disabled={!editDraft.trim() || editMessage.isPending}
            onClick={() => {
              if (!editTarget) return;
              editMessage.mutate({ messageId: editTarget.id, body: editDraft.trim() });
            }}
          >
            {editMessage.isPending ? 'Saving…' : 'Save'}
          </Button>
        }
      >
        <TextArea
          value={editDraft}
          onChange={(event) => setEditDraft(event.target.value)}
          rows={4}
        />
      </Sheet>
      <Sheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete message?"
        footer={
          <div className="flex flex-col gap-2">
            {deleteTarget && canDeleteForEveryone(deleteTarget) ? (
              <Button
                fullWidth
                disabled={deleteEveryone.isPending || hideMessage.isPending}
                onClick={() => deleteTarget && deleteEveryone.mutate(deleteTarget.id)}
              >
                Delete for everyone
              </Button>
            ) : null}
            <Button
              fullWidth
              variant="secondary"
              disabled={deleteEveryone.isPending || hideMessage.isPending}
              onClick={() => deleteTarget && hideMessage.mutate(deleteTarget.id)}
            >
              Delete for me
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          Delete for me hides it only on your side. Delete for everyone removes it for all
          (your messages, within 1 hour).
        </p>
      </Sheet>
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
                stickLatch.pin();
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
              ref={moreAnchorRef}
              type="button"
              data-testid="thread-more"
              aria-label="More"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((open) => !open)}
              className={cx(
                'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                moreOpen ? 'bg-foam text-ink' : 'text-muted hover:bg-foam hover:text-ink',
              )}
            >
              <MoreHorizontalIcon width={20} height={20} />
            </button>
          </div>
        }
      />

      {moreOpen && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-[60] cursor-default bg-ink/15"
                onClick={() => setMoreOpen(false)}
              />
              <div
                ref={morePanelRef}
                role="menu"
                data-testid="thread-more-menu"
                className="fixed z-[61] min-w-[11rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
                style={{ top: morePos.top, right: morePos.right }}
              >
                <button
                  type="button"
                  role="menuitem"
                  data-testid="thread-pin"
                  disabled={pinThread.isPending}
                  className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                  onClick={() => {
                    setMoreOpen(false);
                    pinThread.mutate(!detail.pinned);
                  }}
                >
                  {detail.pinned ? 'Unpin chat' : 'Pin chat'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="thread-mute"
                  disabled={setAlert.isPending}
                  className="flex w-full border-t border-line/70 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                  onClick={() => {
                    setMoreOpen(false);
                    setAlert.mutate(detail.alertLevel === 'muted' ? 'all' : 'muted');
                  }}
                >
                  {detail.alertLevel === 'muted' ? 'Unmute' : 'Mute'}
                </button>
                {detail.canManagePeople ? (
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="thread-people"
                    className="flex w-full border-t border-line/70 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70"
                    onClick={() => {
                      setMoreOpen(false);
                      setPeopleOpen(true);
                    }}
                  >
                    Team on chat
                  </button>
                ) : null}
                {detail.canLeave ? (
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="thread-leave"
                    disabled={leaveThread.isPending}
                    className="flex w-full border-t border-line/70 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70 disabled:opacity-40"
                    onClick={() => {
                      setMoreOpen(false);
                      setConfirmAction('leave');
                    }}
                  >
                    Leave
                  </button>
                ) : null}
                {detail.canRemoveGroup ? (
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="thread-remove-group"
                    disabled={archiveGroup.isPending}
                    className="flex w-full border-t border-line/70 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-danger hover:bg-foam/70 disabled:opacity-40"
                    onClick={() => {
                      setMoreOpen(false);
                      setConfirmAction('remove');
                    }}
                  >
                    Remove group
                  </button>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}

      {searchOpen ? (
        <div data-testid="thread-search-band" className="mb-2 flex shrink-0 flex-col gap-1.5">
          <ListSearchRow
            search={
              <TextInput
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
                aria-label="Search in chat"
                autoComplete="off"
                className="w-full"
              />
            }
            action={
              <ListSquareButton
                ref={searchFilterAnchorRef}
                data-testid="thread-search-filter"
                data-filter-active={searchView !== 'all' ? 'true' : 'false'}
                aria-label="Filter"
                aria-expanded={searchFilterOpen}
                aria-haspopup="menu"
                aria-pressed={searchView !== 'all'}
                active={searchView !== 'all' || searchFilterOpen}
                onClick={() => setSearchFilterOpen((open) => !open)}
              >
                <FilterIcon
                  width={20}
                  height={20}
                  className={searchView !== 'all' || searchFilterOpen ? 'text-white' : undefined}
                />
              </ListSquareButton>
            }
          />
          <ThreadSearchFilterMenu
            open={searchFilterOpen}
            onClose={() => setSearchFilterOpen(false)}
            anchorRef={searchFilterAnchorRef}
            value={searchView}
            onChange={(scope) => {
              setSearchView(scope);
              stickLatch.pin();
            }}
          />
          {searchQ ? (
            <div className="flex items-center gap-2 px-0.5">
              <button
                type="button"
                className="text-xs font-bold tracking-tight text-accent"
                onClick={() => {
                  setSearchDraft('');
                  setSearchQ('');
                  stickLatch.pin();
                }}
              >
                Clear
              </button>
              <span
                data-testid="thread-search-hit-count"
                className="text-xs font-semibold tabular-nums text-muted"
              >
                {searchHits.length === 0 ? '0 of 0' : `${hitIndex + 1} of ${searchHits.length}`}
              </span>
              <span className="flex-1" />
              <button
                type="button"
                aria-label="Older match"
                disabled={searchHits.length === 0}
                className="rounded-full p-1.5 text-slate disabled:opacity-35"
                onClick={() => void jumpToSearchHit(hitIndex + 1)}
              >
                <ChevronUpIcon width={18} height={18} />
              </button>
              <button
                type="button"
                aria-label="Newer match"
                disabled={searchHits.length === 0}
                className="rounded-full p-1.5 text-slate disabled:opacity-35"
                onClick={() => void jumpToSearchHit(hitIndex - 1)}
              >
                <ChevronDownIcon width={18} height={18} />
              </button>
            </div>
          ) : null}
          {searchView !== 'all' ? (
            <div className="flex flex-wrap items-center gap-x-3 px-0.5">
              <p className="text-xs font-medium text-muted">
                Showing <span className="text-ink">{threadSearchScopeLabel(searchView)}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchView('all');
                  stickLatch.pin();
                }}
                className="inline-flex min-h-11 items-center text-xs font-bold tracking-tight text-accent"
              >
                Clear
              </button>
            </div>
          ) : null}
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
                    stickLatch.unpin();
                    void messages.fetchNextPage();
                  }}
                >
                  {messages.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            ) : null}
            {ordered.map((message) => (
              <div key={message.id}>
                {firstUnreadId === message.id && openVisit && openVisit.unreadCount > 0 ? (
                  <div
                    className="mb-2.5 flex items-center gap-2 py-1"
                    data-testid="unread-divider"
                    role="separator"
                    aria-label={unreadDividerLabel(openVisit.unreadCount)}
                  >
                    <span className="h-px flex-1 bg-line" />
                    <span className="shrink-0 text-[11px] font-medium text-muted">
                      {unreadDividerLabel(openVisit.unreadCount)}
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                ) : null}
                <TimelineItem
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
                onOpenCollection={(collectionId) => navigate(`/collections/${collectionId}`)}
                onViewRequestAllow={(requestId) => viewRequestAllow.mutate(requestId)}
                onViewRequestDeny={(requestId) => viewRequestDeny.mutate(requestId)}
                viewRequestActing={viewRequestAllow.isPending || viewRequestDeny.isPending}
                onRelistRequestAllow={(requestId) => relistRequestAllow.mutate(requestId)}
                onRelistRequestDeny={(requestId) => relistRequestDeny.mutate(requestId)}
                relistRequestActing={
                  relistRequestAllow.isPending || relistRequestDeny.isPending
                }
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
                          onCopy: canCopyMessage(message)
                            ? () => {
                                const text = copyTextForMessage(message);
                                if (!text) return;
                                void navigator.clipboard.writeText(text).then(
                                  () => showToast('Copied', 'success'),
                                  () => showToast('Could not copy', 'danger'),
                                );
                              }
                            : undefined,
                          onStar: message.deletedForEveryone
                            ? undefined
                            : () =>
                                starMessage.mutate({
                                  messageId: message.id,
                                  starred: !message.starred,
                                }),
                          starred: Boolean(message.starred),
                          onEdit: canEditMessage(message)
                            ? () => {
                                setEditTarget(message);
                                setEditDraft(message.body ?? '');
                              }
                            : undefined,
                          onSelect: canForward(message)
                            ? () => startSelect(message)
                            : undefined,
                          onDelete: message.deletedForEveryone
                            ? undefined
                            : () => setDeleteTarget(message),
                        }
                      : undefined
                  }
                />
              </div>
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
                      : searchOpen && searchView === 'starred'
                        ? 'No starred messages'
                      : searchOpen && searchView === 'all'
                        ? 'Type to search this chat'
                        : detail.counterpart?.name
                          ? `Say hello to ${detail.counterpart.name}.`
                          : 'Say hello.'}
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

      <ThreadForwardDock
        open={selecting && selectedIds.size > 0}
        count={selectedIds.size}
        pending={forward.isPending}
        onCancel={cancelForwardSelect}
        onForward={openMultiForward}
      />

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
          {voiceRecorder.recording ? (
            <p className="px-1 text-center text-xs text-muted">
              Recording {formatVoiceDuration(voiceRecorder.elapsedMs)} · slide left to cancel
            </p>
          ) : null}
          {pendingVoice ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-surface px-2 py-1.5">
              <VoicePlayer
                src={pendingVoice.previewUrl}
                durationMs={pendingVoice.durationMs}
                className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0"
              />
              <button
                type="button"
                aria-label="Delete recording"
                data-testid="chat-voice-discard"
                disabled={uploadingVoice}
                onClick={discardPendingVoice}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-foam hover:text-ink disabled:opacity-40"
              >
                ×
              </button>
              <button
                type="button"
                aria-label="Send voice"
                data-testid="chat-voice-send"
                disabled={uploadingVoice || send.isPending}
                onClick={() => void sendPendingVoice()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40"
              >
                <SendIcon width={18} height={18} />
              </button>
            </div>
          ) : (
          <div className="flex min-w-0 flex-1 items-end gap-2 rounded-2xl border border-line bg-surface px-2 py-1.5">
            <button
              type="button"
              aria-label="Attach"
              data-testid="chat-attach"
              onClick={openAttach}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent hover:bg-foam"
            >
              <PlusIcon width={20} height={20} />
            </button>
            <textarea
              data-testid="chat-composer"
              ref={draftInputRef}
              rows={1}
              enterKeyHint="send"
              className="ekum-no-scrollbar max-h-[120px] min-h-9 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-1 py-2 text-sm leading-5 text-ink shadow-none outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
              placeholder="Message…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
                  return;
                }
                event.preventDefault();
                if (!draft.trim() || send.isPending) return;
                send.mutate({
                  type: 'text',
                  body: draft.trim(),
                  replyToMessageId: replyTo?.id,
                });
              }}
            />
            {draft.trim() ? (
              <button
                type="submit"
                aria-label="Send"
                data-testid="chat-send"
                disabled={send.isPending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40"
              >
                <SendIcon width={18} height={18} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Hold to record voice"
                data-testid="chat-voice"
                disabled={uploadingVoice || send.isPending}
                className={cx(
                  'flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-xl text-white disabled:opacity-40',
                  voiceRecorder.recording ? 'bg-danger' : 'bg-accent',
                )}
                onPointerDown={(e) => void onVoicePointerDown(e)}
                onPointerUp={(e) => void onVoicePointerUp(e)}
                onPointerCancel={(e) => void onVoicePointerCancel(e)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <MicIcon width={18} height={18} />
              </button>
            )}
          </div>
          )}
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
        onBack={attachStep !== 'menu' ? () => goAttachStep('menu') : undefined}
        backTestId="attach-back"
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
                  iconClass: 'bg-kind-design-soft text-kind-design',
                },
                {
                  step: 'collection' as const,
                  label: 'Collection',
                  subtitle: 'Share a collection',
                  Icon: CollectionIcon,
                  iconClass: 'bg-kind-collection-soft text-kind-collection',
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
                  iconClass: 'bg-kind-order-soft text-kind-order',
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
        {forwardThreads.isLoading ? (
          <LoadingBlock />
        ) : (
          <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
            {(forwardThreads.data?.results ?? [])
              .filter((row) => row.id !== id)
              .map((row) => {
                const chatTitle = row.title ?? row.counterpart?.name ?? 'Conversation';
                const visLine = threadVisibilitySubtitle(
                  threadVisibilityLabel(row),
                  row.counterpart?.city,
                );
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
                      {visLine ? (
                        <span className="block truncate text-[11px] text-muted">
                          {visLine}
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

      <ThreadPeopleSheet
        open={peopleOpen}
        onClose={() => {
          setPeopleOpen(false);
          setPeopleClone(null);
        }}
        people={detail.people ?? []}
        team={teamPeople.data ?? []}
        busy={addMember.isPending || removeMember.isPending}
        onAdd={(userId) => addMember.mutate(userId)}
        onRemove={(userId) => removeMember.mutate(userId)}
        existingChat={peopleClone}
        onOpenExisting={(threadId) => {
          setPeopleOpen(false);
          setPeopleClone(null);
          navigate(`/chats/${threadId}`);
        }}
      />
    </div>
  );
}

function AttachList({
  loading,
  empty,
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

function InCardActor({ message, label }: { message: MessageView; label: string }) {
  const line = inCardSenderLine(message, label);
  if (!line) return null;
  return (
    <p className={cx('text-[11px] leading-tight', message.mine ? 'text-white/55' : 'text-muted')}>
      {line}
    </p>
  );
}

function ReplyQuote({
  preview,
  mine,
  onJump,
}: {
  preview: NonNullable<MessageView['replyTo']>;
  /** True when nested inside a solid-accent text bubble (not on white trade cards). */
  mine: boolean;
  onJump?: () => void;
}) {
  const className = cx(
    'mb-1.5 w-full rounded-lg border-l-2 px-2 py-1.5 text-left text-sm',
    mine
      ? 'border-white/50 bg-white/10 text-white/85'
      : 'border-accent bg-surface text-muted',
    onJump && (mine ? 'hover:bg-white/20 active:bg-white/25' : 'hover:bg-canvas active:bg-canvas'),
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
  onCopy?: () => void;
  onStar?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  starred?: boolean;
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
  /** Chevron on accent fill (white) vs light/surface fill (muted). */
  actionsOnAccent,
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
  actionsOnAccent?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasActions = Boolean(
    actions?.onReply ||
      actions?.onForward ||
      actions?.onSelect ||
      actions?.onCopy ||
      actions?.onStar ||
      actions?.onEdit ||
      actions?.onDelete,
  );
  const chevronOnAccent = actionsOnAccent ?? mine;
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
        className={cx(
          'relative',
          messageChromeBubblePad(hasActions && !selecting),
          className,
        )}
        {...longPress}
        onClick={selecting && onToggleSelect ? () => onToggleSelect() : undefined}
      >
        {children}
        {hasActions && !selecting ? (
          <button
            type="button"
            aria-label="Message actions"
            aria-expanded={menuOpen}
            data-testid="message-actions"
            data-card-action
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className={cx(
              'absolute right-1 top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full',
              chevronOnAccent
                ? 'text-white/90 hover:bg-white/20'
                : 'text-muted hover:bg-black/[0.06]',
            )}
          >
            <ChevronDownIcon width={16} height={16} />
          </button>
        ) : null}
        {hasActions && !selecting && menuOpen ? (
          <div
            role="menu"
            data-testid="message-actions-menu"
            className="absolute right-1 top-8 z-30 min-w-[8.5rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-soft"
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
            {actions?.onCopy ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onCopy);
                }}
              >
                Copy
              </button>
            ) : null}
            {actions?.onStar ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onStar);
                }}
              >
                {actions.starred ? 'Unstar' : 'Star'}
              </button>
            ) : null}
            {actions?.onEdit ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onEdit);
                }}
              >
                Edit
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
            {actions?.onDelete ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full border-t border-line/70 px-3 py-2.5 text-left text-sm font-semibold text-danger hover:bg-foam"
                onClick={(event) => {
                  event.stopPropagation();
                  run(actions.onDelete);
                }}
              >
                Delete
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
  onOpenCollection,
  onViewRequestAllow,
  onViewRequestDeny,
  viewRequestActing = false,
  onRelistRequestAllow,
  onRelistRequestDeny,
  relistRequestActing = false,
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
  onOpenCollection?: (collectionId: string) => void;
  onViewRequestAllow?: (requestId: string) => void;
  onViewRequestDeny?: (requestId: string) => void;
  viewRequestActing?: boolean;
  onRelistRequestAllow?: (requestId: string) => void;
  onRelistRequestDeny?: (requestId: string) => void;
  relistRequestActing?: boolean;
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
  /** Pack shares always go through the sharer; legacy meta.orderPathPreference ignored. */
  const sharePath =
    message.type === 'collection_card' ? ('handle' as const) : undefined;
  if (ref?.available && ref.id && message.type === 'collection_card') {
    rememberCatalogHandlerName('collection', ref.id, senderLabel);
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
        actionsOnAccent={false}
        className="max-w-[85%]"
      >
        <div className="flex flex-col gap-0.5">
          <div
            className={cx(
              MSG_BUBBLE_CLASS,
              'overflow-hidden border border-line bg-surface',
              chatBubbleCorners(message.mine),
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

  if (message.type === 'voice' && message.body?.trim()) {
    const durationMs = voiceDurationMsFromMessage(message.metadata);
    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={actions}
        actionsOnAccent={false}
        className="max-w-[85%]"
      >
        <div
          className={cx(
            MSG_BUBBLE_CLASS,
            'flex flex-col gap-1 border border-line bg-surface px-3 py-2',
            chatBubbleCorners(message.mine),
          )}
        >
          {inCardSenderLine(message, senderLabel) ? (
            <InCardActor message={message} label={senderLabel} />
          ) : null}
          {reply ? <ReplyQuote preview={reply} mine={false} onJump={onJumpToReply} /> : null}
          <VoicePlayer src={message.body} durationMs={durationMs} />
          <p className="text-right text-xs text-muted">{timeAgo(message.createdAt)}</p>
        </div>
      </MessageChrome>
    );
  }

  if (
    (message.type === 'system' || message.type === 'product_card') &&
    meta?.kind === 'relist_request' &&
    typeof meta.requestId === 'string'
  ) {
    const status = typeof meta.status === 'string' ? meta.status : 'pending';
    const isTarget =
      Boolean(viewerCompanyId) && viewerCompanyId === meta.targetCompanyId;
    const pending = status === 'pending';
    const allowed = status === 'allowed';
    const names = Array.isArray(meta.productNames)
      ? (meta.productNames as unknown[]).filter((n): n is string => typeof n === 'string')
      : [];
    const designLabel =
      names.length === 1
        ? names[0]!
        : names.length > 1
          ? `${names.length} designs`
          : ref?.name?.trim() || 'design';
    const askLine = pending
      ? isTarget
        ? `Wants to put ${designLabel} in their pack`
        : 'Waiting for Allow'
      : allowed
        ? 'You can put this in your pack'
        : null;
    const model = buildDesignTradeCard(message, ref, senderLabel, null, {
      productPath: undefined,
    });
    if (names.length === 1) {
      model.primary = names[0]!.trim();
    } else if (names.length > 1) {
      model.primary = `${names.length} designs`;
    }
    model.who = senderLabel.trim() || null;
    model.details = [
      ...(askLine ? [askLine] : []),
      ...model.details.filter((line) => line !== askLine),
    ];
    model.note = undefined;
    model.secondaryAction = undefined;
    model.action = undefined;
    if (pending && isTarget && !selecting) {
      model.actionRow = [
        {
          label: relistRequestActing ? '…' : 'Deny',
          onClick: () => {
            if (relistRequestActing) return;
            onRelistRequestDeny?.(meta.requestId as string);
          },
          style: 'link',
          emphasis: 'quiet',
          testId: 'relist-request-deny',
        },
        {
          label: relistRequestActing ? '…' : 'Allow',
          onClick: () => {
            if (relistRequestActing) return;
            onRelistRequestAllow?.(meta.requestId as string);
          },
          style: 'link',
          emphasis: 'accent',
          testId: 'relist-request-allow',
        },
      ];
    }

    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={undefined}
        className="max-w-[85%]"
      >
        <ChatTradeCard
          model={model}
          highlight={hl}
          onOpen={undefined}
        />
      </MessageChrome>
    );
  }

  if (
    (message.type === 'system' || message.type === 'collection_card') &&
    meta?.kind === 'collection_view_request' &&
    typeof meta.requestId === 'string'
  ) {
    const status = typeof meta.status === 'string' ? meta.status : 'pending';
    const isTarget =
      Boolean(viewerCompanyId) &&
      (viewerCompanyId === meta.targetCompanyId ||
        viewerCompanyId === ref?.ownerCompanyId);
    const pending = status === 'pending';
    const allowed = status === 'allowed';
    const rawBody = message.body?.trim() || '';
    // Default ask bodies repeat the pack name — show short line; keep a real typed note.
    const isDefaultAskBody = /^asked to see\b/i.test(rawBody);
    const askLine = pending
      ? isDefaultAskBody || !rawBody
        ? isTarget
          ? 'Asked to see this pack'
          : 'Waiting for Allow'
        : rawBody
      : allowed
        ? isDefaultAskBody || /^allowed\b/i.test(rawBody) || !rawBody
          ? 'You can look through this pack'
          : rawBody
        : null;
    const model = buildCollectionTradeCard(message, ref, senderLabel, null, {
      collectionPath:
        allowed && typeof meta.collectionId === 'string'
          ? `/collections/${meta.collectionId}`
          : undefined,
    });
    // Ask is not a forward — same density as View collection cards.
    if (typeof meta.collectionName === 'string' && meta.collectionName.trim()) {
      model.primary = meta.collectionName.trim();
    }
    model.who = senderLabel.trim() || null;
    model.details = [
      ...(askLine ? [askLine] : []),
      ...model.details.filter((line) => line !== askLine),
    ];
    model.note = undefined;
    if (pending && isTarget && !selecting) {
      model.action = undefined;
      model.actionRow = [
        {
          label: viewRequestActing ? '…' : 'Deny',
          onClick: () => {
            if (viewRequestActing) return;
            onViewRequestDeny?.(meta.requestId as string);
          },
          style: 'link',
          emphasis: 'quiet',
          testId: 'collection-view-deny',
        },
        {
          label: viewRequestActing ? '…' : 'Allow',
          onClick: () => {
            if (viewRequestActing) return;
            onViewRequestAllow?.(meta.requestId as string);
          },
          style: 'link',
          emphasis: 'accent',
          testId: 'collection-view-allow',
        },
      ];
    } else if (!allowed) {
      model.action = undefined;
    }

    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={undefined}
        className="max-w-[85%]"
      >
        <ChatTradeCard
          model={model}
          highlight={hl}
          onOpen={
            allowed && typeof meta.collectionId === 'string' && !selecting
              ? () => onOpenCollection?.(meta.collectionId as string)
              : undefined
          }
          selecting={selecting}
        />
      </MessageChrome>
    );
  }

  if (message.type === 'payment_card') {
    const payMeta = (message.metadata ?? {}) as {
      orderId?: string;
      amount?: number;
      status?: string;
      orderLabel?: string;
    };
    const orderId = payMeta.orderId;
    const paid = (ref?.status ?? payMeta.status) === 'paid';
    const askId = ref?.id;
    const title = paymentCardTitle({
      paid,
      orderLabel: ref?.orderLabel,
      name: ref?.name,
      totalLabel: ref?.totalLabel,
      metaOrderLabel: payMeta.orderLabel,
      orderId: payMeta.orderId,
      body: message.body,
    });
    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={actions}
        actionsOnAccent={false}
        className="max-w-[85%]"
      >
        <div
          className={cx(
            MSG_BUBBLE_CLASS,
            'w-full border border-line bg-surface px-3 py-2.5 text-left',
            chatBubbleCorners(message.mine),
          )}
        >
          <button
            type="button"
            className="w-full text-left"
            onClick={() => {
              if (orderId) onOpenOrder(orderId);
            }}
          >
            <p className="text-sm font-semibold text-ink">{title}</p>
            {ref?.totalLabel ? (
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
            MSG_BUBBLE_CLASS,
            'px-3.5 py-2 text-sm',
            chatBubbleCorners(message.mine),
            message.mine
              ? 'bg-accent text-white'
              : 'border border-line bg-foam text-ink',
          )}
        >
          {message.deletedForEveryone ? (
            <p className={cx('italic', message.mine ? 'text-white/75' : 'text-muted')}>
              This message was deleted
            </p>
          ) : (
            <>
              <InCardActor message={message} label={senderLabel} />
              {reply ? (
                <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
              ) : null}
              <p className="whitespace-pre-wrap break-words">
                {message.body?.trim() ? hl(message.body) : 'Message'}
              </p>
              {message.editedAt ? (
                <p
                  className={cx(
                    'mt-0.5 text-[10px]',
                    message.mine ? 'text-white/55' : 'text-muted',
                  )}
                >
                  Edited
                </p>
              ) : null}
            </>
          )}
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
  const loggedAccept =
    (message.type === 'order_card' || isLegacyOrderNotice) &&
    !message.mine &&
    ref?.canAcceptLogged &&
    ref.available
      ? () => onAcceptLogged(ref.id)
      : undefined;
  const richOrder = isOrderLikeCard && isRichOrderChatMessage(message, ref);
  const tradeCard = buildChatTradeCard(message, ref, senderLabel, {
    compact: isOrderLikeCard && !richOrder,
    orderGoesTo,
    actions: {
      openOrder,
      quoteAccept,
      loggedAccept,
      accepting,
      collectionPath,
      productPath,
      onCurate: ref?.available ? () => onCurate(ref) : undefined,
      curating,
      curated,
    },
  });

  if (tradeCard) {
    return (
      <MessageChrome
        messageId={message.id}
        mine={message.mine}
        selecting={selecting}
        selected={selected}
        highlighted={highlighted}
        onToggleSelect={onToggleSelect}
        actions={actions}
        actionsOnAccent={message.mine}
        className="max-w-[85%]"
      >
        <div className="flex flex-col gap-0.5">
          {reply ? (
            <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
          ) : null}
          <ChatTradeCard
            model={tradeCard}
            highlight={hl}
            onOpen={openOrder && !selecting ? openOrder : undefined}
            selecting={selecting}
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
      actionsOnAccent={message.mine}
      className="max-w-[85%]"
    >
      <div className="flex flex-col gap-0.5">
        {reply ? (
          <ReplyQuote preview={reply} mine={message.mine} onJump={onJumpToReply} />
        ) : null}
        <div
          className={cx(
            MSG_BUBBLE_CLASS,
            'overflow-hidden text-sm',
            chatBubbleCorners(message.mine),
            message.mine
              ? 'border border-accent/35 bg-accent text-white'
              : 'border border-line border-l-[3px] border-l-accent bg-surface text-ink',
          )}
          data-testid="chat-trade-card-fallback"
        >
          <div
            className={cx(
              'flex items-center gap-1.5 border-b px-2.5 py-2',
              message.mine ? 'border-white/20' : 'border-line/70',
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
                'min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight',
                message.mine ? 'text-white' : 'text-ink',
              )}
            >
              {typeMeta.label}
            </p>
          </div>
          <div className="px-2.5 py-2">
            <p className={cx('text-[13px] font-medium', message.mine ? 'text-white' : 'text-ink')}>
              {hl(message.body?.trim() || 'Shared attachment')}
            </p>
            <p
              className={cx(
                'mt-1 text-right text-[11px]',
                message.mine ? 'text-white/65' : 'text-muted',
              )}
            >
              {timeAgo(message.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </MessageChrome>
  );
}
