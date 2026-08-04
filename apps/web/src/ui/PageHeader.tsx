import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from './icons';

/**
 * The header for detail/secondary screens: a back affordance, a title, and an
 * optional trailing action. Keeps "one screen, one job" — no competing nav.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-2 bg-canvas/95 px-4 py-2.5 backdrop-blur-md">
      <button
        aria-label="Back"
        className="-ml-1.5 rounded-full p-1.5 text-ink hover:bg-foam"
        onClick={() => (onBack ? onBack() : navigate(-1))}
      >
        <BackIcon />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="truncate text-xs font-medium text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
