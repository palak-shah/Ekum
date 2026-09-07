import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CursorPage, ThreadSummary } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTeamCaps } from '@/lib/teamCaps';
import { timeAgo } from '@/lib/format';
import { FindInExploreLink } from '@/ui/FindInExploreLink';
import { Avatar, EmptyState, LoadingBlock, TextInput, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { PinIcon, PlusIcon } from '@/ui/icons';
import { threadDisplayTitle } from './chatsListSearch';
import { threadVisibilityLabel } from './threadVisibilityLabel';
import { inboxPreviewTypeKey, messagePreviewText } from './messagePreview';
import { KindIconBadge } from './KindIconBadge';
import { StartChatSheet } from './StartChatSheet';

type Tab = 'active' | 'requests';

const TAB_LABEL: Record<Tab, string> = {
  active: 'All Chats',
  requests: 'Requests Received',
};

export function ChatsPage() {
  const queryClient = useQueryClient();
  const { can } = useTeamCaps();
  const canChat = can('chats');
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const [readAllError, setReadAllError] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);

  const threads = useQuery({
    queryKey: ['threads', { tab, q: deferredQuery || undefined }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', {
        limit: 40,
        state: tab === 'requests' ? 'pending' : 'active',
        ...(deferredQuery ? { q: deferredQuery } : {}),
      }),
    refetchInterval: deferredQuery ? false : 12_000,
    placeholderData: (previous) => previous,
    staleTime: 8_000,
  });

  const readAll = useMutation({
    mutationFn: () => api.post<{ ok: true }>('/threads/read-all', {}),
    onSuccess: () => {
      setReadAllError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['threads', 'unread-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err) =>
      setReadAllError(err instanceof ApiError ? err.message : 'Could not mark chats read.'),
  });

  const list = threads.data?.results ?? [];
  const hasUnread = list.some((thread) => thread.unreadCount > 0);
  const searching = Boolean(deferredQuery);

  return (
    <div className="flex flex-col gap-3">
      <ListSearchRow
        search={
          <TextInput
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            autoComplete="off"
          />
        }
        action={
          canChat ? (
            <ListSquareButton aria-label="New chat" onClick={() => setStartOpen(true)}>
              <PlusIcon width={20} height={20} />
            </ListSquareButton>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2">
        {(['active', 'requests'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              tab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {TAB_LABEL[value]}
          </button>
        ))}
        {hasUnread && !searching ? (
          <button
            type="button"
            disabled={readAll.isPending}
            onClick={() => readAll.mutate()}
            className="ml-auto text-sm font-semibold text-accent disabled:opacity-40"
          >
            {readAll.isPending ? 'Reading…' : 'Mark all read'}
          </button>
        ) : null}
      </div>
      {readAllError ? <p className="text-center text-sm text-danger">{readAllError}</p> : null}

      {threads.isLoading && !threads.data ? (
        <LoadingBlock />
      ) : list.length > 0 ? (
        <div className="-mx-4 overflow-hidden border-y border-line bg-surface">
          {list.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            searching
              ? 'No matches'
              : tab === 'requests'
                ? 'No requests received'
                : 'No chats yet'
          }
          message={
            searching
              ? 'Try another name, order, or message.'
              : tab === 'requests'
                ? 'Messages from businesses you don’t know yet land here.'
                : 'Find a business to start chatting.'
          }
          action={
            !searching && tab === 'active' ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStartOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white"
                >
                  Start a chat
                </button>
                <FindInExploreLink label="Find businesses" variant="ghost" fullWidth={false} />
              </div>
            ) : undefined
          }
        />
      )}

      <StartChatSheet open={startOpen} onClose={() => setStartOpen(false)} />
    </div>
  );
}

function ThreadRow({ thread }: { thread: ThreadSummary }) {
  const title = threadDisplayTitle(thread);
  const visibility = threadVisibilityLabel(thread);
  const whyLine = thread.searchHitPreview?.trim() || null;
  const preview = whyLine ?? messagePreviewText(thread.lastMessage);
  const previewType =
    !whyLine && thread.lastMessage ? inboxPreviewTypeKey(thread.lastMessage) : null;
  const to =
    whyLine && thread.searchHitMessageId
      ? `/chats/${thread.id}?message=${encodeURIComponent(thread.searchHitMessageId)}`
      : `/chats/${thread.id}`;

  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-foam active:bg-foam"
    >
      <Avatar name={title} imageUrl={thread.counterpart?.logoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold text-ink">
            {thread.pinned ? (
              <PinIcon width={12} height={12} className="shrink-0 text-muted" aria-hidden />
            ) : null}
            <span className="truncate">{title}</span>
            {visibility ? (
              <span className="shrink-0 text-xs font-medium text-muted">· {visibility}</span>
            ) : null}
          </p>
          <span
            className={cx(
              'shrink-0 text-xs',
              thread.unreadCount > 0 ? 'font-semibold text-accent' : 'text-muted',
            )}
          >
            {timeAgo(thread.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 truncate text-sm text-muted">
            {previewType ? (
              <KindIconBadge messageType={previewType} size={18} iconSize={14} />
            ) : null}
            <span className="truncate">{preview}</span>
          </p>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
              {thread.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
