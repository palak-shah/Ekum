import { useEffect, useState, type ReactNode } from 'react';
import { TextInput, cx } from '@/ui/kit';
import { ORDER_QTY_ATTR, onOrderQtyEnterKeyDown } from '@/features/orders/orderQtyFocus';

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
 * `enterKeyHint="done"` shows Done on mobile keyboards; with a parent <form>,
 * Enter/Done typically submits (Apply).
 */
export function QtyStepper({
  value,
  onChange,
  disabled,
  step = 10,
  enterKeyHint = 'done',
  chainQty = false,
  autoFocus = false,
  'aria-label': ariaLabel = 'Pieces',
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  step?: number;
  /** Mobile keyboard action label — `done` ≈ Enter on many devices. */
  enterKeyHint?: 'done' | 'go' | 'enter' | 'next' | 'search' | 'send';
  /** Enter / Next jumps to the next line qty in the sheet. */
  chainQty?: boolean;
  /** Land in the box (Same for all). Focus always selects so the next digit replaces. */
  autoFocus?: boolean;
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
        autoFocus={autoFocus}
        enterKeyHint={enterKeyHint}
        disabled={disabled}
        aria-label={ariaLabel}
        className={STEPPER_INPUT}
        value={draft}
        {...(chainQty ? { [ORDER_QTY_ATTR]: '' } : {})}
        onFocus={(event) => {
          setFocused(true);
          setDraft(String(value));
          event.currentTarget.select();
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
          if (event.key !== 'Enter') return;
          commitDraft();
          if (chainQty) onOrderQtyEnterKeyDown(event);
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

/** Idle chip after a shared rate Apply — blank until a real rate is set (never ₹0). */
export function sameForAllRateChipLabel(appliedRate: string | null | undefined): string {
  const raw = appliedRate?.trim() ?? '';
  if (!raw || raw === '0') return 'Same for all';
  return `Same for all · ₹${raw}`;
}

export const sameForAllChipClassName =
  'inline-flex w-fit items-center rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-bold tracking-tight text-ink disabled:opacity-45';

/** One-row Same for all: label · control · Apply / Cancel (Enter / mobile Done → Apply). */
export function SameForAllEditor({
  disabled,
  onApply,
  onCancel,
  children,
}: {
  disabled?: boolean;
  onApply: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      data-testid="same-for-all-editor"
      className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-line bg-foam/80 px-2.5 py-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        onApply();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <span className="shrink-0 text-[12px] font-semibold text-ink">Same for all</span>
      {children}
      <div className="ml-auto flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="text-[13px] font-bold text-accent disabled:opacity-45"
        >
          Apply
        </button>
        <button
          type="button"
          disabled={disabled}
          className="text-[13px] font-bold text-muted disabled:opacity-45"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function cxNoteLink(className?: string) {
  return cx('text-[12px] font-bold tracking-tight text-accent', className);
}
