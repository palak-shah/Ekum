import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import type { CursorPage, StarredMessageView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, ErrorState, LoadingBlock, cx } from '@/ui/kit';
import { timeAgo } from '@/lib/format';
import { useToast } from '@/ui/Toast';
import { replyComposerLabel } from '@/features/chats/chatMessageActions';

export function StarredMessagesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const starred = useQuery({
    queryKey: ['messages', 'starred'],
    queryFn: () => api.get<CursorPage<StarredMessageView>>('/messages/starred', { limit: 50 }),
  });

  const unstar = useMutation({
    mutationFn: (messageId: string) => api.del(`/messages/${messageId}/star`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', 'starred'] });
      showToast('Unstarred');
    },
    onError: (err) => {
      showToast(err instanceof ApiError ? err.message : 'Could not unstar.', 'danger');
    },
  });

  if (starred.isLoading) {
    return <LoadingBlock label="Loading starred…" />;
  }
  if (starred.isError) {
    return (
      <>
        <PageHeader title="Starred" onBack={() => navigate('/chats')} />
        <ErrorState message="Could not load starred messages." />
      </>
    );
  }

  const rows = starred.data?.results ?? [];

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Starred" onBack={() => navigate('/chats')} />
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
                <Card className="flex items-stretch gap-2 !p-0">
                  <Link
                    to={`/chats/${row.threadId}?message=${encodeURIComponent(row.message.id)}`}
                    data-testid={`starred-row-${row.message.id}`}
                    className={cx(
                      'min-w-0 flex-1 rounded-xl px-3.5 py-3 text-left',
                      'hover:bg-foam active:bg-linen',
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-bold text-ink">{title}</p>
                      <p className="shrink-0 text-[10px] text-muted">{timeAgo(row.starredAt)}</p>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">{preview}</p>
                  </Link>
                  <div className="flex shrink-0 items-center border-l border-line pr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      data-testid={`starred-unstar-${row.message.id}`}
                      disabled={unstar.isPending}
                      className="px-2.5 py-1.5 text-xs font-bold text-accent"
                      onClick={() => unstar.mutate(row.message.id)}
                    >
                      Unstar
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
