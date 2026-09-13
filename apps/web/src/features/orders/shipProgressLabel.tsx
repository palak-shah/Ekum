import { cx } from '@/ui/kit';

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
    <div
      className="mt-1.5 grid grid-cols-2 gap-3"
      data-testid="settle-qty-columns"
    >
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
