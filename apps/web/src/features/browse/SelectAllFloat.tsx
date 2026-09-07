import { cx } from '@/ui/kit';

/** Dock under sticky PageHeader (~3.25rem) in the same column. */
export const SELECT_FLOAT_BELOW_PAGE = 'top-[3.25rem]';

/**
 * Shown once selecting has started (long-press / list Select).
 * Always offers Select all + Clear — no header Select pill required.
 */
export function SelectAllFloat({
  open,
  count,
  allSelected,
  onSelectAll,
  onClear,
  offsetClass = SELECT_FLOAT_BELOW_PAGE,
}: {
  open: boolean;
  count: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="select-all-float-select-all"
            disabled={allSelected}
            className="text-xs font-bold text-accent disabled:opacity-40"
            onClick={onSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            data-testid="select-all-float-clear"
            className="text-xs font-bold text-accent"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
