import { useEffect, useRef, useState } from 'react';
import { Unit, defaultRateUnit, unitValues } from '@ekum/domain-types';
import { cx } from '@/lib/cx';
import { Field, TextInput } from '@/ui/kit';
import { OptionSheetField } from '@/ui/OptionSheetField';
import { rateRangeCaption } from './rateRange';

function RateAmountInput({
  value,
  onChange,
  testId,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  testId: string;
  ariaLabel: string;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-0 w-full">
      <span
        className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 font-body text-muted"
        data-testid="collection-rate-prefix"
        aria-hidden
      >
        ₹
      </span>
      <TextInput
        data-testid={testId}
        className="w-full pl-9 pr-3.5 tabular-nums"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}

/** Keep the current Rate per visible if the category list dropped it (then coerce). */
export function ratePerSelectOptions(
  permitted: readonly string[] | undefined,
  current: string,
): string[] {
  const base = permitted && permitted.length > 0 ? [...permitted] : [...unitValues];
  if (current && !base.includes(current)) {
    return [current, ...base];
  }
  return base;
}

/**
 * Pack rate: One rate vs A range as a pill switch for the whole collection.
 * Empty rate shows no “On request” caption (Who visibility stays separate).
 * Optional rateUnit + onRateUnit → “Rate per” + unit select (collection create/edit).
 * `fixedOnly` is the design editor: same Rate per row, one amount, no range.
 */
export function RateRangeFields({
  from,
  to,
  onFrom,
  onTo,
  label = 'Rate',
  rateUnit,
  onRateUnit,
  permittedUnits,
  fixedOnly = false,
}: {
  from: string;
  to: string;
  onFrom: (next: string) => void;
  onTo: (next: string) => void;
  /** Plain label when rate-unit select is not wired. */
  label?: string;
  /** Display unit for “Rate per” (default pc). */
  rateUnit?: string;
  onRateUnit?: (next: string) => void;
  /** When set, only these units appear (category-aware). */
  permittedUnits?: string[];
  /** One amount only — no One rate / A range switch. */
  fixedOnly?: boolean;
}) {
  const [mode, setMode] = useState<'single' | 'range'>(() =>
    Boolean(to.trim()) ? 'range' : 'single',
  );
  // Hydration often sets `to` after mount — open range mode so the high end shows.
  useEffect(() => {
    if (to.trim()) setMode('range');
  }, [to]);
  const rangeOpen = !fixedOnly && mode === 'range';
  const caption = rateRangeCaption(from, to);
  const danger = caption.startsWith('High rate');
  /** Echo ₹ under the field repeats the input — only the range error stays. */
  const showCaption = danger;
  const unitSelect = Boolean(onRateUnit);
  const selectedUnit = (rateUnit?.trim() || Unit.Piece) as string;
  const unitOptions = ratePerSelectOptions(permittedUnits, selectedUnit);
  const onRateUnitRef = useRef(onRateUnit);
  onRateUnitRef.current = onRateUnit;
  // Category change can drop the current unit — coerce to the new primary.
  useEffect(() => {
    const emit = onRateUnitRef.current;
    if (!emit || !permittedUnits || permittedUnits.length === 0) return;
    if (permittedUnits.includes(selectedUnit)) return;
    emit(defaultRateUnit(permittedUnits));
  }, [permittedUnits, selectedUnit]);
  const modeAria = unitSelect ? `Rate per ${selectedUnit} mode` : `${label} mode`;
  const singleAria = unitSelect ? `Rate per ${selectedUnit}` : label;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {unitSelect ? (
          <div className="flex w-full items-center gap-2">
            <span className="shrink-0 text-sm font-emphasis text-ink">Rate per</span>
            <OptionSheetField
              className="min-w-0 flex-1"
              testId="collection-rate-unit"
              sheetTitle="Rate per"
              ariaLabel="Rate unit"
              value={selectedUnit}
              options={unitOptions.map((u) => ({ value: u, label: u }))}
              onChange={(next) => onRateUnit?.(next)}
            />
          </div>
        ) : (
          <span className="text-sm font-emphasis text-ink">{label}</span>
        )}
        {fixedOnly ? null : (
        <div
          role="radiogroup"
          aria-label={modeAria}
          data-testid="collection-rate-mode"
          className="grid grid-cols-2 rounded-full bg-foam p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!rangeOpen}
            data-testid="collection-rate-mode-single"
            className={cx(
              'min-h-8 rounded-full px-3 text-sm font-emphasis tracking-tight transition-colors',
              !rangeOpen ? 'bg-accent-soft text-accent-ink' : 'bg-transparent text-muted',
            )}
            onClick={() => {
              onTo('');
              setMode('single');
            }}
          >
            One rate
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={rangeOpen}
            data-testid="collection-rate-mode-range"
            className={cx(
              'min-h-8 rounded-full px-3 text-sm font-emphasis tracking-tight transition-colors',
              rangeOpen ? 'bg-accent-soft text-accent-ink' : 'bg-transparent text-muted',
            )}
            onClick={() => setMode('range')}
          >
            A range
          </button>
        </div>
        )}
      </div>
      {rangeOpen ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="From">
            <RateAmountInput
              testId="collection-rate-from"
              value={from}
              onChange={onFrom}
              ariaLabel="Rate from"
            />
          </Field>
          <Field label="To">
            <RateAmountInput
              testId="collection-rate-to"
              value={to}
              onChange={onTo}
              ariaLabel="Rate to"
            />
          </Field>
        </div>
      ) : (
        <RateAmountInput
          testId="collection-rate-from"
          value={from}
          onChange={onFrom}
          placeholder="Rate"
          ariaLabel={singleAria}
        />
      )}
      {showCaption && !fixedOnly ? (
        <p
          data-testid="collection-rate-caption"
          className={danger ? 'text-xs font-emphasis text-danger' : 'text-xs text-muted'}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
