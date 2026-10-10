import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/ui/kit';

/**
 * Scroll padding when a bottom-0 dock owns the band (nav hidden).
 * AppShell must use pb-0 while the dock is up — shell pb-8 stacked here (BM-07).
 */
/** Single primary CTA (Order). */
export const BOTTOM_DOCK_CLEARANCE_CLASS =
  'pb-[calc(5rem+env(safe-area-inset-bottom))]';
/** Message · Share · Order / multi-action docks. */
export const SELECTION_DOCK_CLEARANCE_CLASS =
  'pb-[calc(7rem+env(safe-area-inset-bottom))]';

/** Hit-test must beat the tab bar / selection chip or Ask · Order feel dead. */
export function bottomTradeDockClass(aboveAppNav: boolean): string {
  return cx(
    'pointer-events-auto fixed inset-x-0 z-50 mx-auto flex max-w-md touch-manipulation gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur',
    aboveAppNav ? 'bottom-20' : 'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
  );
}

/**
 * Message · Share · Order (and similar) band. Portaled so AppShell overflow + `.ekum-rise`
 * cannot trap `fixed` under the tab bar (same lesson as camera / sheets).
 */
export function BottomTradeDock({
  testId,
  aboveAppNav,
  children,
}: {
  testId: string;
  aboveAppNav: boolean;
  children: ReactNode;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div data-testid={testId} className={bottomTradeDockClass(aboveAppNav)}>
      {children}
    </div>,
    document.body,
  );
}

/** Shared Message · Share · Order chrome (Explore floater + company shop dock). */
export function DockIconButton({
  testId,
  label,
  onClick,
  disabled,
  primary,
  badge,
  children,
}: {
  testId: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Primary trade verb — filled accent (Order). */
  primary?: boolean;
  /** Quiet count on the icon (e.g. cart size on header Cart). Not for dock Add to cart — count lives on SelectAllFloat. */
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs font-semibold',
        primary
          ? 'border-accent bg-accent text-white'
          : 'border-line bg-surface text-ink',
        'disabled:opacity-40',
      )}
    >
      <span className={cx('relative', primary ? 'text-white' : 'text-accent')}>
        {children}
        {badge != null && badge > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge px-0.5 text-[10px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </button>
  );
}
