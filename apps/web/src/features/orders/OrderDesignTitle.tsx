import type { ReactNode } from 'react';
import { cx } from '@/ui/kit';
import { designNameClass, designSubtextClass } from '@/ui/designLineChrome';

/** Design name + optional quiet line — one component so type stays shared. */
export function OrderDesignTitle({
  name,
  subtext,
  extra,
  muted,
  nameTestId,
}: {
  name: string;
  subtext?: ReactNode;
  extra?: ReactNode;
  muted?: boolean;
  nameTestId?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p
        className={cx('min-w-0 text-pretty', designNameClass, muted && 'text-muted')}
        data-testid={nameTestId}
      >
        {name}
      </p>
      {subtext ? (
        <p className={cx('mt-0.5', designSubtextClass)}>{subtext}</p>
      ) : null}
      {extra}
    </div>
  );
}
