import { useQuery } from '@tanstack/react-query';
import type { CursorPage, ReturnView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import { Card, EmptyState, LoadingBlock, StatusPill } from '@/ui/kit';

/** Occasional list — not on the everyday Orders tab. */
export function ReturnsPage() {
  const returns = useQuery({
    queryKey: ['returns'],
    queryFn: () => api.get<CursorPage<ReturnView>>('/returns', { limit: 50 }),
  });

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Returns" subtitle="Return requests tied to orders" />

      {returns.isLoading ? (
        <LoadingBlock />
      ) : returns.data && returns.data.results.length > 0 ? (
        <div className="flex flex-col gap-2">
          {returns.data.results.map((row) => (
            <Card key={row.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{row.counterpart.name}</p>
                <p className="text-xs text-muted">
                  {row.direction} · {row.items.length}{' '}
                  {row.items.length === 1 ? 'item' : 'items'} · {timeAgo(row.createdAt)}
                </p>
              </div>
              <StatusPill status={row.status} />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No returns yet"
          message="When a return is raised on an order, it shows up here."
        />
      )}
    </div>
  );
}
