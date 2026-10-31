import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@/ui/icons';
import { cx, listRowClass } from '@/ui/kit';

/** Compact settings row. Add a link to a domain — do not invent a new settings UI. */
export function SettingsDomainCard({
  to,
  title,
  hint,
  testId,
}: {
  to: string;
  title: string;
  hint: string;
  testId?: string;
}) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className={cx(listRowClass, 'flex items-center gap-3')}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-emphasis text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <ChevronRightIcon className="shrink-0 text-muted" width={18} height={18} />
    </Link>
  );
}

/** Light group for one Settings domain. Future features join a group or add a group. */
export function SettingsDomainGroup({
  title,
  testId,
  children,
}: {
  title: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5" data-testid={testId}>
      <h2 className="px-0.5 text-meta font-emphasis tracking-tight text-ink">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">{children}</div>
    </section>
  );
}
