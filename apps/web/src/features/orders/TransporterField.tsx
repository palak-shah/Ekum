import { useMemo, useState } from 'react';
import { Field, TextInput, cx } from '@/ui/kit';
import { filterTransporterHistory } from '@/features/orders/transporterMemory';

export function TransporterField({
  value,
  onChange,
  className,
  disabled,
  testId = 'transporter-field',
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(
    () => (focused ? filterTransporterHistory(value) : []),
    [focused, value],
  );
  const showList =
    focused &&
    suggestions.length > 0 &&
    !(suggestions.length === 1 && suggestions[0]!.toLowerCase() === value.trim().toLowerCase());

  return (
    <Field label="Transporter">
      <div className={cx('relative', className)}>
        <TextInput
          data-testid={testId}
          value={value}
          disabled={disabled}
          placeholder="Optional"
          autoComplete="off"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Let suggestion tap land before closing.
            window.setTimeout(() => setFocused(false), 120);
          }}
          onChange={(event) => onChange(event.target.value)}
        />
        {showList ? (
          <ul
            data-testid={`${testId}-suggestions`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-auto rounded-xl border border-line bg-surface py-1 shadow-sm"
          >
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full px-3 py-2 text-left text-sm font-medium text-ink hover:bg-foam"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(name);
                    setFocused(false);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
