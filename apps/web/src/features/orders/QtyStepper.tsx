import { useEffect, useState, type ReactNode } from 'react';
import { cx } from '@/ui/kit';
import {
  designSubtextClass,
  stepperBtnClass,
  stepperQtyInputClass,
  stepperTrackClass,
} from '@/ui/designLineChrome';
import { ORDER_QTY_ATTR, onOrderQtyEnterKeyDown } from '@/features/orders/orderQtyFocus';

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
 * Center field is always typeable; ± use `step` (default 1).
 * `enterKeyHint="done"` shows Done on mobile keyboards; with a parent <form>,
 * Enter/Done typically submits (Apply).
 */
function qtyDraft(value: number | null): string {
  if (value == null) return '';
  if (value < 0) return '';
  return String(value);
}

export function QtyStepper({
  value,
  onChange,
  disabled,
  step = 1,
  enterKeyHint = 'done',
  chainQty = false,
  autoFocus = false,
  unitLabel,
  inputTestId,
  align = 'end',
  'aria-label': ariaLabel = 'Pieces',
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
  step?: number;
  /** Mobile keyboard action label — `done` ≈ Enter on many devices. */
  enterKeyHint?: 'done' | 'go' | 'enter' | 'next' | 'search' | 'send';
  /** Enter / Next jumps to the next line qty in the sheet. */
  chainQty?: boolean;
  /** Land in the box (Same for all). Focus always selects so the next digit replaces. */
  autoFocus?: boolean;
  /** Visible unit caption above the stepper (e.g. Sets). */
  unitLabel?: string | null;
  /** Inner count field — Confirm / Dispatch keep their line test ids. */
  inputTestId?: string;
  align?: 'start' | 'end';
  'aria-label'?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(qtyDraft(value));

  useEffect(() => {
    if (!focused) setDraft(qtyDraft(value));
  }, [value, focused]);

  const commitDraft = () => {
    onChange(parseQtyDraft(draft));
  };

  return (
    <div className={cx('flex flex-col gap-0.5', align === 'start' ? 'items-start' : 'items-end')}>
      {unitLabel?.trim() ? (
        <span className={designSubtextClass} data-testid="qty-stepper-unit">
          {unitLabel.trim()}
        </span>
      ) : null}
    <div
      className={stepperTrackClass}
      role="group"
      aria-label={ariaLabel}
      data-testid="qty-stepper"
    >
      <button
        type="button"
        className={stepperBtnClass}
        disabled={disabled || value == null || value <= 1}
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => onChange(Math.max(1, (value ?? 1) - step))}
      >
        −
      </button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoFocus={autoFocus}
        enterKeyHint={enterKeyHint}
        disabled={disabled}
        aria-label={ariaLabel}
        data-testid={inputTestId}
        className={stepperQtyInputClass}
        value={draft}
        {...(chainQty ? { [ORDER_QTY_ATTR]: '' } : {})}
        onFocus={(event) => {
          setFocused(true);
          setDraft(qtyDraft(value));
          event.currentTarget.select();
        }}
        onBlur={() => {
          commitDraft();
          setFocused(false);
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          onChange(parseQtyDraft(raw));
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          commitDraft();
          if (chainQty) onOrderQtyEnterKeyDown(event);
        }}
      />
      <button
        type="button"
        className={stepperBtnClass}
        disabled={disabled}
        aria-label={`Increase ${ariaLabel}`}
        onClick={() => onChange(Math.min(1_000_000, (value ?? 0) + step))}
      >
        +
      </button>
    </div>
    </div>
  );
}

export function sameForAllChipLabel(appliedQty: number | null | undefined): string {
  if (appliedQty == null || appliedQty <= 0) return 'Same for all';
  return `Same for all · ${appliedQty}`;
}

/** Last typed line qty, else remembered shared qty — never open Same for all blank. */
export function seedSameForAllQty(
  typedQtys: ReadonlyArray<number | null | undefined>,
  sharedQty: number | null,
): number | null {
  for (let i = typedQtys.length - 1; i >= 0; i--) {
    const n = typedQtys[i];
    if (n != null && n > 0) return n;
  }
  return sharedQty != null && sharedQty > 0 ? sharedQty : null;
}

/** Idle chip after a shared rate Apply — blank until a real rate is set (never ₹0). */
export function sameForAllRateChipLabel(appliedRate: string | null | undefined): string {
  const raw = appliedRate?.trim() ?? '';
  if (!raw || raw === '0') return 'Same for all';
  return `Same for all · ₹${raw}`;
}

/** Confirm / quote — one chip for shared qty and/or rate. */
export function sameQtyRateForAllChipLabel(
  appliedQty: number | null | undefined,
  appliedRate: string | null | undefined,
): string {
  const bits = ['Same for all'];
  if (appliedQty != null && appliedQty > 0) bits.push(String(appliedQty));
  const raw = appliedRate?.trim() ?? '';
  if (raw && raw !== '0') bits.push(`₹${raw}`);
  return bits.join(' · ');
}

export const sameForAllChipClassName =
  'inline-flex w-fit items-center rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-emphasis tracking-tight text-ink disabled:opacity-45';

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
      <span className="shrink-0 text-[12px] font-emphasis text-ink">Same for all</span>
      {children}
      <div className="ml-auto flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="text-[13px] font-emphasis text-accent disabled:opacity-45"
        >
          Apply
        </button>
        <button
          type="button"
          className="text-[13px] font-body text-muted"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function cxNoteLink(className?: string) {
  return cx('text-[12px] font-emphasis tracking-tight text-accent', className);
}
