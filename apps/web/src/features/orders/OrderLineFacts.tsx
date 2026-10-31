import type { ReactNode } from 'react';
import { cx } from '@/ui/kit';
import { orderLineOverShipped } from '@/features/orders/shipProgressLabel';
import {
  formatDualQty,
  formatOrderQty,
  lineBillAmount,
  orderLineBillingCaptions,
} from '@/features/orders/orderLineBilling';
import { isPackOrderUnit } from '@/lib/catalogRate';
import { orderRateText, qtyCountNoun } from '@/features/orders/howManyLineMeta';
import { designSubtextClass } from '@/ui/designLineChrome';

export type OrderLineFactColumn = 'qty' | 'price' | 'bill' | 'ship' | 'thisLr' | 'balance';

const FACT_COLUMN_ORDER: OrderLineFactColumn[] = [
  'qty',
  'price',
  'bill',
  'ship',
  'balance',
];

function factTrackClass(tracks: number, even = false, editor = false): string {
  if (editor) {
    // Dispatch: Ordered · Shipped · This LR (only editor). Remainder lives on the name.
    return 'grid w-full min-w-0 grid-cols-[minmax(3.5rem,0.85fr)_minmax(3.5rem,0.85fr)_minmax(7.25rem,1.4fr)]';
  }
  if (even) {
    return tracks >= 4
      ? 'grid w-full min-w-0 grid-cols-4'
      : 'grid w-full min-w-0 grid-cols-3';
  }
  if (tracks >= 5) {
    return 'grid w-full min-w-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.7fr)_minmax(0,0.85fr)]';
  }
  if (tracks === 4) {
    return 'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(4.5rem,1.4fr)_minmax(0,1fr)]';
  }
  return 'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(4.5rem,1.4fr)]';
}

/** Label above · value below — columns separated by a hairline, not boxes. */
function FactCell({
  label,
  value,
  valueClass,
  compact,
  testId,
  grow,
  hideLabel,
  nowrap,
  colSpan,
  control,
  valueBox,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
  compact?: boolean;
  testId?: string;
  /** Bill (and similar money) — wider share; never ellipsis the ₹ amount. */
  grow?: boolean;
  hideLabel?: boolean;
  nowrap?: boolean;
  colSpan?: number;
  /** Typed field in the value row (Dispatch This LR) — not wrapped in a <p>. */
  control?: ReactNode;
  /** Shared value-row height so Shipped · input · Balance sit on one line. */
  valueBox?: boolean;
}) {
  const valueEl = control ? (
    <div className="w-full min-w-0">{control}</div>
  ) : (
    <p
      className={cx(
        // Do not set text-ink with a tone class — cx is not twMerge; text-ink
        // sorts after text-tangerine in CSS and would paint over-balance black.
        // Values stay untruncated so ₹4,250 is never clipped to ₹4… (BM-07).
        compact
          ? 'text-[12px] font-emphasis leading-tight tabular-nums'
          : 'text-sm font-emphasis leading-tight tabular-nums',
        nowrap ? 'whitespace-nowrap' : null,
        valueClass ?? 'text-ink',
      )}
    >
      {value === '' || value == null ? '\u00a0' : value}
    </p>
  );
  return (
    <div
      className={cx(
        'min-w-0 px-1 first:pl-0 last:pr-0',
        control ? 'overflow-visible' : 'overflow-hidden',
        grow ? 'min-w-[4.5rem]' : null,
        colSpan === 2 ? 'col-span-2' : null,
        compact ? 'py-0' : 'py-0.5',
      )}
      data-testid={testId}
    >
      {hideLabel ? null : (
        <p
          className={cx(
            'font-body uppercase text-muted',
            compact ? 'text-[10px] leading-none' : 'text-[12px] leading-tight',
            control ? 'whitespace-nowrap tracking-normal' : 'tracking-wide',
          )}
        >
          {label}
        </p>
      )}
      {valueBox ? <div className="flex min-h-8 items-center">{valueEl}</div> : valueEl}
    </div>
  );
}

