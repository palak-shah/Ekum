import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TradeLaneView, UpdateTradeLaneDto } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useToast } from '@/ui/Toast';
import { PageHeader } from '@/ui/PageHeader';
import { ListSearchRow } from '@/ui/ListSearchRow';
import { Card, EmptyState, LoadingBlock, SearchInput, cx } from '@/ui/kit';
import { PATH_ON_PATHS_SCOPE, SHARE_A_GROUP } from '@/features/orders/iHandleDesk';
import { TicketPathPick } from '@/features/orders/ticketPathPick';
import { HELP_BTN_CLASS, QuietHelpPop } from '@/features/orders/quietHelpPop';

function actionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function YourPathsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
  const [pathsHelp, setPathsHelp] = useState(false);

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
      <div className="flex items-start gap-1.5">
        <p className="text-sm text-muted">
          For each mill and buyer: who the buyer talks to next, and whether they share a group.
        </p>
        <button
          type="button"
          data-testid="paths-help"
          aria-label="What this means"
          className={`${HELP_BTN_CLASS} mt-0.5 shrink-0`}
          onClick={(event) => {
            setHelpAnchor(event.currentTarget);
            setPathsHelp((open) => !open);
          }}
        >
          ?
        </button>
      </div>

      <ListSearchRow
        search={
          <SearchInput
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

              <TicketPathPick
                ticket={row.ticket}
                millLabel={row.sellerName}
                millNames={[]}
                disabled={busy}
                onPick={(next) => save.mutate({ id: row.id, body: { ticket: next } })}
                pickTestId={`path-ticket-${row.id}`}
                meTestId={`path-ticket-${row.id}-me`}
                millTestId={`path-ticket-${row.id}-mill`}
              />

              <button
                type="button"
                data-testid={`path-reveal-${row.id}`}
                disabled={busy || row.sellerCompanyId === row.buyerCompanyId}
                onClick={() => save.mutate({ id: row.id, body: { reveal: !row.reveal } })}
                className={cx(
                  'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium text-ink',
                  row.reveal
                    ? 'border-accent bg-accent/5'
                    : 'border-line bg-surface',
                  busy || row.sellerCompanyId === row.buyerCompanyId ? 'opacity-60' : '',
                )}
              >
                <span>
                  {row.sellerCompanyId === row.buyerCompanyId
                    ? 'Same shop — nothing to reveal'
                    : SHARE_A_GROUP}
                </span>
                <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-accent">
                  {row.reveal ? 'On' : 'Off'}
                </span>
              </button>
            </Card>
          );
        })}
      </div>

      <QuietHelpPop
        open={pathsHelp}
        onClose={() => setPathsHelp(false)}
        testId="paths-help-pop"
        anchor={helpAnchor}
      >
        <p className="font-medium">{PATH_ON_PATHS_SCOPE}</p>
        <p className="mt-1.5">You / mill — who the buyer talks to on the next order.</p>
        <p className="mt-1.5">Share a group — they meet after you Send the next order.</p>
      </QuietHelpPop>
    </div>
  );
}
