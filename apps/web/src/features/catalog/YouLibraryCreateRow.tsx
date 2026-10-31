import { PlusIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/** Quiet create row on You Collections / Catalogs / Designs (not a tab-row ＋). */
export function YouLibraryCreateRow({
  testId,
  label,
  disabled = false,
  onClick,
}: {
  testId: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2.5 border-b border-line px-1 py-1.5 text-left',
        disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-foam/40',
      )}
    >
      <span
        className={cx(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-line',
          disabled ? 'text-muted' : 'text-accent',
        )}
      >
        <PlusIcon width={18} height={18} />
      </span>
      <span
        className={cx(
          'text-base font-emphasis tracking-tight',
          disabled ? 'text-muted' : 'text-accent',
        )}
      >
        {label}
      </span>
    </button>
  );
}
