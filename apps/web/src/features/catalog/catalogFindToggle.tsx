import { cx } from '@/ui/kit';
import { SearchIcon } from '@/ui/icons';

export function CatalogFindToggle({
  open,
  onToggle,
  label,
  testId,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      aria-expanded={open}
      onClick={onToggle}
      className={cx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        open ? 'text-accent' : 'text-muted hover:bg-foam hover:text-ink',
      )}
    >
      <SearchIcon width={18} height={18} />
    </button>
  );
}
