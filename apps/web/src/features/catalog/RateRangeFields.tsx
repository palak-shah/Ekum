import { useState } from 'react';
import { Field, TextInput } from '@/ui/kit';
import { rateRangeCaption } from './rateRange';

/**
 * Single rate is the everyday job. Range is optional — revealed only when they
 * tap Add range (or already have a high end).
 */
export function RateRangeFields({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (next: string) => void;
  onTo: (next: string) => void;
}) {
  const [showTo, setShowTo] = useState(() => Boolean(to.trim()));
  const rangeOpen = showTo || Boolean(to.trim());
  const caption = rateRangeCaption(from, to);
  const danger = caption.startsWith('High rate');

  return (
    <div className="flex flex-col gap-1.5">
      {rangeOpen ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rate">
            <TextInput
              data-testid="collection-rate-from"
              value={from}
              onChange={(e) => onFrom(e.target.value)}
              inputMode="decimal"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="1200"
              aria-label="Rate"
            />
          </Field>
          <Field label="To">
            <TextInput
              data-testid="collection-rate-to"
              value={to}
              onChange={(e) => onTo(e.target.value)}
              inputMode="decimal"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="1400"
              aria-label="Rate to"
            />
          </Field>
        </div>
      ) : (
        <Field label="Rate">
          <TextInput
            data-testid="collection-rate-from"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
            inputMode="decimal"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="1200"
            aria-label="Rate"
          />
        </Field>
      )}
      <div className="flex items-baseline justify-between gap-2">
        <p
          data-testid="collection-rate-caption"
          className={danger ? 'text-xs font-medium text-danger' : 'text-xs text-muted'}
        >
          {caption}
        </p>
        {rangeOpen ? (
          <button
            type="button"
            data-testid="collection-rate-clear-range"
            className="shrink-0 text-xs font-medium text-muted"
            onClick={() => {
              onTo('');
              setShowTo(false);
            }}
          >
            Single rate
          </button>
        ) : (
          <button
            type="button"
            data-testid="collection-rate-add-range"
            className="shrink-0 text-xs font-medium text-muted"
            onClick={() => setShowTo(true)}
          >
            Add range
          </button>
        )}
      </div>
    </div>
  );
}
