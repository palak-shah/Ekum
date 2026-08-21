import { createPortal } from 'react-dom';
import { cx } from '@/ui/kit';
import type { SelectAllAction } from './selectAllState';

/** AppShell sticky header (~3.5rem) + PageHeader (~3.25rem). */
export const SELECT_FLOAT_BELOW_SHELL_AND_PAGE = 'top-[6.75rem]';
/** Chat thread: PageHeader only (no AppShell title bar). */
export const SELECT_FLOAT_BELOW_PAGE = 'top-[3.25rem]';

export function SelectAllFloat({
  open,
  count,
  action,
  onAction,
  offsetClass = SELECT_FLOAT_BELOW_SHELL_AND_PAGE,
}: {
  open: boolean;
  count: number;
  action: SelectAllAction;
  onAction: () => void;
  offsetClass?: string;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-testid="select-all-float"
      className={cx(
        'fixed inset-x-0 z-[25] border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur-md',
        offsetClass,
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{count} selected</p>
        <button
          type="button"
          data-testid="select-all-float-action"
          className="text-xs font-bold text-accent"
          onClick={onAction}
        >
          {action === 'clear' ? 'Clear' : 'Select all'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
