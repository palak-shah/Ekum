import { Fragment, type ReactNode } from 'react';
import {
  groupHowManyByOrderUnit,
  orderRateText,
  orderUnitSheetHeading,
  ticketTotalSummary,
  type HowManyFooterSummary,
  type HowManyQtyLine,
  type OrderUnitRole,
} from '@/features/orders/howManyLineMeta';
import { ORDER_QTY_SCOPE_ATTR } from '@/features/orders/orderQtyFocus';
import { designNameClass } from '@/ui/designLineChrome';
import { SectionHeader, cx } from '@/ui/kit';

export type { OrderUnitRole };

export { orderUnitSheetHeading, packQtyConversionWanted, orderRateText } from '@/features/orders/howManyLineMeta';

export function OrderRate(input: {
  rate?: number | null;
  rateMax?: number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  className?: string;
  testId?: string;
}) {
  const text = orderRateText(input);
  if (!text) return null;
  return (
    <span className={input.className} data-testid={input.testId}>
      {text}
    </span>
  );
}

export function OrderUnitGroups<T>({
  items,
  unitOf,
  getKey,
  role,
  layout = 'cards',
  testId,
  headingTestId,
  lineTestId,
  lineClassName = 'px-3 py-2.5',
  hideHeadingWhenSingle = false,
  children,
}: {
  items: T[];
  unitOf: (item: T) => string | null | undefined;
  getKey: (item: T) => string;
  role: OrderUnitRole;
  layout?: 'stack' | 'cards';
  testId?: string;
  headingTestId?: string;
  lineTestId?: string;
  lineClassName?: string;
  /** Ticket Designs caption already names the one family. */
  hideHeadingWhenSingle?: boolean;
  children: (item: T, index: number, last: boolean) => ReactNode;
}) {
  const groups = groupHowManyByOrderUnit(items, unitOf);
  const lastIndex = items.length - 1;
  let index = 0;
  const headingId = headingTestId ?? 'order-sheet-unit-heading';
  const showHeadings = !(hideHeadingWhenSingle && groups.length <= 1);

  return (
    <div
      className={cx('flex flex-col', layout === 'stack' ? 'gap-2.5' : 'gap-2')}
      data-testid={testId}
      {...(layout === 'stack' ? { [ORDER_QTY_SCOPE_ATTR]: '' } : {})}
    >
      {groups.map((group) => (
        <div key={group.unit} className="flex flex-col gap-2">
          {showHeadings ? (
            <div data-testid={headingId}>
              <SectionHeader title={orderUnitSheetHeading(group.unit, role)} />
            </div>
          ) : null}
          {layout === 'stack' ? (
            <ul className="overflow-x-hidden rounded-xl border border-line bg-surface">
              {group.items.map((item, itemIndex) => {
                const globalIndex = index;
                index += 1;
                return (
                  <li
                    key={getKey(item)}
                    className={cx(lineClassName, itemIndex > 0 && 'border-t border-line/70')}
                    data-testid={lineTestId}
                  >
                    {children(item, globalIndex, globalIndex === lastIndex)}
                  </li>
                );
              })}
            </ul>
          ) : (
            group.items.map((item) => {
              const globalIndex = index;
              index += 1;
              return (
                <Fragment key={getKey(item)}>
                  {children(item, globalIndex, globalIndex === lastIndex)}
                </Fragment>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}

/** Sticky How many / Dispatch This LR total. */
export function OrderUnitStickyTotal({ summary }: { summary: HowManyFooterSummary }) {
  const [first, ...rest] = summary.rows;
  if (!first) return null;
  return (
    <div data-testid="how-many-sets-summary" className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className={designNameClass}>{first}</p>
        {summary.money ? (
          <p
            className={`shrink-0 ${designNameClass}`}
            data-testid="how-many-billing-total"
          >
            {summary.money}
          </p>
        ) : null}
      </div>
      {rest.map((row) => (
        <p key={row} className={designNameClass}>
          {row}
        </p>
      ))}
    </div>
  );
}

const totalRowClass = 'flex w-full min-w-0 items-start gap-2.5';
const totalLabelClass = 'w-16 shrink-0 text-sm font-emphasis leading-tight text-ink';
const totalQtyClass =
  'min-w-0 flex-1 whitespace-nowrap text-sm font-emphasis leading-tight tabular-nums text-ink';
const totalBillClass =
  'shrink-0 text-right text-sm font-emphasis leading-tight tabular-nums text-ink';

/** Mill-bill Total: conversion when rate unit differs; ₹ omitted if pack unknown. */
export function OrderUnitTotal({
  items,
  missingPressed = false,
  onMissingToggle,
  showBill = true,
}: {
  items: HowManyQtyLine[];
  missingPressed?: boolean;
  onMissingToggle?: () => void;
  /** Seller company flag — qty always; ₹ and +Missing rates only when on. */
  showBill?: boolean;
}) {
  const counted = items.filter((item) => item.lineStatus !== 'declined');
  const summary = ticketTotalSummary(counted);
  if (!summary) return null;

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-0.5 border-t border-line px-2 pt-2"
      data-testid="order-ticket-qty-summary"
    >
      {summary.units.map((row, index) => (
        <div
          key={row.unit}
          className={totalRowClass}
          data-testid="order-ticket-unit-bill"
          data-unit={row.unit}
        >
          {index === 0 ? (
            <p className={totalLabelClass} data-testid="order-ticket-total-label">
              Total
            </p>
          ) : (
            <p className="w-16 shrink-0" aria-hidden />
          )}
          <p
            className={totalQtyClass}
            data-testid={index === 0 ? 'order-ticket-qty-total' : undefined}
          >
            {row.qty}
          </p>
          {showBill ? (
            <p
              className={totalBillClass}
              data-testid={index === 0 ? 'order-ticket-bill-total' : undefined}
            >
              {row.money ?? '\u00a0'}
            </p>
          ) : null}
        </div>
      ))}
      {showBill && summary.grand ? (
        <div className={totalRowClass} data-testid="order-ticket-grand-total">
          <p className="w-16 shrink-0" aria-hidden />
          <p className={totalQtyClass}>All</p>
          <p className={totalBillClass}>{summary.grand}</p>
        </div>
      ) : null}
      {showBill && summary.missingCue ? (
        <div className={totalRowClass} data-testid="order-ticket-missing-rates-row">
          <p className="w-16 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1" aria-hidden />
          {onMissingToggle ? (
            <button
              type="button"
              data-testid="order-ticket-missing-rates"
              aria-pressed={missingPressed}
              onClick={onMissingToggle}
              className={cx(
                'shrink-0 text-right text-sm font-emphasis leading-tight text-tangerine',
                missingPressed ? 'underline' : null,
              )}
            >
              +{summary.missingCue}
            </button>
          ) : (
            <p
              data-testid="order-ticket-missing-rates"
              className="shrink-0 text-right text-sm font-emphasis leading-tight text-tangerine"
            >
              +{summary.missingCue}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
