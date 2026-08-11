import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UniversalSearchResults } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import {
  SUGGEST_CATEGORIES,
  SUGGEST_CITIES,
  applyListSuggestion,
  filterSuggestions,
  listToken,
} from '@/lib/suggestData';
import { TextInput, cx } from '@/ui/kit';

type SuggestKind = 'city' | 'category';
type SuggestMode = 'single' | 'list';

type SuggestInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  kind: SuggestKind;
  /** `list` completes the token after the last comma (categories). */
  mode?: SuggestMode;
};

/**
 * Text input with local curated suggestions, plus live `/search` facets when
 * the user already has a company (skipped during onboarding).
 */
export function SuggestInput({
  value,
  onChange,
  kind,
  mode = 'single',
  className,
  onFocus,
  onBlur,
  ...props
}: SuggestInputProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const hasCompany = Boolean(session?.user.companyId);

  const needle = mode === 'list' ? listToken(value).token : value;
  const curated = kind === 'city' ? SUGGEST_CITIES : SUGGEST_CATEGORIES;

  const live = useQuery({
    queryKey: ['suggest', kind, needle.trim().toLowerCase()],
    queryFn: () =>
      api.get<UniversalSearchResults>('/search', { q: needle.trim(), limit: 8 }),
    enabled: hasCompany && open && needle.trim().length >= 1,
    staleTime: 30_000,
  });

  const options = useMemo(() => {
    const fromLive =
      kind === 'city' ? (live.data?.cities ?? []) : (live.data?.categories ?? []);
    const merged = [...new Set([...fromLive, ...curated])];
    return filterSuggestions(merged, needle, 8);
  }, [curated, kind, live.data?.categories, live.data?.cities, needle]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (suggestion: string) => {
    if (mode === 'list') onChange(applyListSuggestion(value, suggestion));
    else onChange(suggestion);
    setOpen(false);
  };

  const showMenu = open && options.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <TextInput
        {...props}
        value={value}
        className={className}
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onFocus={(event) => {
          setOpen(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          onBlur?.(event);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
      />
      {showMenu ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-48 overflow-y-auto rounded-[13px] border border-line bg-surface py-1 shadow-[var(--shadow-soft)]"
        >
          {options.map((option) => (
            <li key={option} role="option">
              <button
                type="button"
                className={cx(
                  'flex w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink',
                  'hover:bg-foam active:bg-foam',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
