import { useEffect, useState } from 'react';
import { TextInput, cx } from '@/ui/kit';

const STEPPER_BTN =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-lg font-bold text-ink disabled:opacity-45';

const STEPPER_INPUT =
  'h-10 w-14 max-w-14 shrink-0 min-h-10 px-1 text-center text-base font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/** Parse typed wholesale qty — empty/invalid while typing returns null. */
export function parseQtyDraft(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 1_000_000);
}

/**
 * − [editable textbox] + for piece counts.
 * Center field is always typeable; ± use `step` (default 10).
 */
export function QtyStepper({
  value,
  onChange,
  disabled,
  step = 10,
  'aria-label': ariaLabel = 'Pieces',
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  step?: number;
  'aria-label'?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commitDraft = () => {
    const parsed = parseQtyDraft(draft);
    if (parsed != null) onChange(parsed);
    else setDraft(String(value));
  };

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={STEPPER_BTN}
        disabled={disabled || value <= 1}
        aria-label="Decrease pieces"
        onClick={() => onChange(Math.max(1, value - step))}
      >
        −
      </button>
      <TextInput
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        disabled={disabled}
        aria-label={ariaLabel}
        className={STEPPER_INPUT}
        value={focused ? draft : String(value)}
        onFocus={() => {
          setFocused(true);
          setDraft(String(value));
        }}
        onBlur={() => {
          commitDraft();
          setFocused(false);
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = parseQtyDraft(raw);
          if (parsed != null) onChange(parsed);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        className={STEPPER_BTN}
        disabled={disabled}
        aria-label="Increase pieces"
        onClick={() => onChange(Math.min(1_000_000, value + step))}
      >
        +
      </button>
    </div>
  );
}

export function sameForAllChipLabel(appliedQty: number): string {
  return `Same for all · ${appliedQty}`;
}

export function cxNoteLink(className?: string) {
  return cx('text-[12px] font-bold tracking-tight text-accent', className);
}
