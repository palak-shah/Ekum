import { cx } from '@/lib/cx';
import {
  selectModeShowsActiveChrome,
  selectModeShowsEnter,
  selectModeShowsSelectAll,
} from './selectModeVisibility';

/**
 * Idle: Select. Selecting: N selected · Select all (optional) · Clear.
 * Clear always clears picks and exits Selecting.
 */
export function SelectModeControls({
  selecting,
  count,
  allSelected,
  onEnterSelect,
  onSelectAll,
  onClear,
  showSelectAll = true,
  selectTestId = 'select-mode-enter',
  className,
}: {
  selecting: boolean;
  count: number;
  allSelected: boolean;
  onEnterSelect: () => void;
  onSelectAll: () => void;
  /** Deselect everything and leave Selecting. */
  onClear: () => void;
  showSelectAll?: boolean;
  selectTestId?: string;
  className?: string;
}) {
  if (selectModeShowsEnter(selecting)) {
    return (
      <button
        type="button"
        data-testid={selectTestId}
        className={cx(
          'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5',
          className,
        )}
        onClick={onEnterSelect}
      >
        Select
      </button>
    );
  }

  if (!selectModeShowsActiveChrome(selecting)) return null;

  return (
    <div
      data-testid="select-all-float"
      className={cx('flex min-w-0 flex-1 items-center gap-2.5', className)}
    >
      <p className="shrink-0 text-xs font-semibold text-ink" data-testid="select-mode-count">
        {count} selected
      </p>
      <div className="flex items-center gap-2.5">
        {selectModeShowsSelectAll(selecting, showSelectAll) ? (
          <button
            type="button"
            data-testid="select-all-float-select-all"
            disabled={allSelected}
            className="text-xs font-bold text-accent disabled:opacity-40"
            onClick={onSelectAll}
          >
            Select all
          </button>
        ) : null}
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
  );
}
