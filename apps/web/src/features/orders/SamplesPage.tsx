import { useQuery } from '@tanstack/react-query';
import type { CursorPage, SampleView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import { Card, EmptyState, LoadingBlock, StatusPill } from '@/ui/kit';

/** Occasional list — not on the everyday Orders tab. */
export function SamplesPage() {
  const samples = useQuery({
    queryKey: ['samples'],
    queryFn: () => api.get<CursorPage<SampleView>>('/samples', { limit: 50 }),
  });

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Samples" subtitle="Requests tied to orders and chats" />

      {samples.isLoading ? (
        <LoadingBlock />
      ) : samples.data && samples.data.results.length > 0 ? (
        <div className="flex flex-col gap-2">
          {samples.data.results.map((sample) => (
            <Card key={sample.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{sample.name}</p>
                <p className="text-xs text-muted">
                  {sample.counterpart.name} · {sample.direction} · {timeAgo(sample.createdAt)}
                </p>
              </div>
              <StatusPill status={sample.status} />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No samples yet"
          message="When you mark something as a sample on an order, it shows up here."
        />
      )}
    </div>
  );
}
