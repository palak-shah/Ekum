import type { ReactNode } from 'react';
import { cx } from '@/ui/kit';

/**
 * Uniform order-line chrome:
 *   [thumb]  name · identity          [trailing — top-aligned with name]
 *            fact strip (dividers)
 * Trailing (qty / Done) must not float mid-stack — that looked hotch-potch.
 */
export function OrderLineStack({
  photo,
  title,
  secondary,
  cues,
  facts,
  trailing,
  className,
  muted,
}: {
  photo: ReactNode;
  title: ReactNode;
  secondary?: ReactNode;
  cues?: ReactNode;
  facts?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cx('flex min-w-0 items-start gap-2.5', className)}
      data-testid="order-line-stack"
    >
      <div className={cx('shrink-0', muted && 'opacity-50')}>{photo}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start gap-2">
          <div className={cx('min-w-0 flex-1 leading-tight', muted && 'opacity-50')}>
            {title}
            {secondary}
            {cues}
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        {facts ? (
          <div className={cx(muted && 'opacity-50')}>{facts}</div>
        ) : null}
      </div>
    </div>
  );
}
