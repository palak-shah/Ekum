import { ChevronRightIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/** Quiet expand cue — same 16px muted chevron as Timeline / can’t supply. */
export function DisclosureChevron({ open }: { open?: boolean }) {
  return (
    <ChevronRightIcon
      width={16}
      height={16}
      aria-hidden
      className={cx(
        'shrink-0 text-muted transition-transform',
        open === true && 'rotate-90',
        open == null && 'group-open:rotate-90',
      )}
    />
  );
}
