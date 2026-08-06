import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CursorPage, ThreadSummary } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { Avatar, EmptyState, LoadingBlock, cx } from '@/ui/kit';
import { ExploreIcon, PinIcon } from '@/ui/icons';
import { chatTypeMeta, messagePreviewSearchBlob, messagePreviewText } from './messagePreview';

type Tab = 'active' | 'requests';

export function ChatsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const [readAllError, setReadAllError] = useState<string | null>(null);

  const threads = useQuery({
    queryKey: ['threads', { tab }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', {
        limit: 40,
        state: tab === 'requests' ? 'pending' : 'active',
      }),
    refetchInterval: 5_000,
  });

  const readAll = useMutation({
    mutationFn: () => api.post<{ ok: true }>('/threads/read-all', {}),
    onSuccess: () => {
      setReadAllError(null);
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err) =>
      setReadAllError(err instanceof ApiError ? err.message : 'Could not mark chats read.'),
  });

  const filtered = useMemo(() => {
    const rows = threads.data?.results ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((thread) => {
      const title = (thread.title ?? thread.counterpart?.name ?? '').toLowerCase();
      const preview = messagePreviewSearchBlob(thread.lastMessage);
      return title.includes(needle) || preview.includes(needle);
    });
  }, [threads.data?.results, query]);

  const hasUnread = (threads.data?.results ?? []).some((thread) => thread.unreadCount > 0);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5">
        <ExploreIcon width={18} height={18} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none ring-0 placeholder:text-muted focus:outline-none focus-visible:outline-none"
        />
      </label>

      <div className="flex items-center gap-2">
        {(['active', 'requests'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium capitalize',
              tab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          disabled={!hasUnread || readAll.isPending}
          onClick={() => readAll.mutate()}
          className="ml-auto text-xs font-semibold text-accent disabled:opacity-40"
        >
          {readAll.isPending ? 'Reading…' : 'Read all'}
        </button>
      </div>
      {readAllError ? <p className="text-center text-xs text-danger">{readAllError}</p> : null}

      {threads.isLoading ? (
        <LoadingBlock />
      ) : filtered.length > 0 ? (
        <div className="-mx-4 overflow-hidden border-y border-line bg-surface">
          {filtered.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            query.trim()
              ? 'No matches'
              : tab === 'requests'
                ? 'No requests'
                : 'No chats yet'
          }
          message={
            query.trim()
              ? 'Try another name or message.'
              : tab === 'requests'
                ? 'First messages from businesses you are not connected with land here. Approve access in My buyers.'
                : 'Open a connected chat, or check Requests for new message requests.'
          }
        />
      )}
    </div>
  );
}

function ThreadRow({ thread }: { thread: ThreadSummary }) {
  const title = thread.title ?? thread.counterpart?.name ?? 'Conversation';
  const preview = messagePreviewText(thread.lastMessage);
  const meta = thread.lastMessage ? chatTypeMeta(thread.lastMessage.type) : null;
  const PreviewIcon = meta?.Icon;

  return (
    <Link
      to={`/chats/${thread.id}`}
      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-foam active:bg-foam"
    >
      <Avatar name={title} imageUrl={thread.counterpart?.logoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold text-ink">
            {thread.pinned ? (
              <PinIcon width={12} height={12} className="shrink-0 text-muted" aria-hidden />
            ) : null}
            <span className="truncate">{title}</span>
          </p>
          <span
            className={cx(
              'shrink-0 text-[11px]',
              thread.unreadCount > 0 ? 'font-semibold text-accent' : 'text-muted',
            )}
          >
            {timeAgo(thread.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 truncate text-[13px] text-muted">
            {PreviewIcon && thread.lastMessage && thread.lastMessage.type !== 'text' ? (
              <PreviewIcon width={14} height={14} className="shrink-0 text-slate" aria-hidden />
            ) : null}
            <span className="truncate">{preview}</span>
          </p>
          {thread.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
              {thread.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
