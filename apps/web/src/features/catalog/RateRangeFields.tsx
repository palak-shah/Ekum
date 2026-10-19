import { useEffect, useState } from 'react';
import { Unit, unitValues } from '@ekum/domain-types';
import { cx } from '@/lib/cx';
import { Field, TextInput } from '@/ui/kit';
import { rateRangeCaption } from './rateRange';

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
  const unitOptions =
    permittedUnits && permittedUnits.length > 0 ? permittedUnits : [...unitValues];
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
  const showCaption = Boolean(caption);
  const unitSelect = Boolean(onRateUnit);
  const selectedUnit = (rateUnit?.trim() || Unit.Piece) as string;
  const modeAria = unitSelect ? `Rate per ${selectedUnit} mode` : `${label} mode`;
  const singleAria = unitSelect ? `Rate per ${selectedUnit}` : label;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-1">
        {unitSelect ? (
          <div className="flex w-full items-center gap-2">
            <span className="shrink-0 text-sm font-emphasis text-ink">Rate per</span>
            <select
              data-testid="collection-rate-unit"
              aria-label="Rate unit"
              value={selectedUnit}
              onChange={(e) => onRateUnit?.(e.target.value)}
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-[16px] text-ink"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
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
              !rangeOpen ? 'bg-accent text-white' : 'bg-transparent text-muted',
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
              rangeOpen ? 'bg-accent text-white' : 'bg-transparent text-muted',
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
          <Field label="From" className="gap-0.5">
            <TextInput
              data-testid="collection-rate-from"
              className="min-h-9"
              value={from}
              onChange={(e) => onFrom(e.target.value)}
              inputMode="decimal"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Rate from"
            />
          </Field>
          <Field label="To" className="gap-0.5">
            <TextInput
              data-testid="collection-rate-to"
              className="min-h-9"
              value={to}
              onChange={(e) => onTo(e.target.value)}
              inputMode="decimal"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Rate to"
            />
          </Field>
        </div>
      ) : (
        <TextInput
          data-testid="collection-rate-from"
          className="min-h-9"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          inputMode="decimal"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter rate"
          aria-label={singleAria}
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
