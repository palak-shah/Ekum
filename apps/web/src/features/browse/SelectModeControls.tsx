import { cx } from '@/lib/cx';
import { SelectAllFloat } from './SelectAllFloat';
import {
  selectModeShowsActiveChrome,
  selectModeShowsEnter,
  selectModeShowsSelectAll,
} from './selectModeVisibility';

/**
 * Idle: Select. Selecting: N selected · Select all (optional) · Clear.
 * Clear always clears picks and exits Selecting.
 * `pill` = foam chip under Select (shop catalog); `inline` = same row as siblings.
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
  activeLayout = 'inline',
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
  /** Shop: pill under the catalog row so Clear is not clipped beside tabs. */
  activeLayout?: 'inline' | 'pill';
  className?: string;
}) {
  if (selectModeShowsEnter(selecting)) {
    return (
      <button
        type="button"
        data-testid={selectTestId}
        className={cx(
          'shrink-0 rounded-full px-3 py-1.5 text-xs font-emphasis text-accent hover:bg-accent/5',
          className,
        )}
        onClick={onEnterSelect}
      >
        Select
      </button>
    );
  }

  if (!selectModeShowsActiveChrome(selecting)) return null;

  if (activeLayout === 'pill') {
    return (
      <SelectAllFloat
        layout="pill"
        open
        count={count}
        allSelected={allSelected}
        onSelectAll={onSelectAll}
        onClear={onClear}
        showSelectAll={selectModeShowsSelectAll(selecting, showSelectAll)}
      />
    );
  }

  return (
    <div
      data-testid="select-all-float"
      className={cx('flex shrink-0 items-center gap-2.5', className)}
    >
      <p className="shrink-0 whitespace-nowrap text-xs font-emphasis text-ink" data-testid="select-mode-count">
        {count} selected
      </p>
      <div className="flex shrink-0 items-center gap-2.5">
        {selectModeShowsSelectAll(selecting, showSelectAll) ? (
          <button
            type="button"
            data-testid="select-all-float-select-all"
            disabled={allSelected}
            className="shrink-0 whitespace-nowrap text-xs font-emphasis text-accent disabled:opacity-40"
            onClick={onSelectAll}
          >
            Select all
          </button>
        ) : null}
        <button
          type="button"
          data-testid="select-all-float-clear"
          className="shrink-0 whitespace-nowrap text-xs font-emphasis text-accent"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
