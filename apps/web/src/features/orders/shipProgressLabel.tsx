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

/** Show the dispatched/pending pair (not Open / Can’t supply). */
export function orderLineShowsFulfillment(item: {
  remainingQuantity?: number;
  shippedQuantity?: number;
  lineStatus?: string;
}): boolean {
  if (item.lineStatus === 'declined' || item.lineStatus === 'open') return false;
  const pending = item.remainingQuantity ?? 0;
  const dispatched = item.shippedQuantity ?? 0;
  return (
    item.lineStatus === 'confirmed' ||
    item.lineStatus === 'dispatched' ||
    item.lineStatus === 'delivered' ||
    dispatched > 0 ||
    pending > 0
  );
}
export function fulfillmentNeedsAttention(pending: number): boolean {
  return pending > 0;
}

export function fulfillmentRowClass(pending: number, className?: string): string {
  return cx(
    'rounded-xl p-3',
    fulfillmentNeedsAttention(pending) ? 'bg-accent/5' : 'bg-foam/40',
    className,
  );
}

/** Extra pcs when shipped > agreed line qty. */
export function orderLineOverShipped(item: {
  shippedQuantity?: number;
  quantity?: number;
}): number {
  return Math.max(0, (item.shippedQuantity ?? 0) - (item.quantity ?? 0));
}

/**
 * Always a pair: **dispatched N · pending M**, or **dispatched N · extra M**
 * when the seller sent more than ordered (extra accented).
 */
export function ShipProgressHint({
  dispatched,
  pending,
  extra = 0,
  className,
}: {
  dispatched: number;
  pending: number;
  extra?: number;
  className?: string;
}) {
  const showExtra = extra > 0;
  return (
    <span className={cx('tabular-nums', className)} data-testid="ship-progress-hint">
      <span className={showExtra ? 'font-semibold text-accent' : 'text-muted'}>
        dispatched{' '}
        <span className={showExtra ? 'font-semibold' : 'font-medium text-slate'}>{dispatched}</span>
      </span>
      <span className="text-muted"> · </span>
      {showExtra ? (
        <span
          className="font-semibold text-accent"
          data-testid="ship-progress-extra"
        >
          extra <span className="font-medium">{extra}</span>
        </span>
      ) : (
        <span
          className={pending > 0 ? 'font-semibold text-accent' : 'text-muted'}
          data-testid="ship-progress-pending"
        >
          pending <span className="font-medium">{pending}</span>
        </span>
      )}
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
