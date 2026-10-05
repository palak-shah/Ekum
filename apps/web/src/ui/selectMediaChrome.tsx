import type { ReactNode } from 'react';
import { CheckIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/**
 * Photos-style select: selected media scales slightly (~3%) over accent teal
 * + filled teal check. Unselected stay full color — never greyed out.
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
      className={cx(
        'relative overflow-hidden',
        selectMode && selected ? 'bg-accent' : 'bg-surface',
      )}
      data-testid={selectMode && selected ? 'selectable-media-selected' : 'selectable-media'}
      data-selected={selectMode && selected ? 'true' : 'false'}
    >
      <div
        className={cx(
          'overflow-hidden transition-transform duration-150 ease-out',
          selectMode && selected && 'origin-center scale-[0.97] rounded-xl',
        )}
      >
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
