import { cx } from '@/ui/kit';
import { orderLineOverShipped } from '@/features/orders/shipProgressLabel';

/** Label above · value below — columns separated by a hairline, not boxes. */
function FactCell({
  label,
  value,
  valueClass,
  compact,
  testId,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  compact?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={cx('min-w-0 flex-1 px-2 first:pl-0 last:pr-0', compact ? 'py-0' : 'py-0.5')}
      data-testid={testId}
    >
      <p
        className={cx(
          'truncate font-medium uppercase tracking-wide text-muted',
          compact ? 'text-[10px] leading-none' : 'text-[10px] leading-tight',
        )}
      >
        {label}
      </p>
      <p
        className={cx(
          // Do not set text-ink with a tone class — cx is not twMerge; text-ink
          // sorts after text-info in CSS and would paint over-balance black.
          'truncate text-sm font-semibold leading-tight tabular-nums',
          valueClass ?? 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** ₹ amount only — sold-as / “per mtr” lives under the design name. */
export function formatOrderLinePriceAmount(rate: number): string {
  return `₹${rate.toLocaleString('en-IN')}`;
}

type ItemFacts = {
  quantity: number;
  rate: number | null;
  unit: string | null;
  remainingQuantity?: number;
  shippedQuantity?: number;
  lineStatus?: string;
};

/** After confirm / any ship — Qty+Price only on Requested. */
export function orderLineShowsShipFacts(item: ItemFacts): boolean {
  const shipped = item.shippedQuantity ?? 0;
  return (
    item.lineStatus === 'confirmed' ||
    item.lineStatus === 'dispatched' ||
    item.lineStatus === 'delivered' ||
    shipped > 0
  );
}

export type OrderLineBalanceTone = 'open' | 'over' | 'done';

export type OrderLineBalance = {
  /** Signed: −pending, +extra, or 0 when complete. */
  value: number;
  tone: OrderLineBalanceTone;
};

/**
 * Balance from existing ship math only — no new business rules.
 * under → −remaining (open); over → +extra; exact → 0 (done).
 */
export function orderLineBalance(item: ItemFacts): OrderLineBalance | null {
  if (!orderLineShowsShipFacts(item)) return null;
  const extra = orderLineOverShipped(item);
  if (extra > 0) return { value: extra, tone: 'over' };
  const pending = item.remainingQuantity ?? 0;
  if (pending > 0) return { value: -pending, tone: 'open' };
  return { value: 0, tone: 'done' };
}

/**
 * Dispatch draft preview — fold This LR into Ship / Balance.
 */
export function orderLineFactsWithThisLr(
  item: ItemFacts,
  thisLrQty: number,
  includeThisLr: boolean,
): ItemFacts {
  if (!includeThisLr || !Number.isFinite(thisLrQty) || thisLrQty < 1) return item;
  const shipped = (item.shippedQuantity ?? 0) + Math.floor(thisLrQty);
  const remaining = Math.max(0, item.quantity - shipped);
  return {
    ...item,
    shippedQuantity: shipped,
    remainingQuantity: remaining,
  };
}

export function formatOrderLineBalance(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

/** Subtle whole-row wash from Balance — open amber · over blue · done green. No border. */
export function orderLineBalanceRowClass(item: ItemFacts, className?: string): string {
  const balance = orderLineBalance(item);
  if (!balance) return cx(className);
  if (balance.tone === 'open') {
    return cx('bg-warning-soft/80', className);
  }
  if (balance.tone === 'over') {
    return cx('bg-info-soft/90', className);
  }
  return cx('bg-success-soft', className);
}

function balanceValueClass(tone: OrderLineBalanceTone): string {
  if (tone === 'over') return 'text-info';
  if (tone === 'open') return 'text-tangerine';
  return 'text-success';
}

/**
 * Qty · Price · Ship · Balance — light theme, vertical dividers (not boxes).
 * Which columns show follows status; structure stays a flat fact strip.
 */
export function OrderLineFacts({
  item,
  className,
  density = 'compact',
}: {
  item: ItemFacts;
  className?: string;
  density?: 'compact' | 'detail' | 'sheet';
}) {
  const qty = item.quantity;
  const hasPrice = item.rate != null;
  const shipped = item.shippedQuantity ?? 0;
  const showShip = orderLineShowsShipFacts(item);
  const balance = orderLineBalance(item);
  const compact = density !== 'detail';

  if (density === 'sheet') {
    return (
      <p
        className={cx(
          'mt-0.5 truncate text-[12px] font-medium tabular-nums text-ink',
          className,
        )}
        data-testid="order-line-facts"
        data-density="sheet"
      >
        <span data-testid="order-line-fact-qty">{qty}</span>
        {hasPrice ? (
          <>
            <span className="font-normal text-muted"> · </span>
            <span data-testid="order-line-fact-price">
              {formatOrderLinePriceAmount(item.rate!)}
            </span>
          </>
        ) : null}
        {showShip ? (
          <>
            <span className="font-normal text-muted"> · </span>
            <span data-testid="order-line-fact-shipped">ship {shipped}</span>
          </>
        ) : null}
        {balance ? (
          <>
            <span className="font-normal text-muted"> · </span>
            <span
              className={cx('font-semibold', balanceValueClass(balance.tone))}
              data-testid="order-line-fact-balance"
            >
              {formatOrderLineBalance(balance.value)}
            </span>
          </>
        ) : null}
      </p>
    );
  }

  const cells: Array<{
    label: string;
    value: string | number;
    valueClass?: string;
    testId: string;
  }> = [
    { label: 'Qty', value: qty, testId: 'order-line-fact-qty' },
  ];
  if (hasPrice) {
    cells.push({
      label: 'Price',
      value: formatOrderLinePriceAmount(item.rate!),
      testId: 'order-line-fact-price',
    });
  }
  if (showShip) {
    cells.push({
      label: 'Ship',
      value: shipped,
      testId: 'order-line-fact-shipped',
    });
  }
  if (balance) {
    cells.push({
      label: 'Balance',
      value: formatOrderLineBalance(balance.value),
      valueClass: balanceValueClass(balance.tone),
      testId: 'order-line-fact-balance',
    });
  }

  return (
    <div
      className={cx(
        'flex w-full min-w-0 items-stretch divide-x divide-line/90',
        compact ? 'mt-0.5' : 'mt-1.5',
        className,
      )}
      data-testid="order-line-facts"
      data-density={density}
      role="group"
      aria-label="Line quantities"
    >
      {cells.map((cell) => (
        <FactCell
          key={cell.testId}
          label={cell.label}
          value={cell.value}
          valueClass={cell.valueClass}
          compact={compact}
          testId={cell.testId}
        />
      ))}
    </div>
  );
}
