import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TradeLaneView, UpdateTradeLaneDto } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { PageHeader } from '@/ui/PageHeader';
import { ListSearchRow } from '@/ui/ListSearchRow';
import { Card, EmptyState, LoadingBlock, TextInput, cx } from '@/ui/kit';

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function YourPathsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const lanes = useQuery({
    queryKey: ['trade-lanes', q],
    queryFn: () =>
      api.get<TradeLaneView[]>('/trade-lanes', q.trim() ? { q: q.trim() } : undefined),
  });

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTradeLaneDto }) =>
      api.patch<TradeLaneView>(`/trade-lanes/${id}`, body),
    onMutate: ({ id }) => setPendingId(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trade-lanes'] });
      showToast('Saved for next orders.');
    },
    onError: (err) => showToast(actionErrorMessage(err, 'Could not save.'), 'danger'),
    onSettled: () => setPendingId(null),
  });

  const rows = useMemo(() => lanes.data ?? [], [lanes.data]);

  return (
    <div className="flex flex-col gap-4" data-testid="your-paths-page">
      <PageHeader title="Your paths" />
      <p className="text-sm text-muted">
        For each mill and buyer: who the next order is with (Me or the mill), and whether they share
        one group chat. Changes apply to next orders only.
      </p>

      <ListSearchRow
        search={
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a shop"
            aria-label="Find a shop"
            data-testid="paths-search"
          />
        }
        action={<span className="h-[46px] w-[46px] shrink-0" aria-hidden />}
      />

      {lanes.isLoading ? <LoadingBlock /> : null}
      {!lanes.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No paths yet"
          message="After you handle an order between a mill and a buyer, the pair shows up here."
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const busy = pendingId === row.id && save.isPending;
          return (
            <Card key={row.id} className="flex flex-col gap-2.5" data-testid={`path-row-${row.id}`}>
              <p className="text-sm font-semibold text-ink">
                {row.sellerName} · {row.buyerName}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'me' as const, label: 'With me' },
                    { value: 'mill' as const, label: row.sellerName },
                  ] as const
                ).map((option) => {
                  const selected = row.ticket === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-testid={`path-ticket-${row.id}-${option.value}`}
                      disabled={busy || selected}
                      onClick={() => save.mutate({ id: row.id, body: { ticket: option.value } })}
                      className={cx(
                        'rounded-xl border px-3 py-2.5 text-left text-sm font-semibold text-ink',
                        selected
                          ? 'border-accent bg-accent/5'
                          : 'border-line bg-surface hover:bg-foam',
                        busy ? 'opacity-60' : '',
                      )}
                    >
                      <span className="block truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                data-testid={`path-reveal-${row.id}`}
                disabled={busy}
                onClick={() => save.mutate({ id: row.id, body: { reveal: !row.reveal } })}
                className={cx(
                  'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium text-ink',
                  row.reveal
                    ? 'border-accent bg-accent/5'
                    : 'border-line bg-surface',
                  busy ? 'opacity-60' : '',
                )}
              >
                <span>See each other in a group</span>
                <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-accent">
                  {row.reveal ? 'On' : 'Off'}
                </span>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
