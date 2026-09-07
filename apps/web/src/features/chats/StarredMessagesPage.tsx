import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import type { CursorPage, StarredMessageView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { EmptyState, ErrorState, LoadingBlock, cx } from '@/ui/kit';
import { timeAgo } from '@/lib/format';
import { replyComposerLabel } from '@/features/chats/chatMessageActions';

export function StarredMessagesPage() {
  const navigate = useNavigate();
  const starred = useQuery({
    queryKey: ['messages', 'starred'],
    queryFn: () => api.get<CursorPage<StarredMessageView>>('/messages/starred', { limit: 50 }),
  });

  if (starred.isLoading) {
    return <LoadingBlock label="Loading starred…" />;
  }
  if (starred.isError) {
    return (
      <>
        <PageHeader title="Starred" onBack={() => navigate(-1)} />
        <ErrorState message="Could not load starred messages." />
      </>
    );
  }

  const rows = starred.data?.results ?? [];

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Starred" onBack={() => navigate(-1)} />
      {rows.length === 0 ? (
        <EmptyState
          title="No starred messages"
          message="Star a chat message to find it here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const title =
              row.threadTitle?.trim() ||
              row.counterpartName?.trim() ||
              'Conversation';
            const preview = replyComposerLabel(row.message);
            return (
              <li key={`${row.message.id}-${row.starredAt}`}>
                <Link
                  to={`/chats/${row.threadId}?message=${encodeURIComponent(row.message.id)}`}
                  className={cx(
                    'block rounded-2xl border border-line bg-surface px-3.5 py-3 text-left',
                    'hover:bg-foam active:bg-linen',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-bold text-ink">{title}</p>
                    <p className="shrink-0 text-[10px] text-muted">{timeAgo(row.starredAt)}</p>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{preview}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
