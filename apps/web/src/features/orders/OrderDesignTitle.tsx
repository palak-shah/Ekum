import type { ReactNode } from 'react';
import { cx } from '@/ui/kit';
import {
  designNameClass,
  designRateClass,
  designSubtextClass,
  sheetDesignNameClass,
  sheetLineCueClass,
} from '@/ui/designLineChrome';

/** Design name + optional quiet line — one component so type stays shared. */
export function OrderDesignTitle({
  name,
  subtext,
  extra,
  rate,
  muted,
  nameTestId,
  subtextTestId,
  chrome = 'default',
}: {
  name: string;
  subtext?: ReactNode;
  extra?: ReactNode;
  /** Ticket proto: Rate per on the right of the name. */
  rate?: ReactNode;
  muted?: boolean;
  nameTestId?: string;
  subtextTestId?: string;
  /** `sheet` = ticket `.dl b` / Confirm `.hd b` — 14px title (not catalog 16px). */
  chrome?: 'default' | 'sheet';
}) {
  const sheet = chrome === 'sheet';
  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <p
          className={cx(
            'min-w-0 text-pretty',
            rate ? 'flex-1 truncate' : null,
            sheet ? sheetDesignNameClass : designNameClass,
            muted && 'text-muted',
          )}
          data-testid={nameTestId}
        >
          {name}
        </p>
        {rate ? (
          <span className={designRateClass} data-testid="order-line-rate">
            {rate}
          </span>
        ) : null}
      </div>
      {subtext ? (
        <p
          className={cx('mt-0.5', sheet ? sheetLineCueClass : designSubtextClass)}
          data-testid={subtextTestId}
        >
          {subtext}
        </p>
      ) : null}
      {extra}
    </div>
  );
}
