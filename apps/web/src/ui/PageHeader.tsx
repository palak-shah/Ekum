import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackIcon } from './icons';
import { cx } from './kit';

/**
 * The header for detail/secondary screens: a back affordance, a title, and an
 * optional trailing action. Keeps "one screen, one job" — no competing nav.
 */
export function PageHeader({
  title,
  subtitle,
  titleEnd,
  titleTo,
  titleToState,
  action,
  below,
  onBack,
  className,
}: {
  title?: string;
  subtitle?: string;
  /** Quiet mark after the title (GST tick). */
  titleEnd?: ReactNode;
  /** When set, title + subtitle navigate here (e.g. company profile). */
  titleTo?: string;
  titleToState?: object;
  action?: ReactNode;
  /** Opens under the header actions (e.g. Find field under the search icon). */
  below?: ReactNode;
  onBack?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const showTitle = Boolean(title?.trim());
  const identity = showTitle ? (
    <>
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
        {titleEnd}
      </div>
      {subtitle ? <p className="truncate text-xs font-medium text-muted">{subtitle}</p> : null}
    </>
  ) : null;

  return (
    <header
      className={cx(
        'sticky top-0 z-30 -mx-4 shrink-0 border-b border-line bg-canvas',
        className ?? 'mb-3',
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button
          aria-label="Back"
          data-testid="page-header-back"
          className="-ml-1.5 rounded-full p-1.5 text-ink hover:bg-foam"
          onClick={() => (onBack ? onBack() : navigate(-1))}
        >
          <BackIcon />
        </button>
        {identity && titleTo ? (
          <Link
            to={titleTo}
            state={titleToState}
            className="min-w-0 flex-1 rounded-lg py-0.5 hover:bg-foam/60"
          >
            {identity}
          </Link>
        ) : identity ? (
          <div className="min-w-0 flex-1">{identity}</div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        {action}
      </div>
      {below ? <div className="px-4 pb-2.5">{below}</div> : null}
    </header>
  );
}
