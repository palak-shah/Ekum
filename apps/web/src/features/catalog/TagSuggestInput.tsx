import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CloseIcon } from '@/ui/icons';
import { Field, TextInput, cx } from '@/ui/kit';

const MAX_TAGS = 20;

function addUnique(current: string[], next: string, multiple: boolean): string[] {
  const label = next.trim();
  if (!label) return current;
  const key = label.toLowerCase();
  if (current.some((row) => row.toLowerCase() === key)) return current;
  if (!multiple) return [label];
  if (current.length >= MAX_TAGS) return current;
  return [...current, label];
}

export function TagSuggestInput({
  label,
  values,
  onChange,
  suggestionsFor,
  placeholder,
  testId,
  multiple = true,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestionsFor: (query: string) => string[];
  placeholder?: string;
  testId?: string;
  /** When false, a pick replaces the current value and closes (Size). */
  multiple?: boolean;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(multiple ? '' : (values[0] ?? ''));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!multiple) setQuery(values[0] ?? '');
  }, [multiple, values]);

  const selectedKeys = useMemo(
    () => new Set(values.map((row) => row.toLowerCase())),
    [values],
  );

  const options = useMemo(() => {
    const pool = suggestionsFor(query).filter(
      (row) => !selectedKeys.has(row.toLowerCase()),
    );
    const q = query.trim().toLowerCase();
    const exact = pool.some((row) => row.toLowerCase() === q) || selectedKeys.has(q);
    const extra = q && !exact ? [`Use “${query.trim()}”`] : [];
    return [...pool, ...extra];
  }, [query, selectedKeys, suggestionsFor]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const commit = (raw: string) => {
    const custom = raw.startsWith('Use “') ? query.trim() : raw;
    onChange(addUnique(values, custom, multiple));
    if (multiple) {
      setQuery('');
      setOpen(true);
    } else {
      setQuery(custom.trim());
      setOpen(false);
    }
  };

  const remove = (tag: string) => {
    onChange(values.filter((row) => row.toLowerCase() !== tag.toLowerCase()));
  };

  return (
    <Field label={label}>
      <div ref={wrapRef} className="relative flex flex-col gap-1.5">
        {multiple && values.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {values.map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-full items-center gap-0.5 rounded-lg bg-foam py-0.5 pl-2 pr-0.5 text-xs font-semibold text-ink"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-line/60 hover:text-ink"
                  onClick={() => remove(tag)}
                >
                  <CloseIcon width={12} height={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="relative">
          <TextInput
            value={query}
            data-testid={testId}
            placeholder={placeholder}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!multiple) {
                const next = e.target.value;
                onChange(next.trim() ? [next] : []);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (query.trim()) commit(query);
                else setOpen(false);
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
                      option === query ? 'bg-accent/5 font-medium text-ink' : 'text-ink',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
        ) : null}
        </div>
      </div>
    </Field>
  );
}
