import type { ReactNode } from 'react';
import { CheckIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/**
 * Selected media shrinks so pick is obvious. Gap is page surface — never a teal
 * frame on the photo. Unselected stay full color (never greyed).
 */
export function SelectableMediaFrame({
  selectMode,
  selected,
  children,
  checkClassName = 'left-2 top-2',
  idleCheckClassName = 'border border-white/95 bg-black/45 text-transparent shadow-sm',
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
      <div
        className={cx(
          /* relative so rate / +N overlays in children stay on the photo when scaled */
          'relative overflow-hidden',
          selectMode && selected && 'scale-[0.92]',
        )}
      >
        {children}
      </div>
      {selectMode ? (
        <span
          className={cx(
            'pointer-events-none absolute z-[1] flex h-[18px] w-[18px] items-center justify-center rounded-full shadow-md',
            checkClassName,
            selected
              ? 'border border-white bg-accent text-white ring-1 ring-accent/40'
              : idleCheckClassName,
          )}
        >
          <CheckIcon width={10} height={10} strokeWidth={2.75} />
        </span>
      ) : null}
    </div>
  );
}