/** ₹ amount only — unit noun lives on Total / Sets·Mtrs headings, not on Price. */
export function formatOrderLinePriceAmount(rate: number): string {
  return `₹${rate.toLocaleString('en-IN')}`;
}

export type ItemFacts = {
  quantity: number;
  rate: number | null;
  unit: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  piecesPerPack?: number | null;
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

export type OrderLineFactCellDef = {
  column: OrderLineFactColumn;
  label: string;
  value: ReactNode;
  valueClass?: string;
  testId: string;
  grow?: boolean;
  nowrap?: boolean;
  colSpan?: number;
  control?: ReactNode;
};

/** Rate per on the ticket name row (`₹91/mtr`). */
export function orderTicketLineRateCopy(item: ItemFacts): string | null {
  return orderRateText({
    rate: item.rate,
    unit: item.unit,
    dispatchUnit: item.dispatchUnit,
    catalogRateUnit: item.catalogRateUnit,
  });
}

/** Qty under the ticket name: `4 sets` or `5 of 12 sets sent`. */
export function orderTicketLineQtyCopy(item: ItemFacts): string {
  const qty = item.quantity;
  if (orderLineShowsShipFacts(item)) {
    const shipped = item.shippedQuantity ?? 0;
    const extra = orderLineOverShipped(item);
    const noun = item.unit ? qtyCountNoun(item.unit) : '';
    const base = noun ? `${shipped} of ${qty} ${noun} sent` : `${shipped} of ${qty} sent`;
    return extra > 0 ? `${base} · +${extra} extra` : base;
  }
  return formatOrderQty({ quantity: qty, unit: item.unit });
}

/** Quiet Price · Bill under the name after confirm — not a strip column. */
export function orderLineMoneyCue(item: ItemFacts): string | null {
  if (!orderLineShowsShipFacts(item)) return null;
  const bits: string[] = [];
  const rate = orderRateText({
    rate: item.rate,
    unit: item.unit,
    dispatchUnit: item.dispatchUnit,
    catalogRateUnit: item.catalogRateUnit,
  });
  if (rate) bits.push(`Price ${rate}`);
  const bill = lineBillAmount({
    quantity: item.quantity,
    rate: item.rate,
    unit: item.unit,
    piecesPerPack: item.piecesPerPack,
  });
  if (bill != null) bits.push(`Bill ${formatOrderLinePriceAmount(bill)}`);
  return bits.length > 0 ? bits.join(' · ') : null;
}

/** Same type as How many `Set · 39 pcs` — sits on the name, not in the fact strip. */
export function OrderLineMoneyLine({ item }: { item: ItemFacts }) {
  const money = orderLineMoneyCue(item);
  if (!money) return null;
  return (
    <p className={cx('mt-0.5', designSubtextClass)} data-testid="order-line-money-info">
      {money}
    </p>
  );
}

/** Same columns the ticket line uses — mill-bill total must match this set. */
export function orderLineFactCellDefs(item: ItemFacts): OrderLineFactCellDef[] {
  const qty = item.quantity;
  const hasPrice = item.rate != null;
  const bill = lineBillAmount({
    quantity: item.quantity,
    rate: item.rate,
    unit: item.unit,
    piecesPerPack: item.piecesPerPack,
  });
  /** Ticket Qty is a count — unit noun lives on Total / Sets·Mtrs headings. */
  const shipped = item.shippedQuantity ?? 0;
  const showShip = orderLineShowsShipFacts(item);
  const balance = orderLineBalance(item);
  if (showShip) {
    const cells: OrderLineFactCellDef[] = [
      { column: 'qty', label: 'Ordered', value: String(qty), testId: 'order-line-fact-qty' },
      {
        column: 'ship',
        label: 'Shipped',
        value: shipped,
        testId: 'order-line-fact-shipped',
      },
    ];
    if (balance) {
      cells.push({
        column: 'balance',
        label: 'Balance',
        value: formatOrderLineBalance(balance.value),
        valueClass: orderLineBalanceValueClass(balance.tone),
        testId: 'order-line-fact-balance',
        nowrap: true,
      });
    }
    return cells;
  }
  return [
    { column: 'qty', label: 'Qty', value: String(qty), testId: 'order-line-fact-qty' },
    {
      column: 'price',
      label: 'Price',
      value: hasPrice
        ? (orderRateText({
            rate: item.rate,
            unit: item.unit,
            dispatchUnit: item.dispatchUnit,
            catalogRateUnit: item.catalogRateUnit,
          }) ?? formatOrderLinePriceAmount(item.rate!))
        : '',
      testId: 'order-line-fact-price',
      nowrap: true,
    },
    {
      column: 'bill',
      label: 'Bill',
      value: bill != null ? formatOrderLinePriceAmount(bill) : '',
      testId: 'order-line-fact-bill',
      grow: true,
      nowrap: true,
    },
  ];
}

export function orderTicketFactColumns(items: ItemFacts[]): OrderLineFactColumn[] {
  const seen = new Set<OrderLineFactColumn>();
  for (const item of items) {
    for (const cell of orderLineFactCellDefs(item)) seen.add(cell.column);
  }
  return FACT_COLUMN_ORDER.filter((column) => seen.has(column));
}

export function OrderLineFactStrip({
  cells,
  tracks,
  density = 'compact',
  hideLabels = false,
  dividers = true,
  even = false,
  editor = false,
  valueBox = false,
  testId = 'order-line-facts',
  ariaLabel = 'Line quantities',
  className,
}: {
  cells: OrderLineFactCellDef[];
  /** Same template as the ticket line so Total Qty/Bill stay under those columns. */
  tracks?: number;
  density?: 'compact' | 'detail';
  hideLabels?: boolean;
  /** Line strips use hairlines; the Total row does not. */
  dividers?: boolean;
  /** Equal columns (ticket Ordered · Shipped · Balance). */
  even?: boolean;
  /** Dispatch: wider This LR editor column. */
  editor?: boolean;
  /** Shared value-row height so an input lines up with Shipped / Balance. */
  valueBox?: boolean;
  testId?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const compact = density !== 'detail';
  const trackCount = tracks ?? cells.length;
  return (
    <div
      className={cx(
        factTrackClass(trackCount, even, editor),
        'items-stretch',
        dividers ? 'divide-x divide-line/90' : null,
        hideLabels ? null : compact ? 'mt-0.5' : 'mt-1.5',
        className,
      )}
      data-testid={testId}
      data-density={density}
      role="group"
      aria-label={ariaLabel}
    >
      {cells.map((cell) => (
        <FactCell
          key={cell.testId}
          label={cell.label}
          value={cell.value}
          valueClass={cell.valueClass}
          compact={compact}
          testId={cell.testId}
          grow={cell.grow}
          hideLabel={hideLabels}
          nowrap={cell.nowrap}
          colSpan={cell.colSpan}
          control={cell.control}
          valueBox={valueBox}
        />
      ))}
    </div>
  );
}

/** Fully shipped (exact 0) pale-green. Leftover / extra stay unwashed so −N / +N can scan. */
export function orderLineBalanceRowClass(item: ItemFacts, className?: string): string {
  const balance = orderLineBalance(item);
  if (balance?.tone === 'done') return cx('bg-success-soft', className);
  return cx(className);
}

/** − remaining and + extra scan amber; 0 stays ink. */
export function orderLineBalanceValueClass(tone: OrderLineBalanceTone): string | undefined {
  if (tone === 'over' || tone === 'open') return 'text-tangerine';
  return undefined;
}

/**
 * Requested: Qty · Price · Bill. After confirm: Price/Bill as info under the
 * name; hairline Ordered · Shipped · Balance.
 */
export function OrderLineFacts({
  item,
  className,
  density = 'compact',
  dualQty = true,
  layout = 'strip',
}: {
  item: ItemFacts;
  className?: string;
  density?: 'compact' | 'detail' | 'sheet';
  /** Action sheets keep the order-unit noun; ticket compact/detail Qty is a number. */
  dualQty?: boolean;
  /** Ticket proto lines — qty under the name, no Qty · Price · Bill strip. */
  layout?: 'strip' | 'ticket';
}) {
  const qty = item.quantity;
  const hasPrice = item.rate != null;
  const bill = lineBillAmount({
    quantity: item.quantity,
    rate: item.rate,
    unit: item.unit,
    piecesPerPack: item.piecesPerPack,
  });
  const qtyLabel = dualQty && isPackOrderUnit(item.unit)
    ? formatDualQty({
        quantity: item.quantity,
        unit: item.unit,
        piecesPerPack: item.piecesPerPack,
        dispatchUnit: item.dispatchUnit,
      })
    : formatOrderQty({ quantity: qty, unit: item.unit });
  const shipped = item.shippedQuantity ?? 0;
  const showShip = orderLineShowsShipFacts(item);
  const balance = orderLineBalance(item);
  const money = orderLineMoneyCue(item);
  const captions =
    density === 'detail'
      ? orderLineBillingCaptions({
          quantity: item.quantity,
          rate: item.rate,
          unit: item.unit,
          piecesPerPack: item.piecesPerPack,
          dispatchUnit: item.dispatchUnit,
        })
      : [];

  if (layout === 'ticket') {
    const extra = orderLineOverShipped(item);
    const pct =
      qty > 0 ? Math.min(100, Math.round((shipped / qty) * 100)) : 0;
    return (
      <div
        className={cx('flex w-full min-w-0 flex-col', className)}
        data-testid="order-line-facts"
        data-density="ticket"
      >
        <p className="text-[13px] text-ink" data-testid="order-line-fact-qty">
          {orderTicketLineQtyCopy(item)}
        </p>
        {showShip && item.lineStatus !== 'declined' ? (
          <span
            className="mt-1 block h-1.5 overflow-hidden rounded-full bg-foam"
            data-testid="order-line-ship-bar"
          >
            <span
              className={cx(
                'block h-full rounded-full',
                extra > 0 ? 'bg-warning' : 'bg-accent/70',
              )}
              style={{ width: `${pct}%` }}
            />
          </span>
        ) : null}
      </div>
    );
  }

  if (density === 'sheet') {
    return (
      <p
        className={cx(
          'mt-0.5 truncate text-[12px] font-emphasis tabular-nums text-ink',
          className,
        )}
        data-testid="order-line-facts"
        data-density="sheet"
      >
        <span data-testid="order-line-fact-qty">{qtyLabel}</span>
        {hasPrice && !showShip ? (
          <>
            <span className="font-body text-muted"> · </span>
            <span data-testid="order-line-fact-price">
              {orderRateText({
                rate: item.rate,
                unit: item.unit,
                dispatchUnit: item.dispatchUnit,
                catalogRateUnit: item.catalogRateUnit,
              }) ?? formatOrderLinePriceAmount(item.rate!)}
            </span>
          </>
        ) : null}
        {bill != null && !showShip ? (
          <>
            <span className="font-body text-muted"> · </span>
            <span data-testid="order-line-fact-bill">
              {formatOrderLinePriceAmount(bill)}
            </span>
          </>
        ) : null}
        {money ? (
          <>
            <span className="font-body text-muted"> · </span>
            <span data-testid="order-line-money-info">{money}</span>
          </>
        ) : null}
        {showShip ? (
          <>
            <span className="font-body text-muted"> · </span>
            <span data-testid="order-line-fact-shipped">shipped {shipped}</span>
          </>
        ) : null}
        {balance ? (
          <>
            <span className="font-body text-muted"> · </span>
            <span
              className={cx('font-emphasis', orderLineBalanceValueClass(balance.tone))}
              data-testid="order-line-fact-balance"
            >
              {formatOrderLineBalance(balance.value)}
            </span>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div className={cx('flex w-full min-w-0 flex-col', className)}>
      <OrderLineFactStrip
        cells={orderLineFactCellDefs(item)}
        even={showShip}
        density={density === 'detail' ? 'detail' : 'compact'}
      />
      {captions.length > 0 ? (
        <p
          className="mt-1 text-meta font-body leading-snug text-muted"
          data-testid="order-line-billing-captions"
        >
          {captions.join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
