import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Field, TextInput, cx } from '@/ui/kit';

export function TagSuggestInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  suggestions: string[];
  placeholder?: string;
  testId?: string;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const q = value.trim().toLowerCase();
    const exact = suggestions.some((s) => s.toLowerCase() === q);
    const extra =
      q && !exact ? [`Use “${value.trim()}”`] : [];
    return [...suggestions, ...extra];
  }, [suggestions, value]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (option: string) => {
    const custom = option.startsWith('Use “')
      ? value.trim()
      : option;
    onChange(custom);
    setOpen(false);
  };

  return (
    <Field label={label}>
      <div ref={wrapRef} className="relative">
        <TextInput
          value={value}
          data-testid={testId}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setOpen(false);
            }
          }}
        />
        {open && options.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            data-testid={testId ? `${testId}-list` : undefined}
            className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-[var(--shadow-soft)]"
          >
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  className={cx(
                    'flex w-full px-3 py-2 text-left text-sm',
                    option === value ? 'bg-accent/5 font-medium text-ink' : 'text-ink',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(option)}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
