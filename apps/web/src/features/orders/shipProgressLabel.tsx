import { cx } from '@/ui/kit';

/** Confirmed/dispatched lines still to ship — accent on order detail. */
export function orderLineShowsPending(item: {
  remainingQuantity?: number;
  lineStatus?: string;
}): boolean {
  const pending = item.remainingQuantity ?? 0;
  if (pending <= 0) return false;
  return item.lineStatus === 'confirmed' || item.lineStatus === 'dispatched';
}
export function fulfillmentNeedsAttention(pending: number): boolean {
  return pending > 0;
}

export function fulfillmentRowClass(pending: number, className?: string): string {
  return cx(
    'rounded-xl border p-3',
    fulfillmentNeedsAttention(pending)
      ? 'border-accent/40 bg-accent/5'
      : 'border-line bg-surface',
    className,
  );
}

/** Shipped (quiet) + pending (accent when open) — order line / dispatch cue. */
export function ShipProgressHint({
  shipped,
  pending,
  className,
}: {
  shipped: number;
  pending: number;
  className?: string;
}) {
  if (shipped <= 0 && pending <= 0) return null;
  return (
    <span className={cx('tabular-nums', className)} data-testid="ship-progress-hint">
      {shipped > 0 ? (
        <span className="text-muted">
          shipped <span className="font-medium text-slate">{shipped}</span>
        </span>
      ) : null}
      {shipped > 0 && pending > 0 ? <span className="text-muted"> · </span> : null}
      {pending > 0 ? (
        <span className="font-semibold text-accent" data-testid="ship-progress-pending">
          pending {pending}
        </span>
      ) : null}
    </span>
  );
}

/** Settle sheet: two loud columns Dispatched | Pending. */
export function SettleQtyColumns({
  dispatched,
  pending,
}: {
  dispatched: number;
  pending: number;
}) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-3" data-testid="settle-qty-columns">
      <div>
        <p className="text-[11px] font-medium text-muted">Dispatched</p>
        <p className="text-base font-semibold tabular-nums text-ink">{dispatched}</p>
      </div>
      <div>
        <p className="text-[11px] font-medium text-muted">Pending</p>
        <p
          className={cx(
            'text-base font-semibold tabular-nums',
            pending > 0 ? 'text-accent' : 'text-ink',
          )}
          data-testid="settle-qty-pending"
        >
          {pending}
        </p>
      </div>
    </div>
  );
}

/** Sticky settle summary — scan totals without reading every row. */
export function SettlePendingSummary({
  designCount,
  pendingPieces,
}: {
  designCount: number;
  pendingPieces: number;
}) {
  if (pendingPieces <= 0) return null;
  return (
    <div
      className="rounded-xl border border-accent/40 bg-accent/5 px-3 py-2.5"
      data-testid="settle-pending-summary"
    >
      <p className="text-sm font-semibold text-accent">
        {designCount} {designCount === 1 ? 'design' : 'designs'} ·{' '}
        <span className="tabular-nums">{pendingPieces}</span> pending
      </p>
      <p className="mt-0.5 text-[12px] text-muted">Highlighted rows won’t ship. Rest already out.</p>
    </div>
  );
}
