import { useState } from 'react';
import { ChevronDownIcon } from '@/ui/icons';
import { Sheet, cx } from '@/ui/kit';
import { FIELD_IDLE_FILL_CLASS } from '@/ui/fieldFill';

export type OptionSheetChoice = { value: string; label: string };

/**
 * Pick-one field that matches kit TextInput chrome and opens a Sheet of
 * tappable rows (ConnectionPicker selected language). Use on catalog /
 * collection / design editors instead of a native <select>.
 */
export function OptionSheetField({
  value,
  options,
  onChange,
  testId,
  sheetTitle,
  ariaLabel,
  className,
}: {
  value: string;
  options: OptionSheetChoice[];
  onChange: (next: string) => void;
  testId: string;
  sheetTitle: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((row) => row.value === value);

  return (
    <div className={cx('min-w-0', className)}>
      <button
        type="button"
        data-testid={testId}
        data-value={value}
        aria-label={ariaLabel ?? sheetTitle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cx(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-line px-3.5 text-left text-base font-body',
          FIELD_IDLE_FILL_CLASS,
          selected ? 'text-ink' : 'text-muted',
        )}
        onClick={() => setOpen(true)}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? ''}</span>
        <ChevronDownIcon className="shrink-0 text-muted" width={18} height={18} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={sheetTitle}>
        <div className="flex flex-col gap-1.5">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                data-testid={`${testId}-option-${option.value}`}
                className={cx(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                  isSelected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-emphasis text-ink">
                  {option.label}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {isSelected ? 'Selected' : 'Select'}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
