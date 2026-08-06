import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackIcon } from './icons';

/**
 * The header for detail/secondary screens: a back affordance, a title, and an
 * optional trailing action. Keeps "one screen, one job" — no competing nav.
 */
export function PageHeader({
  title,
  subtitle,
  titleTo,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  /** When set, title + subtitle navigate here (e.g. company profile). */
  titleTo?: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  const identity = (
    <>
      <h1 className="truncate text-base font-bold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="truncate text-xs font-medium text-muted">{subtitle}</p> : null}
    </>
  );

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-3 flex shrink-0 items-center gap-2 border-b border-line/80 bg-canvas/95 px-4 py-2.5 backdrop-blur-md">
      <button
        aria-label="Back"
        className="-ml-1.5 rounded-full p-1.5 text-ink hover:bg-foam"
        onClick={() => (onBack ? onBack() : navigate(-1))}
      >
        <BackIcon />
      </button>
      {titleTo ? (
        <Link to={titleTo} className="min-w-0 flex-1 rounded-lg py-0.5 hover:bg-foam/60">
          {identity}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{identity}</div>
      )}
      {action}
    </header>
  );
}
