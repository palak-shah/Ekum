import type { ReactNode } from 'react';
import { cx } from '@/ui/kit';

/**
 * Uniform order-line chrome:
 *   [thumb]  name · identity          [trailing — top-aligned with name]
 *            fact strip (dividers)
 * How many / builder: `trailingBelow` so the name is not clipped by − n +.
 */
export function OrderLineStack({
  photo,
  title,
  secondary,
  cues,
  facts,
  trailing,
  trailingBelow = false,
  nameEnd,
  className,
  muted,
}: {
  photo: ReactNode;
  title: ReactNode;
  secondary?: ReactNode;
  cues?: ReactNode;
  facts?: ReactNode;
  trailing?: ReactNode;
  /** Qty row under the name (Place order prototype). */
  trailingBelow?: boolean;
  /** Top-right of the line — remove × beside the product name. */
  nameEnd?: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  const titleBlock = (
    <div className={cx('min-w-0 flex-1 leading-tight', muted && 'opacity-50')}>
      {title}
      {secondary}
      {cues}
    </div>
  );
  const nameRow = (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      {titleBlock}
      {nameEnd ? <div className="shrink-0">{nameEnd}</div> : null}
    </div>
  );
  const trailingBlock = trailing ? (
    <div className={cx(trailingBelow ? 'min-w-0' : 'shrink-0')}>{trailing}</div>
  ) : null;

  return (
    <div
      className={cx('flex w-full min-w-0 items-start gap-2.5', className)}
      data-testid="order-line-stack"
    >
      <div className={cx('shrink-0', muted && 'opacity-50')}>{photo}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {trailingBelow ? (
          <>
            {nameRow}
            {trailingBlock}
          </>
        ) : (
          <div className="flex w-full min-w-0 items-start gap-2">
            {nameRow}
            {trailingBlock}
          </div>
        )}
        {facts ? (
          <div className={cx(muted && 'opacity-50')}>{facts}</div>
        ) : null}
      </div>
    </div>
  );
}
