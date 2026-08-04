import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CursorPage, ThreadSummary } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { Avatar, EmptyState, LoadingBlock, cx } from '@/ui/kit';
import { ExploreIcon } from '@/ui/icons';

type Tab = 'active' | 'requests';

export function ChatsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const threads = useQuery({
    queryKey: ['threads', { tab }],
    queryFn: () =>
      api.get<CursorPage<ThreadSummary>>('/threads', {
        limit: 40,
        state: tab === 'requests' ? 'pending' : 'active',
      }),
    refetchInterval: 5_000,
  });

  const filtered = useMemo(() => {
    const rows = threads.data?.results ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((thread) => {
      const title = (thread.title ?? thread.counterpart?.name ?? '').toLowerCase();
      const preview = (thread.lastMessage?.body ?? '').toLowerCase();
      return title.includes(needle) || preview.includes(needle);
    });
  }, [threads.data?.results, query]);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold text-ink">Chats</h1>

      <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5">
        <ExploreIcon width={18} height={18} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none ring-0 placeholder:text-muted focus:outline-none focus-visible:outline-none"
        />
      </label>

      <div className="flex gap-2">
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
      </div>

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
  return (
    <Link
      to={`/chats/${thread.id}`}
      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-foam active:bg-foam"
    >
      <Avatar name={title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] font-semibold text-ink">{title}</p>
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
          <p className="truncate text-[13px] text-muted">
            {thread.lastMessage?.body ?? (thread.lastMessage ? 'Shared a card' : 'No messages yet')}
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
