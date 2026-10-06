import type { ReactNode } from 'react';
import { CheckIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/**
 * Selected media shrinks a little so pick is obvious. Gap is page surface — never teal.
 * Unselected stay full color.
 */
export function SelectableMediaFrame({
  selectMode,
  selected,
  children,
  checkClassName = 'left-2 top-2',
  idleCheckClassName = 'border-2 border-white/95 bg-black/45 text-transparent shadow-sm',
}: {
  selectMode: boolean;
  selected: boolean;
  children: ReactNode;
  /** Absolute position for the check on the media. */
  checkClassName?: string;
  /** Unselected-in-select-mode check chrome (e.g. translucent on dark photos). */
  idleCheckClassName?: string;
}) {
  return (
    <div
      className="relative overflow-hidden bg-surface"
      data-testid={selectMode && selected ? 'selectable-media-selected' : 'selectable-media'}
      data-selected={selectMode && selected ? 'true' : 'false'}
    >
      <div className={cx('overflow-hidden', selectMode && selected && 'scale-[0.97]')}>
        {children}
      </div>
      {selectMode ? (
        <span
          className={cx(
            'pointer-events-none absolute z-[1] flex h-8 w-8 items-center justify-center rounded-full shadow-md',
            checkClassName,
            selected
              ? 'border-2 border-white bg-accent text-white'
              : idleCheckClassName,
          )}
        >
          <CheckIcon width={18} height={18} strokeWidth={2.5} />
        </span>
      ) : null}
    </div>
  );
}
