import { cx } from '@/ui/kit';
import type { SelectAllAction } from './selectAllState';

/** Dock under sticky PageHeader (~3.25rem) in the same column. */
export const SELECT_FLOAT_BELOW_PAGE = 'top-[3.25rem]';

export function SelectAllFloat({
  open,
  count,
  action,
  onAction,
  offsetClass = SELECT_FLOAT_BELOW_PAGE,
}: {
  open: boolean;
  count: number;
  action: SelectAllAction;
  onAction: () => void;
  offsetClass?: string;
}) {
  if (!open) return null;

  return (
    <div
      data-testid="select-all-float"
      className={cx(
        'sticky z-[25] -mx-4 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur-md',
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
    </div>
  );
}
