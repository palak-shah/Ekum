import { cx } from '@/ui/kit';

/** Shared Can’t supply switch — expand card, muted rows, mill desks. */
export function CantSupplySwitch({
  checked,
  busy,
  onChange,
  testId = 'order-line-cant-supply-toggle',
  label = 'Can’t supply',
}: {
  checked: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
  testId?: string;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testId}
        disabled={busy}
        className={cx(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-line',
        )}
        onClick={(event) => {
          event.stopPropagation();
          onChange(!checked);
        }}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'left-4' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
