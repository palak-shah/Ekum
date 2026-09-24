import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

type Props = {
  title: string;
  summary?: string | null;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  testId?: string;
};

/** Collapsed job-group row for New collection (not one combined More). */
export function CollectionExpandableSection({
  title,
  summary,
  open,
  onToggle,
  children,
  testId,
}: Props) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-line bg-surface"
      data-testid={testId}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
        aria-expanded={open}
        onClick={onToggle}
        data-testid={testId ? `${testId}-toggle` : undefined}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{title}</p>
          {summary ? <p className="mt-0.5 truncate text-xs text-muted">{summary}</p> : null}
        </div>
        <ChevronRightIcon
          width={18}
          height={18}
          aria-hidden
          className={cx('shrink-0 text-muted transition-transform', open && 'rotate-90')}
        />
      </button>
      {open ? <div className="border-t border-line px-3.5 py-3">{children}</div> : null}
    </div>
  );
}
